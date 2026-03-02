/**
 * Students API
 * ============
 *
 * GET /api/schools/[schoolId]/students - List students with filtering, sorting, and pagination
 * POST /api/schools/[schoolId]/students - Create a new student
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getStudentsBySchool,
  searchStudents,
  createStudent,
  type StudentQueryOptions,
} from '@/lib/db/queries/students';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/api/rate-limit';

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/schools/[schoolId]/students
 * List students for a school with optional filtering, sorting, and pagination
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

    // Check for search query - use searchStudents if present
    const search = searchParams.get('search');
    if (search) {
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const students = await searchStudents(schoolId, search, limit);
      return NextResponse.json({
        data: students,
        total: students.length,
        limit,
        offset: 0,
        hasMore: false,
      });
    }

    // Build query options from search params
    const options: StudentQueryOptions = {};

    // Pagination
    const limit = searchParams.get('limit');
    if (limit) {
      options.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      options.offset = parseInt(offset, 10);
    }

    // Sorting
    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      options.sortBy = sortBy as StudentQueryOptions['sortBy'];
    }

    const sortOrder = searchParams.get('sortOrder');
    if (sortOrder === 'asc' || sortOrder === 'desc') {
      options.sortOrder = sortOrder;
    }

    // Filtering
    const gradeLevel = searchParams.get('gradeLevel');
    if (gradeLevel) {
      options.gradeLevel = parseInt(gradeLevel, 10);
    }

    const riskLevel = searchParams.get('riskLevel');
    if (riskLevel === 'on_track' || riskLevel === 'at_risk' || riskLevel === 'critical') {
      options.riskLevel = riskLevel;
    }

    const teacherName = searchParams.get('teacherName');
    if (teacherName) {
      options.teacherName = teacherName;
    }

    const result = await getStudentsBySchool(schoolId, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools/[schoolId]/students
 * Create a new student
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

    // Ensure the student is associated with the correct school
    const studentData = {
      ...body,
      school_id: schoolId,
    };

    const student = await createStudent(studentData);

    if (!student) {
      return NextResponse.json(
        { error: 'Failed to create student' },
        { status: 500 }
      );
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
