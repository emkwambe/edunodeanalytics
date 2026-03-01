import type { Student, Intervention } from '@/lib/database.types';
import { getAnonymizer, type AnonymizationLevel, type StudentPII } from '@/lib/privacy';

export interface CSVColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number | boolean | null);
  isPII?: boolean; // Mark columns containing PII
}

export interface ExportOptions {
  anonymize?: boolean;
  anonymizationLevel?: AnonymizationLevel;
  schoolId?: string;
  includeHeaders?: boolean;
}

export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CSVColumn<T>[]
): string {
  // Header row
  const headers = columns.map((col) => escapeCSVValue(col.header));
  const rows = [headers.join(',')];

  // Data rows
  for (const row of data) {
    const values = columns.map((col) => {
      const value = typeof col.accessor === 'function'
        ? col.accessor(row)
        : row[col.accessor];
      return escapeCSVValue(String(value ?? ''));
    });
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

function escapeCSVValue(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Student export columns with PII markers
export const studentCSVColumns: CSVColumn<Student>[] = [
  { header: 'Student ID', accessor: 'sis_student_id', isPII: true },
  { header: 'First Name', accessor: 'first_name', isPII: true },
  { header: 'Last Name', accessor: 'last_name', isPII: true },
  { header: 'Grade', accessor: 'grade_level' },
  { header: 'Homeroom Teacher', accessor: 'homeroom_teacher', isPII: true },
  { header: 'Attendance Rate', accessor: (s) => s.attendance_rate ? `${(s.attendance_rate * 100).toFixed(1)}%` : '' },
  { header: 'Risk Level', accessor: 'risk_level' },
  { header: 'Risk Score', accessor: 'risk_score' },
  { header: 'Has IEP', accessor: (s) => s.has_iep ? 'Yes' : 'No' },
  { header: 'Has 504', accessor: (s) => s.has_504_plan ? 'Yes' : 'No' },
  { header: 'English Learner', accessor: (s) => s.is_english_learner ? 'Yes' : 'No' },
  { header: 'Growth Percentile', accessor: 'growth_percentile' },
  { header: 'Proficiency Level', accessor: 'proficiency_level' },
  { header: 'Enrolled', accessor: 'enrolled_at' },
  { header: 'Active', accessor: (s) => s.is_active ? 'Yes' : 'No' },
];

// Anonymized student export columns (for external sharing)
export const anonymizedStudentCSVColumns: CSVColumn<Student>[] = [
  { header: 'Anonymous ID', accessor: 'id' }, // Uses anonymized ID
  { header: 'Pseudonym', accessor: 'first_name' }, // Will be replaced with pseudonym
  { header: 'Grade', accessor: 'grade_level' },
  { header: 'Attendance Rate', accessor: (s) => s.attendance_rate ? `${(s.attendance_rate * 100).toFixed(1)}%` : '' },
  { header: 'Risk Level', accessor: 'risk_level' },
  { header: 'Risk Score', accessor: 'risk_score' },
  { header: 'Has IEP', accessor: (s) => s.has_iep ? 'Yes' : 'No' },
  { header: 'Has 504', accessor: (s) => s.has_504_plan ? 'Yes' : 'No' },
  { header: 'English Learner', accessor: (s) => s.is_english_learner ? 'Yes' : 'No' },
  { header: 'Growth Percentile', accessor: 'growth_percentile' },
  { header: 'Proficiency Level', accessor: 'proficiency_level' },
  { header: 'Active', accessor: (s) => s.is_active ? 'Yes' : 'No' },
];

// Intervention export columns
export const interventionCSVColumns: CSVColumn<Intervention>[] = [
  { header: 'Intervention ID', accessor: 'id' },
  { header: 'Student ID', accessor: 'student_id' },
  { header: 'Type', accessor: 'type' },
  { header: 'Title', accessor: 'title' },
  { header: 'Status', accessor: 'status' },
  { header: 'Priority', accessor: 'priority' },
  { header: 'Start Date', accessor: 'start_date' },
  { header: 'Target End Date', accessor: 'target_end_date' },
  { header: 'Actual End Date', accessor: 'actual_end_date' },
  { header: 'Goal', accessor: 'goal' },
  { header: 'Was Successful', accessor: (i) => i.was_successful === null ? '' : i.was_successful ? 'Yes' : 'No' },
  { header: 'Created At', accessor: 'created_at' },
];

export function exportStudentsToCSV(students: Student[], options?: ExportOptions): string {
  if (options?.anonymize && options.schoolId) {
    return exportAnonymizedStudentsToCSV(students, options.schoolId, options.anonymizationLevel);
  }
  return generateCSV(students, studentCSVColumns);
}

/**
 * Export students with anonymized PII
 * Use this for sharing data externally or with third-party services
 */
export function exportAnonymizedStudentsToCSV(
  students: Student[],
  schoolId: string,
  level: AnonymizationLevel = 'pseudonym'
): string {
  const anonymizer = getAnonymizer(schoolId, { level });
  const session = anonymizer.getOrCreateSession();

  // Convert students to StudentPII format and anonymize
  const anonymizedStudents = students.map(student => {
    const piiData: StudentPII = {
      id: student.id,
      student_id: student.sis_student_id || undefined,
      first_name: student.first_name || undefined,
      last_name: student.last_name || undefined,
      // Include other fields that pass through
      grade_level: student.grade_level,
      attendance_rate: student.attendance_rate,
      risk_level: student.risk_level,
      risk_score: student.risk_score,
      has_iep: student.has_iep,
      has_504_plan: student.has_504_plan,
      is_english_learner: student.is_english_learner,
      growth_percentile: student.growth_percentile,
      proficiency_level: student.proficiency_level,
      is_active: student.is_active,
    };

    return anonymizer.anonymizeStudent(piiData, session.sessionId);
  });

  // Generate CSV with anonymized data
  const columns: CSVColumn<typeof anonymizedStudents[0]>[] = [
    { header: 'Anonymous ID', accessor: 'id' },
    { header: 'Pseudonym', accessor: (s) => `${s.first_name || ''} ${s.last_name || ''}`.trim() },
    { header: 'Grade', accessor: 'grade_level' as keyof typeof anonymizedStudents[0] },
    { header: 'Attendance Rate', accessor: (s) => {
      const rate = s.attendance_rate as number | undefined;
      return rate ? `${(rate * 100).toFixed(1)}%` : '';
    }},
    { header: 'Risk Level', accessor: 'risk_level' as keyof typeof anonymizedStudents[0] },
    { header: 'Risk Score', accessor: 'risk_score' as keyof typeof anonymizedStudents[0] },
    { header: 'Has IEP', accessor: (s) => s.has_iep ? 'Yes' : 'No' },
    { header: 'Has 504', accessor: (s) => s.has_504_plan ? 'Yes' : 'No' },
    { header: 'English Learner', accessor: (s) => s.is_english_learner ? 'Yes' : 'No' },
    { header: 'Growth Percentile', accessor: 'growth_percentile' as keyof typeof anonymizedStudents[0] },
    { header: 'Proficiency Level', accessor: 'proficiency_level' as keyof typeof anonymizedStudents[0] },
    { header: 'Active', accessor: (s) => s.is_active ? 'Yes' : 'No' },
  ];

  return generateCSV(anonymizedStudents as unknown as Record<string, unknown>[], columns as CSVColumn<Record<string, unknown>>[]);
}

/**
 * Export aggregate statistics only (no individual records)
 * Use this for complete anonymization when sharing with external parties
 */
export function exportAggregateStudentStats(students: Student[]): string {
  // Calculate aggregate statistics
  const stats = {
    totalStudents: students.length,
    gradeDistribution: {} as Record<string, number>,
    riskDistribution: {} as Record<string, number>,
    averageAttendance: 0,
    averageRiskScore: 0,
    averageGrowthPercentile: 0,
    iepCount: 0,
    plan504Count: 0,
    ellCount: 0,
  };

  let attendanceSum = 0;
  let attendanceCount = 0;
  let riskScoreSum = 0;
  let riskScoreCount = 0;
  let growthSum = 0;
  let growthCount = 0;

  for (const student of students) {
    // Grade distribution
    const grade = student.grade_level || 'Unknown';
    stats.gradeDistribution[grade] = (stats.gradeDistribution[grade] || 0) + 1;

    // Risk distribution
    const risk = student.risk_level || 'Unknown';
    stats.riskDistribution[risk] = (stats.riskDistribution[risk] || 0) + 1;

    // Averages
    if (student.attendance_rate != null) {
      attendanceSum += student.attendance_rate;
      attendanceCount++;
    }
    if (student.risk_score != null) {
      riskScoreSum += student.risk_score;
      riskScoreCount++;
    }
    if (student.growth_percentile != null) {
      growthSum += student.growth_percentile;
      growthCount++;
    }

    // Counts
    if (student.has_iep) stats.iepCount++;
    if (student.has_504_plan) stats.plan504Count++;
    if (student.is_english_learner) stats.ellCount++;
  }

  stats.averageAttendance = attendanceCount > 0 ? Math.round((attendanceSum / attendanceCount) * 1000) / 10 : 0;
  stats.averageRiskScore = riskScoreCount > 0 ? Math.round((riskScoreSum / riskScoreCount) * 100) / 100 : 0;
  stats.averageGrowthPercentile = growthCount > 0 ? Math.round(growthSum / growthCount) : 0;

  // Generate CSV
  const rows = [
    'Metric,Value',
    `Total Students,${stats.totalStudents}`,
    `Average Attendance Rate,${stats.averageAttendance}%`,
    `Average Risk Score,${stats.averageRiskScore}`,
    `Average Growth Percentile,${stats.averageGrowthPercentile}`,
    `Students with IEP,${stats.iepCount}`,
    `Students with 504 Plan,${stats.plan504Count}`,
    `English Learners,${stats.ellCount}`,
    '',
    'Grade Level,Count',
    ...Object.entries(stats.gradeDistribution).map(([grade, count]) => `${grade},${count}`),
    '',
    'Risk Level,Count',
    ...Object.entries(stats.riskDistribution).map(([risk, count]) => `${risk},${count}`),
  ];

  return rows.join('\n');
}

export function exportInterventionsToCSV(interventions: Intervention[]): string {
  return generateCSV(interventions, interventionCSVColumns);
}

// Helper to trigger download in browser
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download with anonymization option
 */
export function downloadAnonymizedCSV(
  students: Student[],
  schoolId: string,
  filename: string,
  level: 'pseudonym' | 'aggregate' = 'pseudonym'
): void {
  const content = level === 'aggregate'
    ? exportAggregateStudentStats(students)
    : exportAnonymizedStudentsToCSV(students, schoolId, level);

  downloadCSV(content, filename);
}
