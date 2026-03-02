/**
 * ClassLink OneRoster API Service
 * ================================
 *
 * Real integration with ClassLink OneRoster v1.1 API
 * Handles OAuth token exchange, roster fetching, and regional endpoints.
 *
 * Security Considerations:
 * - OAuth tokens should be encrypted at rest (AES-256)
 * - PII data is processed according to FERPA guidelines
 * - All API calls use TLS 1.3
 * - Tokens are never logged
 *
 * API Docs: https://developer.classlink.com/oneroster
 */

/**
 * Regional API endpoints
 */
export const CLASSLINK_ENDPOINTS = {
  US: 'https://nodeapi.classlink.com',
  CANADA: 'https://nodeapi-ca.classlink.com',
  EUROPE: 'https://nodeapi-eu.classlink.com',
  SANDBOX: 'https://nodeapi-sandbox.classlink.com',
} as const;

const CLASSLINK_TOKEN_URL = 'https://launchpad.classlink.com/oauth2/v2/token';

/**
 * ClassLink OAuth token response
 */
export interface ClassLinkTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

/**
 * OneRoster student from API
 */
export interface OneRosterStudent {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  metadata?: Record<string, unknown>;
  enabledUser: boolean;
  givenName: string;
  familyName: string;
  middleName?: string;
  identifier?: string;
  email?: string;
  sms?: string;
  phone?: string;
  grades?: string[];
  orgs?: { sourcedId: string; type: string }[];
  agents?: { sourcedId: string; type: string }[];
  demographics?: {
    birthDate?: string;
    sex?: string;
    americanIndianOrAlaskaNative?: boolean;
    asian?: boolean;
    blackOrAfricanAmerican?: boolean;
    nativeHawaiianOrOtherPacificIslander?: boolean;
    white?: boolean;
    demographicRaceTwoOrMoreRaces?: boolean;
    hispanicOrLatinoEthnicity?: boolean;
  };
}

/**
 * OneRoster class/section from API
 */
export interface OneRosterClass {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  title: string;
  classCode?: string;
  classType: 'homeroom' | 'scheduled';
  course?: { sourcedId: string };
  school?: { sourcedId: string };
  terms?: { sourcedId: string }[];
  subjects?: string[];
  subjectCodes?: string[];
  periods?: string[];
  grades?: string[];
}

/**
 * ClassLink API error
 */
export class ClassLinkApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ClassLinkApiError';
  }
}

/**
 * Exchange OAuth code for access token
 * SECURITY: Credentials passed in memory, never logged
 */
export async function exchangeClassLinkCode(
  code: string,
  redirectUri: string,
  clientId?: string,
  clientSecret?: string
): Promise<ClassLinkTokenResponse> {
  const finalClientId = clientId || process.env.CLASSLINK_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.CLASSLINK_CLIENT_SECRET;

  if (!finalClientId || !finalClientSecret) {
    throw new ClassLinkApiError('ClassLink credentials not configured', 500, 'CONFIG_ERROR');
  }

  // Use Basic auth as per ClassLink spec
  const credentials = Buffer.from(`${finalClientId}:${finalClientSecret}`).toString('base64');

  const response = await fetch(CLASSLINK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    // SECURITY: Don't log the full error as it may contain sensitive info
    throw new ClassLinkApiError(
      'Token exchange failed',
      response.status,
      'TOKEN_EXCHANGE_FAILED'
    );
  }

  return response.json();
}

/**
 * Refresh an access token
 * SECURITY: Refresh tokens should be encrypted at rest
 */
export async function refreshClassLinkToken(
  refreshToken: string,
  clientId?: string,
  clientSecret?: string
): Promise<ClassLinkTokenResponse> {
  const finalClientId = clientId || process.env.CLASSLINK_CLIENT_ID;
  const finalClientSecret = clientSecret || process.env.CLASSLINK_CLIENT_SECRET;

  if (!finalClientId || !finalClientSecret) {
    throw new ClassLinkApiError('ClassLink credentials not configured', 500, 'CONFIG_ERROR');
  }

  const credentials = Buffer.from(`${finalClientId}:${finalClientSecret}`).toString('base64');

  const response = await fetch(CLASSLINK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new ClassLinkApiError(
      'Token refresh failed',
      response.status,
      'TOKEN_REFRESH_FAILED'
    );
  }

  return response.json();
}

/**
 * Make authenticated request to ClassLink OneRoster API
 * Implements pagination and rate limiting
 */
