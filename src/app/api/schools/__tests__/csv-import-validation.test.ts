/**
 * CSV Import Validation Tests
 * ===========================
 *
 * Tests for CSV import validation logic.
 * Covers: valid CSV parsing, missing required columns, invalid data types,
 * duplicate student IDs, and row count limits.
 *
 * T3 CI/CD & Developer Velocity - Test Coverage
 */

import { describe, it, expect } from 'vitest';

// ============================================================
// Types (mirroring route.ts types for testing)
// ============================================================

interface StudentImportRow {
  sis_student_id: string;
  first_name: string;
  last_name: string;
  grade_level: number;
  homeroom_teacher?: string;
  is_english_learner?: boolean;
  is_free_reduced_lunch?: boolean;
  has_iep?: boolean;
  has_504_plan?: boolean;
}

interface AttendanceImportRow {
  sis_student_id: string;
  days_present: number;
  days_absent: number;
  attendance_rate: number;
}

interface AssessmentImportRow {
  sis_student_id: string;
  math_score?: number;
  reading_score?: number;
  growth_percentile?: number;
  proficiency_level?: number;
}

interface ImportRequest {
  importType: 'students' | 'attendance' | 'assessments';
  data: StudentImportRow[] | AttendanceImportRow[] | AssessmentImportRow[];
}

interface ValidationError {
  row: number;
  message: string;
}

// ============================================================
// Validation Functions (mirroring route.ts logic)
// ============================================================

function validateStudentRow(row: StudentImportRow, index: number): ValidationError | null {
  // Check required fields
  if (!row.sis_student_id || !row.first_name || !row.last_name) {
    return {
      row: index + 1,
      message: 'Missing required field: sis_student_id, first_name, or last_name',
    };
  }

  // Check grade level
  if (row.grade_level === undefined || row.grade_level < 0 || row.grade_level > 12) {
    return {
      row: index + 1,
      message: `Invalid grade_level: ${row.grade_level}`,
    };
  }

  return null;
}

function validateAttendanceRow(row: AttendanceImportRow, index: number): ValidationError | null {
  if (!row.sis_student_id) {
    return { row: index + 1, message: 'Missing sis_student_id' };
  }

  if (row.attendance_rate === undefined || row.attendance_rate < 0 || row.attendance_rate > 1) {
    return {
      row: index + 1,
      message: `Invalid attendance_rate: ${row.attendance_rate}. Must be between 0 and 1.`,
    };
  }

  return null;
}

function validateAssessmentRow(row: AssessmentImportRow, index: number): ValidationError | null {
  if (!row.sis_student_id) {
    return { row: index + 1, message: 'Missing sis_student_id' };
  }

  return null;
}

function validateImportRequest(body: unknown): { valid: boolean; error?: string } {
  const request = body as ImportRequest;

  if (!request.importType || !request.data || !Array.isArray(request.data)) {
    return { valid: false, error: 'Invalid request: importType and data array required' };
  }

  if (request.data.length === 0) {
    return { valid: false, error: 'No data to import' };
  }

  if (request.data.length > 5000) {
    return { valid: false, error: 'Maximum 5000 rows per import' };
  }

  const validImportTypes = ['students', 'attendance', 'assessments'];
  if (!validImportTypes.includes(request.importType)) {
    return { valid: false, error: `Invalid import type: ${request.importType}` };
  }

  return { valid: true };
}

function findDuplicateStudentIds(rows: StudentImportRow[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const row of rows) {
    if (seen.has(row.sis_student_id)) {
      if (!duplicates.includes(row.sis_student_id)) {
        duplicates.push(row.sis_student_id);
      }
    } else {
      seen.add(row.sis_student_id);
    }
  }

  return duplicates;
}

// ============================================================
// Tests
// ============================================================

