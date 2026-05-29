/**
 * Assessment Data Importer
 *
 * Handles CSV/Excel import of standardized test scores with validation,
 * mapping, and batch processing capabilities.
 */

export type AssessmentType =
  | 'state_test'
  | 'map_growth'
  | 'iready'
  | 'star'
  | 'dibels'
  | 'nwea'
  | 'renaissance'
  | 'custom';

export type SubjectArea = 'ela' | 'math' | 'science' | 'social_studies' | 'other';

export interface AssessmentRecord {
  studentId?: string;
  studentExternalId?: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: number;
  assessmentType: AssessmentType;
  assessmentName: string;
  subject: SubjectArea;
  testDate: Date;
  scaledScore?: number;
  percentile?: number;
  proficiencyLevel?: string;
  growthPercentile?: number;
  lexileScore?: number;
  quantileScore?: number;
  rit?: number;
  rawScore?: number;
  maxScore?: number;
  standardsMet?: string[];
  metadata?: Record<string, any>;
}

export interface ImportMapping {
  studentId?: string;
  studentExternalId?: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: string;
  assessmentType?: string;
  assessmentName?: string;
  subject?: string;
  testDate?: string;
  scaledScore?: string;
  percentile?: string;
  proficiencyLevel?: string;
  growthPercentile?: string;
  lexileScore?: string;
  quantileScore?: string;
  rit?: string;
  rawScore?: string;
  maxScore?: string;
}

export interface ImportValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  records: AssessmentRecord[];
}

export interface ImportConfig {
  schoolId: string;
  assessmentType: AssessmentType;
  subject: SubjectArea;
  testDate?: Date;
  mapping: ImportMapping;
  options?: {
    skipHeaderRow?: boolean;
    matchStudentsBy?: 'id' | 'external_id' | 'name';
    createMissingStudents?: boolean;
    updateExisting?: boolean;
    dateFormat?: string;
  };
}

// Known column patterns for auto-detection
const COLUMN_PATTERNS: Partial<Record<keyof ImportMapping, RegExp[]>> = {
  studentId: [/^student[_\s]?id$/i, /^id$/i, /^sis[_\s]?id$/i],
  studentExternalId: [/^external[_\s]?id$/i, /^state[_\s]?id$/i, /^sasid$/i],
  firstName: [/^first[_\s]?name$/i, /^fname$/i, /^given[_\s]?name$/i],
  lastName: [/^last[_\s]?name$/i, /^lname$/i, /^surname$/i, /^family[_\s]?name$/i],
  gradeLevel: [/^grade$/i, /^grade[_\s]?level$/i, /^gr$/i],
  assessmentName: [/^assessment$/i, /^test[_\s]?name$/i, /^assessment[_\s]?name$/i],
  subject: [/^subject$/i, /^content[_\s]?area$/i, /^subject[_\s]?area$/i],
  testDate: [/^date$/i, /^test[_\s]?date$/i, /^assessment[_\s]?date$/i, /^admin[_\s]?date$/i],
  scaledScore: [/^scaled[_\s]?score$/i, /^scale[_\s]?score$/i, /^ss$/i],
  percentile: [/^percentile$/i, /^pctl$/i, /^%ile$/i, /^national[_\s]?percentile$/i],
  proficiencyLevel: [/^proficiency$/i, /^level$/i, /^performance[_\s]?level$/i, /^achievement[_\s]?level$/i],
  growthPercentile: [/^growth$/i, /^growth[_\s]?percentile$/i, /^sgp$/i, /^student[_\s]?growth$/i],
  lexileScore: [/^lexile$/i, /^lexile[_\s]?score$/i, /^lexile[_\s]?measure$/i],
  quantileScore: [/^quantile$/i, /^quantile[_\s]?score$/i, /^quantile[_\s]?measure$/i],
  rit: [/^rit$/i, /^rit[_\s]?score$/i],
  rawScore: [/^raw$/i, /^raw[_\s]?score$/i, /^points$/i],
  maxScore: [/^max$/i, /^max[_\s]?score$/i, /^total[_\s]?points$/i, /^possible$/i],
};

// Subject mapping
const SUBJECT_MAPPING: Record<string, SubjectArea> = {
  ela: 'ela',
  english: 'ela',
  'english language arts': 'ela',
  reading: 'ela',
  'language arts': 'ela',
  math: 'math',
  mathematics: 'math',
  science: 'science',
  sci: 'science',
  'social studies': 'social_studies',
  'social science': 'social_studies',
  history: 'social_studies',
  ss: 'social_studies',
};

