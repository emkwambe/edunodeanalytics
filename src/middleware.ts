import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * EduNode Multi-Tenant Middleware
 *
 * Handles:
 * 1. Authentication via Clerk
 * 2. School-specific routing (e.g., /[school_slug]/dashboard)
 * 3. Tenant isolation enforcement
 * 4. RBAC validation at the edge
 * 5. CORS lockdown (T1 Security)
 * 6. Content Security Policy (T1 Security)
 * 7. CSRF protection (T1 Security)
 */

// ============================================================
// SECURITY: CORS Configuration
// ============================================================

/**
 * Get allowed origins from environment variable.
 * ALLOWED_ORIGINS is comma-separated list of allowed origins.
 * Default to localhost:3000 in development.
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (envOrigins && envOrigins.trim() !== '') {
    return envOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  // Default to localhost in development
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost:3000'];
  }
  return [];
}

/**
 * Check if origin is allowed for CORS
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowed = getAllowedOrigins();

  // In development, allow localhost variations
  if (process.env.NODE_ENV === 'development') {
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return true;
    }
  }

  return allowed.includes(origin);
}

// ============================================================
// SECURITY: Content Security Policy
// ============================================================

/**
 * Content Security Policy header value.
 * Using Report-Only mode initially to catch violations before enforcing.
 */
const CSP_POLICY = [
  "default-src 'self'",
  // Scripts: self + inline (Next.js needs this) + eval (Next.js dev)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Styles: self + inline (Tailwind needs this)
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + blobs + all HTTPS sources
  "img-src 'self' data: blob: https:",
  // Connect: self + Supabase + Clerk + Stripe APIs
  "connect-src 'self' https://*.supabase.co https://*.clerk.dev https://*.clerk.com https://api.stripe.com wss://*.supabase.co",
  // Frames: self + Clerk + Stripe
  "frame-src 'self' https://*.clerk.dev https://*.clerk.com https://js.stripe.com",
  // Fonts: self + Google Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Object: none (no plugins)
  "object-src 'none'",
  // Base URI: self
  "base-uri 'self'",
  // Form action: self
  "form-action 'self'",
  // Frame ancestors: self (clickjacking protection)
  "frame-ancestors 'self'",
].join('; ');

// ============================================================
// SECURITY: CSRF Protection
// ============================================================

/**
 * CSRF cookie name
 */
const CSRF_COOKIE_NAME = 'edunode_csrf';

/**
 * CSRF header name (client must send this header with the cookie value)
 */
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a random CSRF token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Routes exempt from CSRF protection
 */
const isCSRFExemptRoute = createRouteMatcher([
  // Webhook routes use signature verification instead
  '/api/webhooks(.*)',
  // Health checks are read-only
  '/api/health(.*)',
  // Cron jobs are protected by Vercel secret
  '/api/cron(.*)',
]);

/**
 * Check if request method requires CSRF protection
 */
function requiresCSRFProtection(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

/**
 * Validate CSRF token from request
 */
function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Double submit cookie pattern: tokens must match
  return cookieToken === headerToken;
}

// ============================================================
// ROUTE MATCHERS
// ============================================================

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)',
]);

// Routes that require authentication but not school context
const isAuthOnlyRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/select-school(.*)',
  '/unauthorized(.*)',
  '/api/user(.*)',
]);

// Demo schools available for all authenticated users (development mode)
const DEMO_SCHOOLS = [
  'academy-charter',
  'academy-tomorrow',
  'innovation-prep',
  'stem-scholars',
];

// Check if we're in development/demo mode
// In dev mode, allow all authenticated users to access any school
const isDemoMode = process.env.NODE_ENV !== 'production' || process.env.EDUNODE_DEMO_MODE === 'true';

