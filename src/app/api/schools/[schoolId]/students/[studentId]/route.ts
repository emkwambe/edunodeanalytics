/**
 * Single Student API
 * ==================
 *
 * GET /api/schools/[schoolId]/students/[studentId] - Get a student by ID
 * PATCH /api/schools/[schoolId]/students/[studentId] - Update a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStudentById, updateStudent } from '@/lib/db/queries/students';

interface RouteParams {
  params: Promise<{ schoolId: string; studentId: string }>;
}

/**
 * GET /api/schools/[schoolId]/students/[studentId]
 * Get a single student by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { studentId } = await params;

    const student = await getStudentById(studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/schools/[schoolId]/students/[studentId]
 * Update a student
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { studentId } = await params;
    const body = await request.json();

    // First check if the student exists
    const existingStudent = await getStudentById(studentId);
    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const updatedStudent = await updateStudent(studentId, body);

    if (!updatedStudent) {
      return NextResponse.json(
        { error: 'Failed to update student' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}