// Proficiency level normalization
const PROFICIENCY_MAPPING: Record<string, string> = {
  // Common state test levels
  '1': 'below_basic',
  '2': 'basic',
  '3': 'proficient',
  '4': 'advanced',
  'level 1': 'below_basic',
  'level 2': 'basic',
  'level 3': 'proficient',
  'level 4': 'advanced',
  'not met': 'below_basic',
  'partially met': 'basic',
  'met': 'proficient',
  'exceeded': 'advanced',
  'below basic': 'below_basic',
  'basic': 'basic',
  'proficient': 'proficient',
  'advanced': 'advanced',
  // MAP Growth
  'lo': 'below_basic',
  'loa': 'basic',
  'avg': 'proficient',
  'hia': 'advanced',
  'hi': 'advanced',
  // i-Ready
  'well below': 'below_basic',
  'below': 'basic',
  'on grade level': 'proficient',
  'above': 'advanced',
};

/**
 * Parse CSV content into rows
 */
export function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Auto-detect column mapping from headers
 */
export function autoDetectMapping(headers: string[]): ImportMapping {
  const mapping: ImportMapping = {};

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          (mapping as any)[field] = header;
          break;
        }
      }
      if ((mapping as any)[field]) break;
    }
  }

  return mapping;
}

/**
 * Validate and parse a date value
 */
function parseDate(value: string, format?: string): Date | null {
  if (!value) return null;

  // Try ISO format first
  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try common formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
  ];

  for (const regex of formats) {
    const match = value.match(regex);
    if (match) {
      if (regex === formats[2]) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
      }
    }
  }

  return null;
}

/**
 * Normalize subject value
 */
function normalizeSubject(value: string): SubjectArea {
  const normalized = value.toLowerCase().trim();
  return SUBJECT_MAPPING[normalized] || 'other';
}

/**
 * Normalize proficiency level
 */
function normalizeProficiency(value: string): string {
  const normalized = value.toLowerCase().trim();
  return PROFICIENCY_MAPPING[normalized] || value;
}

/**
 * Validate a single record
 */
function validateRecord(
  record: Partial<AssessmentRecord>,
  rowIndex: number
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  // Required fields
  if (!record.studentId && !record.studentExternalId && (!record.firstName || !record.lastName)) {
    errors.push({
      row: rowIndex,
      column: 'student',
      value: null,
      message: 'Student identification required (ID, external ID, or name)',
      severity: 'error',
    });
  }

  if (!record.testDate) {
    errors.push({
      row: rowIndex,
      column: 'testDate',
      value: null,
      message: 'Test date is required',
      severity: 'error',
    });
  }

  // Validate score ranges
  if (record.percentile !== undefined && (record.percentile < 0 || record.percentile > 99)) {
    errors.push({
      row: rowIndex,
      column: 'percentile',
      value: record.percentile,
      message: 'Percentile must be between 0 and 99',
      severity: 'error',
    });
  }

  if (record.growthPercentile !== undefined && (record.growthPercentile < 1 || record.growthPercentile > 99)) {
    errors.push({
      row: rowIndex,
      column: 'growthPercentile',
      value: record.growthPercentile,
      message: 'Growth percentile must be between 1 and 99',
      severity: 'error',
    });
  }

  // Warnings
  if (record.scaledScore === undefined && record.percentile === undefined && record.proficiencyLevel === undefined) {
    errors.push({
      row: rowIndex,
      column: 'score',
      value: null,
      message: 'No score data found - consider adding scaled score, percentile, or proficiency level',
      severity: 'warning',
    });
  }

  return errors;
}

/**
 * Import assessment data from CSV
 */
