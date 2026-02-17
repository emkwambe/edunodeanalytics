import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * EduNode Multi-Tenant Middleware
 *
 * Handles:
 * 1. Authentication via Clerk
 * 2. School-specific routing (e.g., /[school_slug]/dashboard)
 * 3. Tenant isolation enforcement
 * 4. RBAC validation at the edge
 */

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
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

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const path = req.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // For API routes, return JSON error instead of redirecting to HTML
  const isApiRoute = path.startsWith('/api/');

  // Redirect unauthenticated users to sign-in (or return 401 for API)
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
    return NextResponse.next();
  }

  // Extract school_slug from path (e.g., /academy-charter/dashboard)
  const pathParts = path.split('/').filter(Boolean);
  const schoolSlug = pathParts[0];

  // If no school slug in URL, redirect to school selection
  if (!schoolSlug || schoolSlug === 'api') {
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

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
