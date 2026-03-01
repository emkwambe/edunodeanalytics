/**
 * Test Utilities
 * ==============
 *
 * Common test helpers, mocks, and utilities for EduNode Analytics testing.
 */

import { vi } from 'vitest';
import type { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    searchParams?: Record<string, string>;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, searchParams = {}, headers = {} } = options;

  // Build URL with search params
  const baseUrl = 'http://localhost:3000';
  const urlObj = new URL(url, baseUrl);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return {
    method,
    url: urlObj.toString(),
    nextUrl: urlObj,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body || {}),
    text: vi.fn().mockResolvedValue(JSON.stringify(body || {})),
  } as unknown as NextRequest;
}

/**
 * Create mock route params for Next.js App Router
 */
export function createMockParams<T extends Record<string, string>>(params: T): { params: Promise<T> } {
  return {
    params: Promise.resolve(params),
  };
}

/**
 * Parse JSON response from NextResponse
 */
export async function parseResponse<T>(response: Response): Promise<{
  data: T;
  status: number;
}> {
  const data = await response.json() as T;
  return {
    data,
    status: response.status,
  };
}

/**
 * Mock Supabase client factory
 */
export function createMockSupabaseClient(options: {
  selectData?: unknown[];
  insertData?: unknown;
  updateData?: unknown;
  deleteSuccess?: boolean;
  error?: Error | null;
} = {}) {
  const {
    selectData = [],
    insertData = null,
    updateData = null,
    deleteSuccess = true,
    error = null,
  } = options;

  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: selectData[0] || null, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: selectData[0] || null, error }),
    then: vi.fn((resolve) => resolve({ data: selectData, error, count: selectData.length })),
  };

  return {
    from: vi.fn(() => mockQuery),
    rpc: vi.fn().mockResolvedValue({ data: selectData, error }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  };
}

/**
 * Mock Clerk auth for testing
 */
export function createMockClerkAuth(options: {
  userId?: string | null;
  sessionClaims?: Record<string, unknown>;
} = {}) {
  const { userId = 'user_test123', sessionClaims = {} } = options;

  return {
    auth: vi.fn().mockResolvedValue({
      userId,
      sessionClaims: {
        role: 'school_admin',
        schools: ['independent-excellence'],
        primarySchool: 'independent-excellence',
        ...sessionClaims,
      },
    }),
    currentUser: vi.fn().mockResolvedValue(
      userId
        ? {
            id: userId,
            emailAddresses: [{ emailAddress: 'test@school.edu' }],
            firstName: 'Test',
            lastName: 'User',
          }
        : null
    ),
  };
}

/**
 * Wait for all pending promises to resolve
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a mock console that captures logs
 */
export function createMockConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  return {
    log: vi.fn((...args) => logs.push(args.join(' '))),
    error: vi.fn((...args) => errors.push(args.join(' '))),
    warn: vi.fn((...args) => warns.push(args.join(' '))),
    getLogs: () => logs,
    getErrors: () => errors,
    getWarns: () => warns,
    clear: () => {
      logs.length = 0;
      errors.length = 0;
      warns.length = 0;
    },
  };
}

/**
 * UUID validation regex
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}
