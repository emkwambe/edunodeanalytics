import { NextRequest, NextResponse } from 'next/server';
import { getInterventionsBySchool } from '@/lib/db/queries/interventions';
import { exportInterventionsToCSV } from '@/lib/export';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Rate limiting for export endpoints (expensive operations)
  const rateLimitResult = await checkApiRateLimit(request, RATE_LIMITS.export);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { schoolId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Get filter options from query params
    const status = searchParams.get('status') as 'planned' | 'in_progress' | 'completed' | 'cancelled' | null;
    const type = searchParams.get('type') as 'academic' | 'attendance' | 'behavior' | 'sel' | 'family_engagement' | null;

    // Fetch all interventions (no pagination for export)
    const result = await getInterventionsBySchool(schoolId, {
      limit: 10000, // High limit for export
      status: status ?? undefined,
      type: type ?? undefined,
    });

    const csv = exportInterventionsToCSV(result.data);
    const filename = `interventions-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting interventions:', error);
    return NextResponse.json(
      { error: 'Failed to export interventions' },
      { status: 500 }
    );
  }
}
