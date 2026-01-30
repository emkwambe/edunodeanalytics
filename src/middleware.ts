import { authMiddleware, clerkClient } from '@clerk/nextjs';
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
 */

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health',
];

// Routes that require authentication but not school context
const authOnlyRoutes = [
  '/onboarding(.*)',
  '/select-school(.*)',
  '/api/user(.*)',
];

export default authMiddleware({
  publicRoutes,
  async afterAuth(auth, req: NextRequest) {
    const { userId, sessionClaims } = auth;
    const path = req.nextUrl.pathname;

    // Allow public routes
    if (publicRoutes.some((route) => new RegExp(route).test(path))) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Allow auth-only routes without school context
    if (authOnlyRoutes.some((route) => new RegExp(route).test(path))) {
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
    const userRole = sessionClaims?.role as string;

    // Platform admins can access any school
    const isPlatformAdmin = userRole === 'platform_admin';

    if (!isPlatformAdmin && !userSchools.includes(schoolSlug)) {
      // User doesn't have access to this school
      console.warn(
        `[RBAC] User ${userId} attempted to access ${schoolSlug} without permission`
      );
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Add tenant context to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', schoolSlug);
    response.headers.set('x-user-role', userRole || 'viewer');

    // Set tenant context cookie for client-side access
    response.cookies.set('edunode_tenant', schoolSlug, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
