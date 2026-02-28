/**
 * Single Intervention API
 * =======================
 *
 * GET /api/schools/[schoolId]/interventions/[interventionId] - Get intervention by ID
 * PATCH /api/schools/[schoolId]/interventions/[interventionId] - Update an intervention
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getInterventionById,
  updateIntervention,
} from '@/lib/db/queries/interventions';

interface RouteParams {
  params: Promise<{ schoolId: string; interventionId: string }>;
}

/**
 * GET /api/schools/[schoolId]/interventions/[interventionId]
 * Get a single intervention by ID with student data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { interventionId } = await params;

    const intervention = await getInterventionById(interventionId);

    if (!intervention) {
      return NextResponse.json(
        { error: 'Intervention not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('Error fetching intervention:', error);
    return NextResponse.json(
      { error: 'Failed to fetch intervention' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/schools/[schoolId]/interventions/[interventionId]
 * Update an existing intervention
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { interventionId } = await params;
    const body = await request.json();

    // Check if intervention exists
    const existing = await getInterventionById(interventionId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Intervention not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};

    const allowedFields = [
      'assigned_to_user_id',
      'type',
      'title',
      'description',
      'status',
      'priority',
      'start_date',
      'target_end_date',
      'actual_end_date',
      'goal',
      'success_criteria',
      'baseline_value',
      'target_value',
      'current_value',
      'progress_notes',
      'outcome_summary',
      'was_successful',
      'metadata',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedIntervention = await updateIntervention(interventionId, updates);

    if (!updatedIntervention) {
      return NextResponse.json(
        { error: 'Failed to update intervention' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedIntervention);
  } catch (error) {
    console.error('Error updating intervention:', error);
    return NextResponse.json(
      { error: 'Failed to update intervention' },
      { status: 500 }
    );
  }
}
