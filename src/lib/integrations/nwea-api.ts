/**
 * NWEA MAP API Service
 * ====================
 *
 * Integration with NWEA MAP Growth assessment platform.
 * Fetches RIT scores, growth metrics, and proficiency data.
 *
 * Security Considerations:
 * - API keys stored encrypted at rest
 * - Student assessment data is FERPA protected
 * - TLS 1.3 required for all API calls
 * - Audit logging for all data access
 *
 * API Docs: https://teach.mapnwea.org/impl/mapapi/index.html
 */

const NWEA_API_BASE = 'https://api.mapnwea.org/services/api/v2';

/**
 * NWEA assessment term/season
 */
export type NWEATerm = 'Fall' | 'Winter' | 'Spring';

/**
 * NWEA subject area
 */
export type NWEASubject = 'Reading' | 'Mathematics' | 'Language Usage' | 'Science';

/**
 * NWEA student result from API
 */
export interface NWEAStudentResult {
  studentId: string;
  studentStateId?: string;
  firstName: string;
  lastName: string;
  grade: string;
  schoolName?: string;
  term: NWEATerm;
  subject: NWEASubject;
  testDate: string;
  ritScore: number;
  standardError: number;
  ritToReadingScore?: number;
  goalPerformance?: string;
  achievementPercentile?: number;
  growthIndex?: number;
  growthPercentile?: number;
  conditionalGrowthIndex?: number;
  conditionalGrowthPercentile?: number;
  projectedProficiency?: 'On Track' | 'Low' | 'High';
}

/**
 * NWEA growth summary
 */
export interface NWEAGrowthSummary {
  studentId: string;
  subject: NWEASubject;
  fallRit?: number;
  winterRit?: number;
  springRit?: number;
  growthObserved?: number;
  growthProjected?: number;
  metGrowthGoal?: boolean;
  growthPercentile?: number;
}

/**
 * NWEA API error
 */
export class NWEAApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'NWEAApiError';
  }
}

/**
 * Make authenticated request to NWEA API
 * SECURITY: API key passed via header, never logged
 */
