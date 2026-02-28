/**
 * Schools API
 * ===========
 *
 * GET /api/schools - List all schools
 * POST /api/schools - Create a new school
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSchools, createSchool } from '@/lib/db/queries/schools';

/**
 * GET /api/schools
 * List all schools
 */
export async function GET() {
  try {
    const schools = await getAllSchools();

    return NextResponse.json({
      schools,
      total: schools.length,
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools
 * Create a new school
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!body.slug) {
      return NextResponse.json(
        { error: 'Missing required field: slug' },
        { status: 400 }
      );
    }

    const school = await createSchool(body);

    if (!school) {
      return NextResponse.json(
        { error: 'Failed to create school' },
        { status: 500 }
      );
    }

    return NextResponse.json({ school }, { status: 201 });
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