describe('CSV Import Validation', () => {
  describe('Import Request Validation', () => {
    it('rejects request without importType', () => {
      const result = validateImportRequest({ data: [{}] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('importType');
    });

    it('rejects request without data array', () => {
      const result = validateImportRequest({ importType: 'students' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('data array required');
    });

    it('rejects empty data array', () => {
      const result = validateImportRequest({ importType: 'students', data: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No data to import');
    });

    it('rejects data exceeding 5000 rows', () => {
      const largeData = Array(5001).fill({});
      const result = validateImportRequest({ importType: 'students', data: largeData });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Maximum 5000 rows per import');
    });

    it('accepts valid request at exactly 5000 rows', () => {
      const maxData = Array(5000).fill({});
      const result = validateImportRequest({ importType: 'students', data: maxData });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid import type', () => {
      const result = validateImportRequest({ importType: 'invalid', data: [{}] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid import type');
    });

    it('accepts valid students import type', () => {
      const result = validateImportRequest({ importType: 'students', data: [{}] });
      expect(result.valid).toBe(true);
    });

    it('accepts valid attendance import type', () => {
      const result = validateImportRequest({ importType: 'attendance', data: [{}] });
      expect(result.valid).toBe(true);
    });

    it('accepts valid assessments import type', () => {
      const result = validateImportRequest({ importType: 'assessments', data: [{}] });
      expect(result.valid).toBe(true);
    });
  });

  describe('Student Row Validation', () => {
    it('accepts valid student row with all required fields', () => {
      const row: StudentImportRow = {
        sis_student_id: 'STU001',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: 5,
      };
      expect(validateStudentRow(row, 0)).toBeNull();
    });

    it('accepts valid student row with optional fields', () => {
      const row: StudentImportRow = {
        sis_student_id: 'STU001',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: 5,
        homeroom_teacher: 'Ms. Smith',
        is_english_learner: true,
        is_free_reduced_lunch: true,
        has_iep: false,
        has_504_plan: false,
      };
      expect(validateStudentRow(row, 0)).toBeNull();
    });

    it('rejects row missing sis_student_id', () => {
      const row = {
        sis_student_id: '',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: 5,
      } as StudentImportRow;
      const error = validateStudentRow(row, 0);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Missing required field');
    });

    it('rejects row missing first_name', () => {
      const row = {
        sis_student_id: 'STU001',
        first_name: '',
        last_name: 'Doe',
        grade_level: 5,
      } as StudentImportRow;
      const error = validateStudentRow(row, 0);
      expect(error).not.toBeNull();
    });

    it('rejects row missing last_name', () => {
      const row = {
        sis_student_id: 'STU001',
        first_name: 'John',
        last_name: '',
        grade_level: 5,
      } as StudentImportRow;
      const error = validateStudentRow(row, 0);
      expect(error).not.toBeNull();
    });

    it('rejects negative grade level', () => {
      const row: StudentImportRow = {
        sis_student_id: 'STU001',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: -1,
      };
      const error = validateStudentRow(row, 0);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Invalid grade_level');
    });

    it('rejects grade level above 12', () => {
      const row: StudentImportRow = {
        sis_student_id: 'STU001',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: 13,
      };
      const error = validateStudentRow(row, 0);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Invalid grade_level');
    });

    it('accepts grade level 0 (kindergarten)', () => {
      const row: StudentImportRow = {
        sis_student_id: 'STU001',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: 0,
      };
      expect(validateStudentRow(row, 0)).toBeNull();
    });

    it('accepts grade level 12', () => {
      const row: StudentImportRow = {
        sis_student_id: 'STU001',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: 12,
      };
      expect(validateStudentRow(row, 0)).toBeNull();
    });

    it('returns correct row number in error (1-indexed)', () => {
      const row = {
        sis_student_id: '',
        first_name: 'John',
        last_name: 'Doe',
        grade_level: 5,
      } as StudentImportRow;
      const error = validateStudentRow(row, 4);
      expect(error?.row).toBe(5);
    });
  });

  describe('Attendance Row Validation', () => {
    it('accepts valid attendance row', () => {
      const row: AttendanceImportRow = {
        sis_student_id: 'STU001',
        days_present: 90,
        days_absent: 10,
        attendance_rate: 0.9,
      };
      expect(validateAttendanceRow(row, 0)).toBeNull();
    });

    it('rejects row missing sis_student_id', () => {
      const row = {
        sis_student_id: '',
        days_present: 90,
        days_absent: 10,
        attendance_rate: 0.9,
      } as AttendanceImportRow;
      const error = validateAttendanceRow(row, 0);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Missing sis_student_id');
    });

    it('rejects attendance rate below 0', () => {
      const row: AttendanceImportRow = {
        sis_student_id: 'STU001',
        days_present: 90,
        days_absent: 10,
        attendance_rate: -0.1,
      };
      const error = validateAttendanceRow(row, 0);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Invalid attendance_rate');
    });

    it('rejects attendance rate above 1', () => {
      const row: AttendanceImportRow = {
        sis_student_id: 'STU001',
        days_present: 100,
        days_absent: 0,
        attendance_rate: 1.01,
      };
      const error = validateAttendanceRow(row, 0);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Invalid attendance_rate');
    });

    it('accepts attendance rate of exactly 0', () => {
      const row: AttendanceImportRow = {
        sis_student_id: 'STU001',
        days_present: 0,
        days_absent: 100,
        attendance_rate: 0,
      };
      expect(validateAttendanceRow(row, 0)).toBeNull();
    });

    it('accepts attendance rate of exactly 1', () => {
      const row: AttendanceImportRow = {
        sis_student_id: 'STU001',
        days_present: 100,
        days_absent: 0,
        attendance_rate: 1,
      };
      expect(validateAttendanceRow(row, 0)).toBeNull();
    });
  });

  describe('Assessment Row Validation', () => {
    it('accepts valid assessment row with all scores', () => {
      const row: AssessmentImportRow = {
        sis_student_id: 'STU001',
        math_score: 85,
        reading_score: 90,
        growth_percentile: 75,
        proficiency_level: 3,
      };
      expect(validateAssessmentRow(row, 0)).toBeNull();
    });

    it('accepts assessment row with only required fields', () => {
      const row: AssessmentImportRow = {
        sis_student_id: 'STU001',
      };
      expect(validateAssessmentRow(row, 0)).toBeNull();
    });

    it('rejects row missing sis_student_id', () => {
      const row = {
        sis_student_id: '',
        math_score: 85,
      } as AssessmentImportRow;
      const error = validateAssessmentRow(row, 0);
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Missing sis_student_id');
    });

    it('accepts partial score data', () => {
      const row: AssessmentImportRow = {
        sis_student_id: 'STU001',
        math_score: 85,
      };
      expect(validateAssessmentRow(row, 0)).toBeNull();
    });
  });

  describe('Duplicate Student ID Detection', () => {
    it('finds no duplicates in unique list', () => {
      const rows: StudentImportRow[] = [
        { sis_student_id: 'STU001', first_name: 'A', last_name: 'B', grade_level: 5 },
        { sis_student_id: 'STU002', first_name: 'C', last_name: 'D', grade_level: 5 },
        { sis_student_id: 'STU003', first_name: 'E', last_name: 'F', grade_level: 5 },
      ];
      expect(findDuplicateStudentIds(rows)).toHaveLength(0);
    });

    it('finds single duplicate', () => {
      const rows: StudentImportRow[] = [
        { sis_student_id: 'STU001', first_name: 'A', last_name: 'B', grade_level: 5 },
        { sis_student_id: 'STU001', first_name: 'C', last_name: 'D', grade_level: 5 },
        { sis_student_id: 'STU003', first_name: 'E', last_name: 'F', grade_level: 5 },
      ];
      const duplicates = findDuplicateStudentIds(rows);
      expect(duplicates).toHaveLength(1);
      expect(duplicates).toContain('STU001');
    });

    it('finds multiple duplicates', () => {
      const rows: StudentImportRow[] = [
        { sis_student_id: 'STU001', first_name: 'A', last_name: 'B', grade_level: 5 },
        { sis_student_id: 'STU002', first_name: 'C', last_name: 'D', grade_level: 5 },
        { sis_student_id: 'STU001', first_name: 'E', last_name: 'F', grade_level: 5 },
        { sis_student_id: 'STU002', first_name: 'G', last_name: 'H', grade_level: 5 },
      ];
      const duplicates = findDuplicateStudentIds(rows);
      expect(duplicates).toHaveLength(2);
      expect(duplicates).toContain('STU001');
      expect(duplicates).toContain('STU002');
    });

    it('counts triple occurrence as single duplicate', () => {
      const rows: StudentImportRow[] = [
        { sis_student_id: 'STU001', first_name: 'A', last_name: 'B', grade_level: 5 },
        { sis_student_id: 'STU001', first_name: 'C', last_name: 'D', grade_level: 5 },
        { sis_student_id: 'STU001', first_name: 'E', last_name: 'F', grade_level: 5 },
      ];
      const duplicates = findDuplicateStudentIds(rows);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toBe('STU001');
    });

    it('handles empty input', () => {
      expect(findDuplicateStudentIds([])).toHaveLength(0);
    });
  });

  describe('Row Count Limits', () => {
    it('accepts exactly 1 row', () => {
      const result = validateImportRequest({
        importType: 'students',
        data: [{ sis_student_id: 'STU001' }],
      });
      expect(result.valid).toBe(true);
    });

    it('accepts 4999 rows', () => {
      const data = Array(4999).fill({ sis_student_id: 'STU001' });
      const result = validateImportRequest({ importType: 'students', data });
      expect(result.valid).toBe(true);
    });

    it('rejects 5001 rows', () => {
      const data = Array(5001).fill({ sis_student_id: 'STU001' });
      const result = validateImportRequest({ importType: 'students', data });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5000');
    });
  });
});
