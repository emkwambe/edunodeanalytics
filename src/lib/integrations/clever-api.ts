/**
 * Clever API Service
 * ==================
 *
 * Real integration with Clever's Secure Sync API v3.0
 * Handles OAuth token exchange, student roster fetching, and delta syncs.
 *
 * API Docs: https://dev.clever.com/reference
 */

const CLEVER_API_BASE = 'https://api.clever.com/v3.0';
const CLEVER_TOKEN_URL = 'https://clever.com/oauth/tokens';

/**
 * Clever OAuth token response
 */
export interface CleverTokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Clever student from API
 */
export interface CleverStudent {
  id: string;
  district: string;
  school: string;
  student_number: string;
  state_id?: string;
  name: {
    first: string;
    middle?: string;
    last: string;
  };
  email?: string;
  grade?: string;
  dob?: string;
  gender?: string;
  race?: string;
  hispanic_ethnicity?: string;
  ell_status?: string;
  iep_status?: string;
  frl_status?: string;
  created: string;
  last_modified: string;
}

/**
 * Clever section from API
 */
export interface CleverSection {
  id: string;
  district: string;
  school: string;
  name: string;
  course_name?: string;
  course_number?: string;
  grade?: string;
  subject?: string;
  term_id?: string;
  period?: string;
  teacher?: string;
  teachers: string[];
  students: string[];
  created: string;
  last_modified: string;
}

/**
 * Clever API error
 */
export class CleverApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'CleverApiError';
  }
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCleverCode(
  code: string,
  redirectUri: string,
  clientId?: string,
  clientSecret?: string
): Promise<CleverTokenResponse> {
  const finalClientId = clientId || process.env.CLEVER_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.CLEVER_CLIENT_SECRET;

  if (!finalClientId || !finalClientSecret) {
    throw new CleverApiError('Clever credentials not configured', 500, 'CONFIG_ERROR');
  }

  const credentials = Buffer.from(`${finalClientId}:${finalClientSecret}`).toString('base64');

  const response = await fetch(CLEVER_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new CleverApiError(
      `Token exchange failed: ${errorText}`,
      response.status,
      'TOKEN_EXCHANGE_FAILED'
    );
  }

  return response.json();
}

/**
 * Make authenticated request to Clever API
 */
async function cleverRequest<T>(
  endpoint: string,
  accessToken: string,
  options: { limit?: number; starting_after?: string } = {}
): Promise<{ data: T[]; links?: { next?: string } }> {
  const url = new URL(`${CLEVER_API_BASE}${endpoint}`);

  if (options.limit) {
    url.searchParams.set('limit', options.limit.toString());
  }
  if (options.starting_after) {
    url.searchParams.set('starting_after', options.starting_after);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new CleverApiError('Unauthorized - token may be expired', 401, 'UNAUTHORIZED');
    }
    if (response.status === 429) {
      throw new CleverApiError('Rate limited by Clever API', 429, 'RATE_LIMITED');
    }
    const errorText = await response.text();
    throw new CleverApiError(
      `Clever API error: ${errorText}`,
      response.status,
      'API_ERROR'
    );
  }

  return response.json();
}

/**
 * Fetch all students with pagination
 */
export async function fetchCleverStudents(
  accessToken: string,
  districtId?: string
): Promise<CleverStudent[]> {
  const allStudents: CleverStudent[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await cleverRequest<{ data: CleverStudent }>(
      '/students',
      accessToken,
      { limit: 100, starting_after: cursor }
    );

    const students = response.data.map((item) => item.data);
    allStudents.push(...students);

    // Check for pagination
    if (response.links?.next) {
      // Extract cursor from next link
      const nextUrl = new URL(response.links.next);
      cursor = nextUrl.searchParams.get('starting_after') || undefined;
    } else {
      hasMore = false;
    }

    // Safety check to prevent infinite loops
    if (allStudents.length > 10000) {
      console.warn('[Clever] Reached 10,000 student limit');
      break;
    }
  }

  // Filter by district if specified
  if (districtId) {
    return allStudents.filter((s) => s.district === districtId);
  }

  return allStudents;
}