export async function importAssessmentData(
  content: string,
  config: ImportConfig
): Promise<ImportResult> {
  const rows = parseCSV(content);

  if (rows.length === 0) {
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      errors: [
        {
          row: 0,
          column: 'file',
          value: null,
          message: 'No data found in file',
          severity: 'error',
        },
      ],
      warnings: [],
      records: [],
    };
  }

  const headers = rows[0];
  const dataRows = config.options?.skipHeaderRow !== false ? rows.slice(1) : rows;

  // Use provided mapping or auto-detect
  const mapping = Object.keys(config.mapping).length > 0 ? config.mapping : autoDetectMapping(headers);

  const records: AssessmentRecord[] = [];
  const allErrors: ImportValidationError[] = [];
  const allWarnings: ImportValidationError[] = [];
  let skippedRows = 0;

  // Create header index map
  const headerIndex: Record<string, number> = {};
  headers.forEach((h, i) => (headerIndex[h] = i));

  // Process each row
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowIndex = (config.options?.skipHeaderRow !== false ? i + 2 : i + 1);

    // Skip empty rows
    if (row.every((cell) => !cell.trim())) {
      skippedRows++;
      continue;
    }

    // Extract values using mapping
    const getValue = (field: keyof ImportMapping): string | undefined => {
      const columnName = mapping[field];
      if (!columnName) return undefined;
      const idx = headerIndex[columnName];
      return idx !== undefined ? row[idx] : undefined;
    };

    const record: Partial<AssessmentRecord> = {
      studentId: getValue('studentId'),
      studentExternalId: getValue('studentExternalId'),
      firstName: getValue('firstName'),
      lastName: getValue('lastName'),
      gradeLevel: getValue('gradeLevel') ? parseInt(getValue('gradeLevel')!) : undefined,
      assessmentType: config.assessmentType,
      assessmentName: getValue('assessmentName') || config.assessmentType,
      subject: getValue('subject') ? normalizeSubject(getValue('subject')!) : config.subject,
      testDate: getValue('testDate') ? (parseDate(getValue('testDate')!) ?? undefined) : config.testDate,
      scaledScore: getValue('scaledScore') ? parseFloat(getValue('scaledScore')!) : undefined,
      percentile: getValue('percentile') ? parseInt(getValue('percentile')!) : undefined,
      proficiencyLevel: getValue('proficiencyLevel')
        ? normalizeProficiency(getValue('proficiencyLevel')!)
        : undefined,
      growthPercentile: getValue('growthPercentile')
        ? parseInt(getValue('growthPercentile')!)
        : undefined,
      lexileScore: getValue('lexileScore') ? parseInt(getValue('lexileScore')!) : undefined,
      quantileScore: getValue('quantileScore') ? parseInt(getValue('quantileScore')!) : undefined,
      rit: getValue('rit') ? parseInt(getValue('rit')!) : undefined,
      rawScore: getValue('rawScore') ? parseFloat(getValue('rawScore')!) : undefined,
      maxScore: getValue('maxScore') ? parseFloat(getValue('maxScore')!) : undefined,
    };

    // Validate
    const validationErrors = validateRecord(record, rowIndex);
    const errors = validationErrors.filter((e) => e.severity === 'error');
    const warnings = validationErrors.filter((e) => e.severity === 'warning');

    allErrors.push(...errors);
    allWarnings.push(...warnings);

    if (errors.length === 0) {
      records.push(record as AssessmentRecord);
    } else {
      skippedRows++;
    }
  }

  return {
    success: allErrors.length === 0,
    totalRows: dataRows.length,
    importedRows: records.length,
    skippedRows,
    errors: allErrors,
    warnings: allWarnings,
    records,
  };
}

/**
 * Preview import without saving
 */
export async function previewImport(
  content: string,
  config: ImportConfig
): Promise<{
  headers: string[];
  mapping: ImportMapping;
  preview: Partial<AssessmentRecord>[];
  errors: ImportValidationError[];
}> {
  const rows = parseCSV(content);

  if (rows.length === 0) {
    return {
      headers: [],
      mapping: {},
      preview: [],
      errors: [
        {
          row: 0,
          column: 'file',
          value: null,
          message: 'No data found in file',
          severity: 'error',
        },
      ],
    };
  }

  const headers = rows[0];
  const mapping = autoDetectMapping(headers);

  // Import first 5 rows for preview
  const previewConfig = {
    ...config,
    mapping,
  };

  const result = await importAssessmentData(
    rows.slice(0, 6).map((row) => row.join(',')).join('\n'),
    previewConfig
  );

  return {
    headers,
    mapping,
    preview: result.records.slice(0, 5),
    errors: result.errors,
  };
}

/**
 * Get assessment type display info
 */
export function getAssessmentTypeInfo(type: AssessmentType): {
  name: string;
  description: string;
  expectedFields: string[];
} {
  const types: Record<AssessmentType, { name: string; description: string; expectedFields: string[] }> = {
    state_test: {
      name: 'State Assessment',
      description: 'State standardized tests (CAASPP, STAAR, etc.)',
      expectedFields: ['scaledScore', 'proficiencyLevel', 'percentile'],
    },
    map_growth: {
      name: 'MAP Growth',
      description: 'NWEA MAP Growth assessments',
      expectedFields: ['rit', 'percentile', 'growthPercentile'],
    },
    iready: {
      name: 'i-Ready',
      description: 'Curriculum Associates i-Ready diagnostic',
      expectedFields: ['scaledScore', 'percentile', 'proficiencyLevel'],
    },
    star: {
      name: 'STAR',
      description: 'Renaissance STAR assessments',
      expectedFields: ['scaledScore', 'percentile', 'lexileScore'],
    },
    dibels: {
      name: 'DIBELS',
      description: 'Dynamic Indicators of Basic Early Literacy Skills',
      expectedFields: ['rawScore', 'proficiencyLevel'],
    },
    nwea: {
      name: 'NWEA',
      description: 'Northwest Evaluation Association assessments',
      expectedFields: ['rit', 'percentile', 'growthPercentile'],
    },
    renaissance: {
      name: 'Renaissance',
      description: 'Renaissance Learning assessments',
      expectedFields: ['scaledScore', 'percentile', 'lexileScore'],
    },
    custom: {
      name: 'Custom Assessment',
      description: 'Custom or other assessment type',
      expectedFields: ['rawScore', 'percentile'],
    },
  };

  return types[type];
}