// ============================================================
// MIDDLEWARE
// ============================================================

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const path = req.nextUrl.pathname;
  const method = req.method;
  const origin = req.headers.get('origin');

  // ============================================================
  // CORS: Handle preflight OPTIONS requests
  // ============================================================
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });

    if (isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin!);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      response.headers.set(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
      );
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    return response;
  }

  // ============================================================
  // CSRF: Validate on mutation endpoints (POST/PUT/PATCH/DELETE)
  // ============================================================
  const isApiRoute = path.startsWith('/api/');

  if (isApiRoute && requiresCSRFProtection(method) && !isCSRFExemptRoute(req)) {
    if (!validateCSRFToken(req)) {
      return NextResponse.json(
        { error: 'CSRF validation failed', message: 'Missing or invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // ============================================================
  // AUTH: Allow public routes
  // ============================================================
  if (isPublicRoute(req)) {
    const response = NextResponse.next();
    addSecurityHeaders(response, origin);
    ensureCSRFCookie(response, req);
    return response;
  }

  // For API routes, return JSON error instead of redirecting to HTML
  if (!userId) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Allow auth-only routes without school context
  if (isAuthOnlyRoute(req)) {
    const response = NextResponse.next();
    addSecurityHeaders(response, origin);
    ensureCSRFCookie(response, req);
    return response;
  }

  // Extract school_slug from path (e.g., /academy-charter/dashboard)
  const pathParts = path.split('/').filter(Boolean);
  const schoolSlug = pathParts[0];

  // For authenticated API routes, let the route handlers deal with authorization
  // This prevents redirecting API calls to HTML pages
  if (isApiRoute) {
    const response = NextResponse.next();
    addSecurityHeaders(response, origin);
    ensureCSRFCookie(response, req);
    return response;
  }

  // If no school slug in URL, redirect to school selection
  if (!schoolSlug) {
    // Check if user has a default school in their metadata
    const userSchools = (sessionClaims?.schools as string[]) || [];

    if (userSchools.length === 1) {
      // Auto-redirect to single school
      return NextResponse.redirect(
        new URL(`/${userSchools[0]}/dashboard`, req.url)
      );
    } else if (userSchools.length > 1) {
      // Multiple schools - show selection
      return NextResponse.redirect(new URL('/select-school', req.url));
    } else {
      // No schools - onboarding
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }
  }

  // Verify user has access to the requested school
  const userSchools = (sessionClaims?.schools as string[]) || [];
  const userRole = (sessionClaims?.role as string) || 'viewer';

  // Platform admins can access any school
  const isPlatformAdmin = userRole === 'platform_admin';

  // In demo mode, allow access to demo schools for all authenticated users
  const isDemoSchool = DEMO_SCHOOLS.includes(schoolSlug);
  const hasSchoolAccess = userSchools.includes(schoolSlug);

  if (!isPlatformAdmin && !hasSchoolAccess) {
    // In development mode, allow all authenticated users to access demo schools
    if (isDemoMode) {
      console.log(
        `[RBAC] Dev mode: Allowing user ${userId} access to school ${schoolSlug}`
      );
      // Allow access in dev mode for any school
    } else if (isDemoSchool) {
      // In production demo mode, only allow demo schools
      console.log(
        `[RBAC] Demo school: Allowing user ${userId} access to demo school ${schoolSlug}`
      );
    } else {
      // User doesn't have access to this school
      console.warn(
        `[RBAC] User ${userId} attempted to access ${schoolSlug} without permission`
      );
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Access denied to this school' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // RBAC: Restrict Authorizer role to specific routes
  const isAuthorizerRole = userRole === 'authorizer';
  const subRoute = pathParts.length > 1 ? pathParts[1] : '';

  // Authorizer-restricted routes (they can ONLY access /authorizer)
  const restrictedRoutesForAuthorizer = [
    'interventions',
    'settings',
    'student-360',
    'dashboard/students',
  ];

  if (isAuthorizerRole && restrictedRoutesForAuthorizer.some((r) => subRoute.startsWith(r))) {
    console.warn(
      `[RBAC] Authorizer ${userId} attempted to access restricted route: ${path}`
    );
    // Redirect authorizers to their allowed portal
    return NextResponse.redirect(new URL(`/${schoolSlug}/authorizer`, req.url));
  }

  // Ensure authorizers can only see the authorizer portal
  if (isAuthorizerRole && subRoute !== 'authorizer' && subRoute !== '') {
    // Allow dashboard overview but redirect other routes
    if (subRoute !== 'dashboard' && !subRoute.startsWith('analytics')) {
      console.log(
        `[RBAC] Redirecting authorizer ${userId} from ${subRoute} to authorizer portal`
      );
      return NextResponse.redirect(new URL(`/${schoolSlug}/authorizer`, req.url));
    }
  }

  // Add tenant context to headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', schoolSlug);
  response.headers.set('x-user-role', userRole);

  // Set tenant context cookie for client-side access
  response.cookies.set('edunode_tenant', schoolSlug, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  addSecurityHeaders(response, origin);
  ensureCSRFCookie(response, req);

  return response;
});

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, origin: string | null): void {
  // CORS headers for allowed origins
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Content Security Policy (Report-Only mode for initial deployment)
  response.headers.set('Content-Security-Policy-Report-Only', CSP_POLICY);

  // Additional security headers (not set in next.config.js for API routes)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Ensure CSRF cookie is set for all responses
 */
function ensureCSRFCookie(response: NextResponse, request: NextRequest): void {
  // Only set if not already present
  if (!request.cookies.get(CSRF_COOKIE_NAME)) {
    const token = generateCSRFToken();
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Client needs to read this for the header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
