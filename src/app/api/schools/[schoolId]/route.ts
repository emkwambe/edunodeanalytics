/**
 * Single School API
 * =================
 *
 * GET /api/schools/[schoolId] - Get school by ID
 * PATCH /api/schools/[schoolId] - Update school
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSchoolById, updateSchool } from '@/lib/db/queries/schools';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]
 * Get school by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;

    const school = await getSchoolById(schoolId);

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/schools/[schoolId]
 * Update school
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { schoolId } = await params;
    const body = await request.json();

    // Check if school exists first
    const existingSchool = await getSchoolById(schoolId);

    if (!existingSchool) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const school = await updateSchool(schoolId, body);

    if (!school) {
      return NextResponse.json(
        { error: 'Failed to update school' },
        { status: 500 }
      );
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}