/**
 * Fetch all sections with pagination
 */
export async function fetchCleverSections(
  accessToken: string,
  districtId?: string
): Promise<CleverSection[]> {
  const allSections: CleverSection[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await cleverRequest<{ data: CleverSection }>(
      '/sections',
      accessToken,
      { limit: 100, starting_after: cursor }
    );

    const sections = response.data.map((item) => item.data);
    allSections.push(...sections);

    if (response.links?.next) {
      const nextUrl = new URL(response.links.next);
      cursor = nextUrl.searchParams.get('starting_after') || undefined;
    } else {
      hasMore = false;
    }

    if (allSections.length > 5000) {
      console.warn('[Clever] Reached 5,000 section limit');
      break;
    }
  }

  if (districtId) {
    return allSections.filter((s) => s.district === districtId);
  }

  return allSections;
}

/**
 * Get district info to verify connection
 */
export async function getCleverDistrict(
  accessToken: string
): Promise<{ id: string; name: string; mdr_number?: string }> {
  const response = await cleverRequest<{
    id: string;
    name: string;
    mdr_number?: string;
  }>('/districts/me', accessToken);

  if (!response.data || response.data.length === 0) {
    throw new CleverApiError('No district found for token', 404, 'DISTRICT_NOT_FOUND');
  }

  return response.data[0];
}

/**
 * Fetch delta events since a timestamp
 * Used for incremental sync
 */
export async function fetchCleverEvents(
  accessToken: string,
  since: Date,
  recordTypes: ('students' | 'sections')[] = ['students', 'sections']
): Promise<{
  created: { type: string; data: unknown }[];
  updated: { type: string; data: unknown }[];
  deleted: { type: string; id: string }[];
}> {
  const results = {
    created: [] as { type: string; data: unknown }[],
    updated: [] as { type: string; data: unknown }[],
    deleted: [] as { type: string; id: string }[],
  };

  for (const recordType of recordTypes) {
    try {
      const response = await cleverRequest<{
        type: string;
        data: {
          object: unknown;
        };
        created: string;
        id: string;
      }>(`/events?record_type=${recordType}&created_since=${since.toISOString()}`, accessToken);

      for (const event of response.data) {
        if (event.type.endsWith('.created')) {
          results.created.push({ type: recordType, data: event.data.object });
        } else if (event.type.endsWith('.updated')) {
          results.updated.push({ type: recordType, data: event.data.object });
        } else if (event.type.endsWith('.deleted')) {
          results.deleted.push({ type: recordType, id: event.id });
        }
      }
    } catch (error) {
      console.warn(`[Clever] Error fetching ${recordType} events:`, error);
    }
  }

  return results;
}

/**
 * Transform Clever student to our database format
 */
export function transformCleverStudent(
  student: CleverStudent,
  schoolId: string
): {
  sis_student_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  grade_level: number;
  date_of_birth: string | null;
  gender: string | null;
  ethnicity: string | null;
  has_iep: boolean;
  is_english_learner: boolean;
  is_free_reduced_lunch: boolean;
  school_id: string;
  metadata: { clever_id: string; state_id?: string };
} {
  // Parse grade level to number
  const gradeMap: Record<string, number> = {
    'PreKindergarten': -1,
    'Kindergarten': 0,
    'InfantToddler': -2,
    'Transitional Kindergarten': 0,
  };
  const gradeLevel = gradeMap[student.grade || ''] ?? parseInt(student.grade || '0', 10);

  return {
    sis_student_id: student.student_number || student.id,
    first_name: student.name.first,
    last_name: student.name.last,
    display_name: `${student.name.first} ${student.name.last}`,
    grade_level: isNaN(gradeLevel) ? 0 : gradeLevel,
    date_of_birth: student.dob || null,
    gender: student.gender || null,
    ethnicity: student.race || null,
    has_iep: student.iep_status === 'Y',
    is_english_learner: student.ell_status === 'Y',
    is_free_reduced_lunch: student.frl_status === 'Y',
    school_id: schoolId,
    metadata: {
      clever_id: student.id,
      state_id: student.state_id,
    },
  };
}
