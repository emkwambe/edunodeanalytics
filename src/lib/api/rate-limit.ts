/**
 * API Rate Limiting Middleware
 * ============================
 *
 * Provides rate limiting for API routes using Redis sliding window.
 * Falls back to allowing all requests in development or when Redis unavailable.
 *
 * Usage:
 *   import { withRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';
 *
 *   export const GET = withRateLimit(
 *     async (request) => { ... },
 *     RATE_LIMITS.standard
 *   );
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit } from '@/lib/cache/redis';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Key prefix for namespacing different rate limits */
  keyPrefix?: string;
}

/**
 * Pre-configured rate limits for common use cases
 */
export const RATE_LIMITS = {
  /** Standard API endpoints: 100 requests per minute */
  standard: {
    maxRequests: 100,
    windowSeconds: 60,
    keyPrefix: 'api',
  },
  /** Auth endpoints: 10 requests per minute (prevent brute force) */
  auth: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'auth',
  },
  /** Search/query endpoints: 30 requests per minute */
  search: {
    maxRequests: 30,
    windowSeconds: 60,
    keyPrefix: 'search',
  },
  /** Export endpoints: 5 requests per minute (expensive operations) */
  export: {
    maxRequests: 5,
    windowSeconds: 60,
    keyPrefix: 'export',
  },
  /** Webhook endpoints: 1000 requests per minute (high throughput) */
  webhook: {
    maxRequests: 1000,
    windowSeconds: 60,
    keyPrefix: 'webhook',
  },
  /** AI/expensive endpoints: 20 requests per minute */
  ai: {
    maxRequests: 20,
    windowSeconds: 60,
    keyPrefix: 'ai',
  },
  /** Billing operations: 10 requests per minute */
  billing: {
    maxRequests: 10,
    windowSeconds: 60,
    keyPrefix: 'billing',
  },
} as const;

/**
 * Extract rate limit key from request
 * Uses user ID if authenticated, falls back to IP
 */
async function getRateLimitKey(
  request: NextRequest,
  keyPrefix: string
): Promise<string> {
  // Try to get authenticated user ID
  try {
    const { userId } = await auth();
    if (userId) {
      return `${keyPrefix}:user:${userId}`;
    }
  } catch {
    // Auth not available, use IP
  }

  // Fall back to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `${keyPrefix}:ip:${ip}`;
}

/**
 * Rate limit response with standard headers
 */
function rateLimitResponse(
  remaining: number,
  resetIn: number
): NextResponse {
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: resetIn,
    },
    {
      status: 429,
      headers: {
        'Retry-After': resetIn.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetIn.toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to successful response
 */
function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetIn: number,
  limit: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetIn.toString());
  return response;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 *
 * @param handler - The API route handler function
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting applied
 *
 * @example
 * ```ts
 * export const GET = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ data: 'hello' });
 *   },
 *   RATE_LIMITS.standard
 * );
 * ```
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
  config: RateLimitConfig = RATE_LIMITS.standard
): (request: T, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (request: T, context?: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const key = await getRateLimitKey(request, config.keyPrefix || 'api');

    const { allowed, remaining, resetIn } = await checkRateLimit(
      key,
      config.maxRequests,
      config.windowSeconds
    );

    if (!allowed) {
      return rateLimitResponse(remaining, resetIn);
    }

    // Execute the actual handler
    const response = await handler(request, context);

    // Add rate limit headers to response
    return addRateLimitHeaders(response, remaining, resetIn, config.maxRequests);
  };
}

/**
 * Standalone rate limit check (for use in existing handlers)
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.billing);
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response;
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export async function checkApiRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.standard
): Promise<{
  allowed: boolean;
  remaining: number;
  resetIn: number;
  response?: NextResponse;
}> {
  const key = await getRateLimitKey(request, config.keyPrefix || 'api');

  const { allowed, remaining, resetIn } = await checkRateLimit(
    key,
    config.maxRequests,
    config.windowSeconds
  );

  if (!allowed) {
    return {
      allowed: false,
      remaining,
      resetIn,
      response: rateLimitResponse(remaining, resetIn),
    };
  }

  return { allowed: true, remaining, resetIn };
}