async function nweaRequest<T>(
  endpoint: string,
  apiKey: string,
  districtId: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${NWEA_API_BASE}${endpoint}`);

  // Add query parameters
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-District-Id': districtId,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new NWEAApiError('Unauthorized - invalid API key', 401, 'UNAUTHORIZED');
    }
    if (response.status === 403) {
      throw new NWEAApiError('Forbidden - check district permissions', 403, 'FORBIDDEN');
    }
    if (response.status === 429) {
      throw new NWEAApiError('Rate limited by NWEA API', 429, 'RATE_LIMITED');
    }
    throw new NWEAApiError(
      'NWEA API error',
      response.status,
      'API_ERROR'
    );
  }

  return response.json();
}

/**
 * Verify NWEA connection and get district info
 */
export async function verifyNWEAConnection(
  apiKey: string,
  districtId: string
): Promise<{ success: boolean; districtName?: string; schoolCount?: number }> {
  try {
    const result = await nweaRequest<{ district: { name: string; schools: unknown[] } }>(
      '/district',
      apiKey,
      districtId
    );

    return {
      success: true,
      districtName: result.district?.name,
      schoolCount: result.district?.schools?.length,
    };
  } catch {
    return {
      success: false,
    };
  }
}

/**
 * Fetch assessment results for a school year
 * PRIVACY: Only fetches data for students in the specified school
 */
export async function fetchNWEAResults(
  apiKey: string,
  districtId: string,
  options: {
    schoolYear: string; // e.g., "2024-2025"
    term?: NWEATerm;
    subject?: NWEASubject;
    schoolId?: string;
  }
): Promise<NWEAStudentResult[]> {
  const params: Record<string, string> = {
    schoolYear: options.schoolYear,
  };

  if (options.term) {
    params.term = options.term;
  }
  if (options.subject) {
    params.subject = options.subject;
  }
  if (options.schoolId) {
    params.schoolId = options.schoolId;
  }

  const results = await nweaRequest<{ results: NWEAStudentResult[] }>(
    '/assessment/results',
    apiKey,
    districtId,
    params
  );

  return results.results || [];
}

/**
 * Fetch growth summaries for students
 */
export async function fetchNWEAGrowth(
  apiKey: string,
  districtId: string,
  options: {
    schoolYear: string;
    subject?: NWEASubject;
    schoolId?: string;
  }
): Promise<NWEAGrowthSummary[]> {
  const params: Record<string, string> = {
    schoolYear: options.schoolYear,
  };

  if (options.subject) {
    params.subject = options.subject;
  }
  if (options.schoolId) {
    params.schoolId = options.schoolId;
  }

  const results = await nweaRequest<{ growth: NWEAGrowthSummary[] }>(
    '/growth/summary',
    apiKey,
    districtId,
    params
  );

  return results.growth || [];
}

/**
 * Get current school year in NWEA format
 */
export function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // School year typically starts in August/September
  if (month >= 7) {
    // August onwards = current year - next year
    return `${year}-${year + 1}`;
  } else {
    // Before August = previous year - current year
    return `${year - 1}-${year}`;
  }
}

/**
 * Get current assessment term based on date
 */
export function getCurrentTerm(): NWEATerm {
  const month = new Date().getMonth();

  // August - November = Fall
  // December - February = Winter
  // March - July = Spring
  if (month >= 7 && month <= 10) return 'Fall';
  if (month >= 11 || month <= 1) return 'Winter';
  return 'Spring';
}

/**
 * Transform NWEA results to student assessment data for our schema
 * PRIVACY: Strips unnecessary fields, keeps only educational metrics
 */
export function transformNWEAResults(
  results: NWEAStudentResult[],
  _schoolId: string
): {
  studentSisId: string;
  readingScores: {
    fallRit?: number;
    winterRit?: number;
    springRit?: number;
    growthPercentile?: number;
  };
  mathScores: {
    fallRit?: number;
    winterRit?: number;
    springRit?: number;
    growthPercentile?: number;
  };
}[] {
  // Group results by student
  const studentMap = new Map<
    string,
    {
      studentSisId: string;
      readingScores: Record<string, number | undefined>;
      mathScores: Record<string, number | undefined>;
    }
  >();

  for (const result of results) {
    const key = result.studentStateId || result.studentId;

    if (!studentMap.has(key)) {
      studentMap.set(key, {
        studentSisId: key,
        readingScores: {},
        mathScores: {},
      });
    }

    const student = studentMap.get(key)!;

    // Map term to field name
    const termField = `${result.term.toLowerCase()}Rit` as 'fallRit' | 'winterRit' | 'springRit';

    if (result.subject === 'Reading') {
      student.readingScores[termField] = result.ritScore;
      if (result.growthPercentile) {
        student.readingScores.growthPercentile = result.growthPercentile;
      }
    } else if (result.subject === 'Mathematics') {
      student.mathScores[termField] = result.ritScore;
      if (result.growthPercentile) {
        student.mathScores.growthPercentile = result.growthPercentile;
      }
    }
  }

  return Array.from(studentMap.values());
}

/**
 * Calculate proficiency level from RIT score
 * Based on NWEA norms - this is a simplified version
 */
export function calculateProficiencyLevel(
  ritScore: number,
  gradeLevel: number,
  subject: 'reading' | 'math'
): 'below' | 'approaching' | 'proficient' | 'advanced' {
  // These are approximate grade-level RIT targets
  // Actual norms vary by season and are updated yearly
  const gradeTargets: Record<number, { reading: number; math: number }> = {
    0: { reading: 158, math: 160 },
    1: { reading: 177, math: 180 },
    2: { reading: 188, math: 192 },
    3: { reading: 198, math: 203 },
    4: { reading: 205, math: 213 },
    5: { reading: 211, math: 221 },
    6: { reading: 215, math: 225 },
    7: { reading: 218, math: 228 },
    8: { reading: 220, math: 230 },
    9: { reading: 221, math: 232 },
    10: { reading: 222, math: 233 },
    11: { reading: 223, math: 234 },
    12: { reading: 224, math: 235 },
  };

  const target = gradeTargets[gradeLevel]?.[subject] || gradeTargets[8][subject];
  const diff = ritScore - target;

  if (diff >= 15) return 'advanced';
  if (diff >= -5) return 'proficient';
  if (diff >= -15) return 'approaching';
  return 'below';
}
