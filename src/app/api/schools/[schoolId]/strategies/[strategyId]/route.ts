/**
 * Single Strategy API
 * ===================
 *
 * GET /api/schools/[schoolId]/strategies/[strategyId] - Get strategy by ID
 * PATCH /api/schools/[schoolId]/strategies/[strategyId] - Update a strategy
 * DELETE /api/schools/[schoolId]/strategies/[strategyId] - Delete a strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getStrategyById,
  updateStrategy,
  deleteStrategy,
} from '@/lib/db/queries/strategies';
import { updateStrategySchema } from '@/lib/mtss/validation';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';
import { ZodError } from 'zod';

interface RouteParams {
  params: Promise<{ schoolId: string; strategyId: string }>;
}

/**
 * GET /api/schools/[schoolId]/strategies/[strategyId]
 * Get a single strategy by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { strategyId } = await params;

    const strategy = await getStrategyById(strategyId);

    if (!strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(strategy);
  } catch (error) {
    console.error('Error fetching strategy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategy' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/schools/[schoolId]/strategies/[strategyId]
 * Update an existing strategy (user-created only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { strategyId } = await params;
    const body = await request.json();

    // Check if strategy exists
    const existing = await getStrategyById(strategyId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    // Only allow updating user-created strategies
    if (existing.source === 'system') {
      return NextResponse.json(
        { error: 'Cannot modify system strategies' },
        { status: 403 }
      );
    }

    // Validate input
    const validatedData = updateStrategySchema.parse(body);

    const updatedStrategy = await updateStrategy(strategyId, validatedData);

    if (!updatedStrategy) {
      return NextResponse.json(
        { error: 'Failed to update strategy' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedStrategy);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating strategy:', error);
    return NextResponse.json(
      { error: 'Failed to update strategy' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schools/[schoolId]/strategies/[strategyId]
 * Delete a strategy (user-created only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { strategyId } = await params;

    // Check if strategy exists
    const existing = await getStrategyById(strategyId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    // Only allow deleting user-created strategies
    if (existing.source === 'system') {
      return NextResponse.json(
        { error: 'Cannot delete system strategies' },
        { status: 403 }
      );
    }

    const success = await deleteStrategy(strategyId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete strategy' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json(
      { error: 'Failed to delete strategy' },
      { status: 500 }
    );
  }
}
