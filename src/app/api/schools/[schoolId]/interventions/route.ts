/**
 * Interventions API
 * =================
 *
 * GET /api/schools/[schoolId]/interventions - List interventions for a school
 * POST /api/schools/[schoolId]/interventions - Create a new intervention
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getInterventionsBySchool,
  createIntervention,
} from '@/lib/db/queries/interventions';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/interventions
 * List interventions for a school with pagination, sorting, and filtering
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

    // Pagination params
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Sorting params
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Filtering params
    const status = searchParams.get('status') as
      | 'planned'
      | 'in_progress'
      | 'completed'
      | 'cancelled'
      | null;
    const type = searchParams.get('type') as
      | 'academic'
      | 'attendance'
      | 'behavior'
      | 'sel'
      | 'family_engagement'
      | null;
    const urgency = searchParams.get('urgency');

    const options: {
      limit: number;
      offset: number;
      status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
      type?: 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement';
    } = {
      limit,
      offset,
    };

    if (status) {
      options.status = status;
    }
    if (type) {
      options.type = type;
    }

    const { data, count } = await getInterventionsBySchool(schoolId, options);

    // Apply sorting (in-memory for now, as the query function doesn't support custom sorting)
    let sortedData = [...data];
    if (sortBy && sortOrder) {
      sortedData.sort((a, b) => {
        const aValue = a[sortBy as keyof typeof a];
        const bValue = b[sortBy as keyof typeof b];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Filter by urgency/priority if provided
    if (urgency) {
      sortedData = sortedData.filter((intervention) => intervention.priority === urgency);
    }

    return NextResponse.json({
      data: sortedData,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: offset + limit < count,
      },
    });
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interventions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools/[schoolId]/interventions
 * Create a new intervention
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

    // Validate required fields
    if (!body.student_id) {
      return NextResponse.json(
        { error: 'Missing required field: student_id' },
        { status: 400 }
      );
    }
    if (!body.type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }
    if (!body.title) {
      return NextResponse.json(
        { error: 'Missing required field: title' },
        { status: 400 }
      );
    }

    const intervention = await createIntervention({
      school_id: schoolId,
      student_id: body.student_id,
      created_by_user_id: body.created_by_user_id || null,
      assigned_to_user_id: body.assigned_to_user_id || null,
      type: body.type,
      title: body.title,
      description: body.description || null,
      status: body.status || 'planned',
      priority: body.priority || 'medium',
      start_date: body.start_date || null,
      target_end_date: body.target_end_date || null,
      goal: body.goal || null,
      success_criteria: body.success_criteria || null,
      baseline_value: body.baseline_value || null,
      target_value: body.target_value || null,
      current_value: body.current_value || null,
      progress_notes: body.progress_notes || null,
      metadata: body.metadata || null,
    });

    if (!intervention) {
      return NextResponse.json(
        { error: 'Failed to create intervention' },
        { status: 500 }
      );
    }

    return NextResponse.json(intervention, { status: 201 });
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json(
      { error: 'Failed to create intervention' },
      { status: 500 }
    );
  }
}
