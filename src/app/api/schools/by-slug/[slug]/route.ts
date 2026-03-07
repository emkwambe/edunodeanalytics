/**
 * School by Slug API
 * ===================
 *
 * GET /api/schools/by-slug/[slug] - Get school by slug
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSchoolBySlug } from '@/lib/db/queries/schools';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/schools/by-slug/[slug]
 * Get school by slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const school = await getSchoolBySlug(slug);

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Return school directly for consistency with hooks
    return NextResponse.json(school);
  } catch (error) {
    console.error('Error fetching school by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}
