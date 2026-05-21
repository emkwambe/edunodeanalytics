import { NextRequest, NextResponse } from 'next/server';
import { getSchoolSeed } from '@/lib/data/seed-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const seed = getSchoolSeed(slug);

  if (!seed) {
    return NextResponse.json({ data: [], total: 0 }, { status: 200 });
  }

  const gradeLevel = request.nextUrl.searchParams.get('gradeLevel');
  const teacherName = request.nextUrl.searchParams.get('teacherName');

  let students = seed.students.map((s) => ({
    id: s.id,
    first_name: s.firstName,
    last_name: s.lastName,
    display_name: s.displayName,
    grade_level: s.gradeLevel,
    homeroom_teacher: s.homeroomTeacher,
    risk_level: s.riskLevel,
    risk_score: s.riskScore,
  }));

  if (gradeLevel) {
    students = students.filter((s) => s.grade_level === parseInt(gradeLevel));
  }
  if (teacherName) {
    students = students.filter((s) =>
      s.homeroom_teacher?.toLowerCase().includes(teacherName.toLowerCase())
    );
  }

  return NextResponse.json({ data: students, total: students.length });
}