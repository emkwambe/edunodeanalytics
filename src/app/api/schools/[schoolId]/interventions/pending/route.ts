/**
 * Pending Interventions API
 * =========================
 *
 * GET /api/schools/[schoolId]/interventions/pending - Get pending interventions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveInterventions } from '@/lib/db/queries/interventions';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/interventions/pending
 * Get pending interventions (planned or in_progress) for a school
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Filter by urgency/priority if provided
    const urgency = searchParams.get('urgency');

    const { data, count } = await getActiveInterventions(schoolId);

    // Filter by urgency/priority if provided
    let filteredData = data;
    if (urgency) {
      filteredData = data.filter((intervention) => intervention.priority === urgency);
    }

    // Sort by priority (urgent first) and then by start_date
    const priorityOrder: Record<string, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    filteredData.sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'medium'] ?? 2;
      const bPriority = priorityOrder[b.priority || 'medium'] ?? 2;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Secondary sort by start_date
      if (a.start_date && b.start_date) {
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      }
      return 0;
    });

    return NextResponse.json({
      data: filteredData,
      total: urgency ? filteredData.length : count,
    });
  } catch (error) {
    console.error('Error fetching pending interventions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending interventions' },
      { status: 500 }
    );
  }
}
