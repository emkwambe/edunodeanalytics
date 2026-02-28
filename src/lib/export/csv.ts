import type { Student, Intervention } from '@/lib/database.types';

export interface CSVColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => string | number | boolean | null);
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

// Student export columns
export const studentCSVColumns: CSVColumn<Student>[] = [
  { header: 'Student ID', accessor: 'sis_student_id' },
  { header: 'First Name', accessor: 'first_name' },
  { header: 'Last Name', accessor: 'last_name' },
  { header: 'Grade', accessor: 'grade_level' },
  { header: 'Homeroom Teacher', accessor: 'homeroom_teacher' },
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

export function exportStudentsToCSV(students: Student[]): string {
  return generateCSV(students, studentCSVColumns);
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
