/**
 * School by Slug API
 * ===================
 *
 * GET /api/schools/by-slug/[slug] - Get school by slug
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSchoolBySlug } from '@/lib/db/queries/schools';
import { getSchoolSeed } from '@/lib/data/seed-data';

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

    // Demo mode: return seed data if available
    const seed = getSchoolSeed(slug);
    if (seed) {
      return NextResponse.json({
        id: seed.id,
        slug: slug,
        name: seed.name,
        subscription_tier: seed.subscriptionTier,
        student_count: seed.studentCount,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const school = await getSchoolBySlug(slug);
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error('Error fetching school by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}