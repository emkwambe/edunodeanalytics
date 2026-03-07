// src/app/api/schools/[schoolId]/dosage/[interventionId]/sessions/route.ts
/**
 * Intervention Sessions API
 * GET: List sessions for an intervention
 * POST: Create/schedule new sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateSchoolRequest } from '../../_shared/auth';
import type { DosageInterventionRouteParams } from '../../_shared/auth';
import { createDosageAnalyzer, type ScheduleOptions, type SessionModality } from '@/lib/dosage';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;

export async function GET(
  request: NextRequest,
  { params }: DosageInterventionRouteParams
) {
  const { schoolId, interventionId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  try {
    const supabase = createAdminSupabaseClient() as AnySupabase;

    let query = supabase
      .from('intervention_sessions')
      .select('*')
      .eq('intervention_id', interventionId)
      .eq('school_id', schoolId)
      .order('scheduled_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }
    if (fromDate) {
      query = query.gte('scheduled_date', fromDate);
    }
    if (toDate) {
      query = query.lte('scheduled_date', toDate);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('[Sessions API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: (sessions || []).map((s: Record<string, unknown>) => ({
        id: s.id,
        interventionId: s.intervention_id,
        scheduledDate: s.scheduled_date,
        scheduledStartTime: s.scheduled_start_time,
        scheduledDurationMinutes: s.scheduled_duration_minutes,
        actualDate: s.actual_date,
        actualStartTime: s.actual_start_time,
        actualDurationMinutes: s.actual_duration_minutes,
        status: s.status,
        cancellationReason: s.cancellation_reason,
        deliveredBy: s.delivered_by,
        location: s.location,
        modality: s.modality,
        groupSize: s.group_size,
        fidelityScore: s.fidelity_score,
        studentEngaged: s.student_engaged,
        sessionNotes: s.session_notes,
        parentCommunication: s.parent_communication,
        createdAt: s.created_at,
      })),
    });
  } catch (err) {
    console.error('[Sessions API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: DosageInterventionRouteParams
) {
  const { schoolId, interventionId } = await params;
  const authResult = await authenticateSchoolRequest({ schoolId });
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;

  try {
    const body = await request.json();

    // Option 1: Generate schedule automatically
    if (body.generateSchedule) {
      const scheduleOptions: ScheduleOptions = {
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        sessionsPerWeek: body.sessionsPerWeek || 3,
        minutesPerSession: body.minutesPerSession || 30,
        preferredDays: body.preferredDays,
        preferredTime: body.preferredTime,
        modality: body.modality as SessionModality | undefined,
      };

      const analyzer = createDosageAnalyzer(schoolId);
      const schedule = analyzer.generateSchedule(scheduleOptions);

      // Get student_id from intervention
      const supabase = createAdminSupabaseClient() as AnySupabase;
      const { data: intervention, error: ivError } = await supabase
        .from('interventions')
        .select('student_id')
        .eq('id', interventionId)
        .single();

      if (ivError || !intervention) {
        return NextResponse.json(
          { error: 'Intervention not found' },
          { status: 404 }
        );
      }

      // Insert sessions
      const sessionsToInsert = schedule.sessions.map((s) => ({
        intervention_id: interventionId,
        school_id: schoolId,
        student_id: intervention.student_id,
        scheduled_date: s.date.toISOString().split('T')[0],
        scheduled_start_time: s.time,
        scheduled_duration_minutes: s.duration,
        status: 'scheduled',
        modality: body.modality || 'in_person',
        created_by: userId,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('intervention_sessions')
        .insert(sessionsToInsert)
        .select();

      if (insertError) {
        console.error('[Sessions API] Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create sessions' },
          { status: 500 }
        );
      }

      // Recompute metrics
      await analyzer.computeMetrics(interventionId);

      return NextResponse.json({
        data: {
          sessionsCreated: inserted?.length || 0,
          totalMinutes: schedule.totalMinutes,
          weeksSpanned: schedule.weeksSpanned,
        },
      });
    }

    // Option 2: Create a single session
    const supabase = createAdminSupabaseClient() as AnySupabase;
    const { data: intervention, error: ivError } = await supabase
      .from('interventions')
      .select('student_id')
      .eq('id', interventionId)
      .single();

    if (ivError || !intervention) {
      return NextResponse.json(
        { error: 'Intervention not found' },
        { status: 404 }
      );
    }

    const sessionData = {
      intervention_id: interventionId,
      school_id: schoolId,
      student_id: intervention.student_id,
      scheduled_date: body.scheduledDate,
      scheduled_start_time: body.scheduledStartTime,
      scheduled_duration_minutes: body.scheduledDurationMinutes || 30,
      status: 'scheduled',
      modality: body.modality || 'in_person',
      location: body.location,
      delivered_by: body.deliveredBy,
      created_by: userId,
    };

    const { data: session, error: insertError } = await supabase
      .from('intervention_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      console.error('[Sessions API] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        id: session.id,
        scheduledDate: session.scheduled_date,
        scheduledStartTime: session.scheduled_start_time,
        status: session.status,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[Sessions API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