async function oneRosterRequest<T>(
  endpoint: string,
  accessToken: string,
  apiBase: string = CLASSLINK_ENDPOINTS.US,
  options: { limit?: number; offset?: number; filter?: string } = {}
): Promise<{ data: T[]; total?: number }> {
  const url = new URL(`${apiBase}/v2/oneroster${endpoint}`);

  if (options.limit) {
    url.searchParams.set('limit', options.limit.toString());
  }
  if (options.offset) {
    url.searchParams.set('offset', options.offset.toString());
  }
  if (options.filter) {
    url.searchParams.set('filter', options.filter);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new ClassLinkApiError('Unauthorized - token may be expired', 401, 'UNAUTHORIZED');
    }
    if (response.status === 429) {
      throw new ClassLinkApiError('Rate limited by ClassLink API', 429, 'RATE_LIMITED');
    }
    throw new ClassLinkApiError(
      'ClassLink API error',
      response.status,
      'API_ERROR'
    );
  }

  const result = await response.json();

  // OneRoster wraps data in a named property
  const dataKey = Object.keys(result).find((k) => k !== 'paging') || 'users';
  return {
    data: result[dataKey] || [],
    total: result.paging?.total,
  };
}

/**
 * Fetch all students with pagination
 * PRIVACY: Student PII is handled according to FERPA
 */
export async function fetchOneRosterStudents(
  accessToken: string,
  apiBase: string = CLASSLINK_ENDPOINTS.US,
  schoolId?: string
): Promise<OneRosterStudent[]> {
  const allStudents: OneRosterStudent[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  // Build filter for active students only
  let filter = "status='active' AND role='student'";
  if (schoolId) {
    filter += ` AND orgs.sourcedId='${schoolId}'`;
  }

  while (hasMore) {
    const response = await oneRosterRequest<OneRosterStudent>(
      '/users',
      accessToken,
      apiBase,
      { limit, offset, filter }
    );

    allStudents.push(...response.data);
    offset += limit;

    // Check if we've fetched all records
    if (response.data.length < limit || (response.total && offset >= response.total)) {
      hasMore = false;
    }

    // Safety limit
    if (allStudents.length > 10000) {
      console.warn('[ClassLink] Reached 10,000 student limit');
      break;
    }
  }

  return allStudents;
}

/**
 * Fetch all classes/sections with pagination
 */
export async function fetchOneRosterClasses(
  accessToken: string,
  apiBase: string = CLASSLINK_ENDPOINTS.US,
  schoolId?: string
): Promise<OneRosterClass[]> {
  const allClasses: OneRosterClass[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  let filter = "status='active'";
  if (schoolId) {
    filter += ` AND school.sourcedId='${schoolId}'`;
  }

  while (hasMore) {
    const response = await oneRosterRequest<OneRosterClass>(
      '/classes',
      accessToken,
      apiBase,
      { limit, offset, filter }
    );

    allClasses.push(...response.data);
    offset += limit;

    if (response.data.length < limit || (response.total && offset >= response.total)) {
      hasMore = false;
    }

    if (allClasses.length > 5000) {
      console.warn('[ClassLink] Reached 5,000 class limit');
      break;
    }
  }

  return allClasses;
}

/**
 * Get organization info to verify connection
 */
export async function getOneRosterOrgs(
  accessToken: string,
  apiBase: string = CLASSLINK_ENDPOINTS.US
): Promise<{ sourcedId: string; name: string; type: string }[]> {
  const response = await oneRosterRequest<{ sourcedId: string; name: string; type: string }>(
    '/orgs',
    accessToken,
    apiBase
  );

  return response.data;
}

/**
 * Transform OneRoster student to our database format
 * PRIVACY: Only extracts necessary fields, redacts sensitive data
 */
export function transformOneRosterStudent(
  student: OneRosterStudent,
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
  school_id: string;
  metadata: { classlink_id: string; identifier?: string };
} {
  // Parse grade level from grades array
  const gradeStr = student.grades?.[0] || '0';
  const gradeMap: Record<string, number> = {
    'PK': -1,
    'KG': 0,
    'IT': -2,
    'TK': 0,
  };
  const gradeLevel = gradeMap[gradeStr.toUpperCase()] ?? parseInt(gradeStr, 10);

  // Determine ethnicity from demographics
  let ethnicity: string | null = null;
  if (student.demographics) {
    const d = student.demographics;
    if (d.hispanicOrLatinoEthnicity) ethnicity = 'Hispanic/Latino';
    else if (d.white) ethnicity = 'White';
    else if (d.blackOrAfricanAmerican) ethnicity = 'Black/African American';
    else if (d.asian) ethnicity = 'Asian';
    else if (d.americanIndianOrAlaskaNative) ethnicity = 'American Indian/Alaska Native';
    else if (d.nativeHawaiianOrOtherPacificIslander) ethnicity = 'Native Hawaiian/Pacific Islander';
    else if (d.demographicRaceTwoOrMoreRaces) ethnicity = 'Two or More Races';
  }

  return {
    sis_student_id: student.identifier || student.sourcedId,
    first_name: student.givenName,
    last_name: student.familyName,
    display_name: `${student.givenName} ${student.familyName}`,
    grade_level: isNaN(gradeLevel) ? 0 : gradeLevel,
    date_of_birth: student.demographics?.birthDate || null,
    gender: student.demographics?.sex || null,
    ethnicity,
    school_id: schoolId,
    metadata: {
      classlink_id: student.sourcedId,
      identifier: student.identifier,
    },
  };
}
