// src/app/api/schools/[schoolId]/dosage/[interventionId]/sessions/[sessionId]/route.ts
/**
 * Session Management API
 * GET: Get session details
 * PATCH: Update session (log completion, mark cancelled, etc.)
 * DELETE: Remove a scheduled session
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest } from '../../../_shared/auth';
import type { DosageSessionRouteParams } from '../../../_shared/auth';
import { createDosageAnalyzer, type SessionLogInput, type SessionStatus } from '@/lib/dosage';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

export async function GET(
  request: NextRequest,
  { params }: DosageSessionRouteParams
) {
  const { schoolId, sessionId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = createAdminSupabaseClient() as AnySupabase;

    const { data: session, error } = await supabase
      .from('intervention_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('school_id', schoolId)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: session.id,
        interventionId: session.intervention_id,
        studentId: session.student_id,
        scheduledDate: session.scheduled_date,
        scheduledStartTime: session.scheduled_start_time,
        scheduledDurationMinutes: session.scheduled_duration_minutes,
        actualDate: session.actual_date,
        actualStartTime: session.actual_start_time,
        actualDurationMinutes: session.actual_duration_minutes,
        status: session.status,
        cancellationReason: session.cancellation_reason,
        deliveredBy: session.delivered_by,
        location: session.location,
        modality: session.modality,
        groupSize: session.group_size,
        fidelityChecklist: session.fidelity_checklist,
        fidelityScore: session.fidelity_score,
        fidelityNotes: session.fidelity_notes,
        studentEngaged: session.student_engaged,
        engagementNotes: session.engagement_notes,
        sessionNotes: session.session_notes,
        skillsPracticed: session.skills_practiced,
        homeworkAssigned: session.homework_assigned,
        parentCommunication: session.parent_communication,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      },
    });
  } catch (err) {
    console.error('[Session API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: DosageSessionRouteParams
) {
  const { schoolId, interventionId: _interventionId, sessionId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    // Validate status if provided
    const validStatuses: SessionStatus[] = [
      'scheduled',
      'completed',
      'partial',
      'cancelled',
      'no_show',
      'rescheduled',
    ];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid session status' },
        { status: 400 }
      );
    }

    const analyzer = createDosageAnalyzer(schoolId);

    const input: SessionLogInput = {
      sessionId,
      status: body.status,
      actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
      actualStartTime: body.actualStartTime,
      actualDurationMinutes: body.actualDurationMinutes,
      cancellationReason: body.cancellationReason,
      fidelityChecklist: body.fidelityChecklist,
      studentEngaged: body.studentEngaged,
      engagementNotes: body.engagementNotes,
      sessionNotes: body.sessionNotes,
      skillsPracticed: body.skillsPracticed,
      homeworkAssigned: body.homeworkAssigned,
      parentCommunication: body.parentCommunication,
    };

    const updatedSession = await analyzer.logSession(input);

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: updatedSession.id,
        status: updatedSession.status,
        actualDate: updatedSession.actualDate?.toISOString() || null,
        actualDurationMinutes: updatedSession.actualDurationMinutes,
        fidelityScore: updatedSession.fidelityScore,
        studentEngaged: updatedSession.studentEngaged,
      },
    });
  } catch (err) {
    console.error('[Session API] Update error:', err);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: DosageSessionRouteParams
) {
  const { schoolId, interventionId, sessionId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = createAdminSupabaseClient() as AnySupabase;

    // Only allow deleting scheduled sessions
    const { data: session } = await supabase
      .from('intervention_sessions')
      .select('status')
      .eq('id', sessionId)
      .eq('school_id', schoolId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Can only delete scheduled sessions. Cancel or reschedule instead.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('intervention_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('[Session API] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    // Recompute metrics
    const analyzer = createDosageAnalyzer(schoolId);
    await analyzer.computeMetrics(interventionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Session API] Delete error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
