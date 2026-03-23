/**
 * Intervention Strategies API
 * ===========================
 *
 * GET /api/schools/[schoolId]/strategies - List strategies (system + district + user)
 * POST /api/schools/[schoolId]/strategies - Create a custom strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStrategies, createStrategy } from '@/lib/db/queries/strategies';
import { createStrategySchema, strategyQuerySchema } from '@/lib/mtss/validation';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/strategies
 * List all available intervention strategies
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const queryParams = strategyQuerySchema.parse({
      source: searchParams.get('source') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    const { data, count } = await getStrategies(schoolId, queryParams);

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit: queryParams.limit,
        offset: queryParams.offset,
        hasMore: queryParams.offset + queryParams.limit < count,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools/[schoolId]/strategies
 * Create a new custom strategy
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Rate limiting
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { schoolId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = createStrategySchema.parse(body);

    // Create the strategy
    const strategy = await createStrategy(schoolId, validatedData, body.created_by);

    if (!strategy) {
      return NextResponse.json(
        { error: 'Failed to create strategy' },
        { status: 500 }
      );
    }

    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { error: 'Failed to create strategy' },
      { status: 500 }
    );
  }
}
