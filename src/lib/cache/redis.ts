/**
 * Redis Cache
 * ===========
 *
 * Caching layer using Upstash Redis (serverless Redis).
 *
 * Features:
 * - Serverless-compatible (HTTP-based client)
 * - Automatic TTL management
 * - JSON serialization
 * - Cache key namespacing
 * - Batch operations
 * - Cache invalidation patterns
 *
 * Use Cases:
 * - BigQuery query results (expensive, slow queries)
 * - User session data
 * - Feature flags
 * - Rate limiting
 * - School metadata
 *
 * Setup:
 * - Set UPSTASH_REDIS_REST_URL environment variable
 * - Set UPSTASH_REDIS_REST_TOKEN environment variable
 */

import { captureException } from '@/lib/monitoring/sentry';

// Configuration
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const IS_REDIS_ENABLED = !!(REDIS_URL && REDIS_TOKEN);

// Cache key prefix for namespacing
const KEY_PREFIX = 'edunode:';

// Default TTLs (in seconds)
export const TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  BIGQUERY: 1800, // 30 minutes for expensive queries
  SESSION: 3600, // 1 hour for sessions
  FEATURE_FLAG: 300, // 5 minutes for feature flags
} as const;

// In-memory fallback cache for development
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

/**
 * Build full cache key with prefix
 */
function buildKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

/**
 * Execute Redis command via Upstash REST API
 */
async function redisCommand<T>(
  command: string,
  ...args: (string | number)[]
): Promise<T | null> {
  if (!IS_REDIS_ENABLED) {
    return null;
  }

  try {
    const response = await fetch(`${REDIS_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
    });

    if (!response.ok) {
      throw new Error(`Redis HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return (data as { result: T }).result;
  } catch (error) {
    console.error('[Redis] Command failed:', command, error);
    captureException(error, { command, args });
    return null;
  }
}

/**
 * Execute pipeline of Redis commands
 */
async function redisPipeline<T extends unknown[]>(
  commands: [string, ...(string | number)[]][]
): Promise<T | null> {
  if (!IS_REDIS_ENABLED) {
    return null;
  }

  try {
    const response = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      throw new Error(`Redis pipeline HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return (data as { result: T }[]).map((r) => r.result) as T;
  } catch (error) {
    console.error('[Redis] Pipeline failed:', error);
    captureException(error, { commandCount: commands.length });
    return null;
  }
}

// =============================================================================
// Basic Operations
// =============================================================================

/**
 * Get value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  const fullKey = buildKey(key);

  if (!IS_REDIS_ENABLED) {
    // Check memory cache
    const cached = memoryCache.get(fullKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log('[Cache Mock] HIT:', key);
      return cached.value as T;
    }
    console.log('[Cache Mock] MISS:', key);
    return null;
  }

  const value = await redisCommand<string>('GET', fullKey);

  if (value === null) {
    console.log('[Cache] MISS:', key);
    return null;
  }

  console.log('[Cache] HIT:', key);

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
}

/**
 * Set value in cache with TTL
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number = TTL.MEDIUM
): Promise<boolean> {
  const fullKey = buildKey(key);
  const serialized = JSON.stringify(value);

  if (!IS_REDIS_ENABLED) {
    // Use memory cache
    memoryCache.set(fullKey, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    console.log('[Cache Mock] SET:', key, `TTL=${ttlSeconds}s`);
    return true;
  }

  const result = await redisCommand<string>('SET', fullKey, serialized, 'EX', ttlSeconds);
  console.log('[Cache] SET:', key, `TTL=${ttlSeconds}s`);
  return result === 'OK';
}

/**
 * Delete value from cache
 */
export async function del(key: string): Promise<boolean> {
  const fullKey = buildKey(key);

  if (!IS_REDIS_ENABLED) {
    memoryCache.delete(fullKey);
    console.log('[Cache Mock] DEL:', key);
    return true;
  }

  const result = await redisCommand<number>('DEL', fullKey);
  console.log('[Cache] DEL:', key);
  return result === 1;
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  const fullKey = buildKey(key);

  if (!IS_REDIS_ENABLED) {
    const cached = memoryCache.get(fullKey);
    return cached !== undefined && cached.expiresAt > Date.now();
  }

  const result = await redisCommand<number>('EXISTS', fullKey);
  return result === 1;
}

/**
 * Get remaining TTL for a key
 */
export async function ttl(key: string): Promise<number> {
  const fullKey = buildKey(key);

  if (!IS_REDIS_ENABLED) {
    const cached = memoryCache.get(fullKey);
    if (!cached) return -2; // Key doesn't exist
    const remaining = Math.floor((cached.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  const result = await redisCommand<number>('TTL', fullKey);
  return result ?? -2;
}

// =============================================================================
// Pattern Operations
// =============================================================================

/**
 * Delete all keys matching a pattern
 * Use with caution - can be expensive
 */
export async function deletePattern(pattern: string): Promise<number> {
  const fullPattern = buildKey(pattern);

  if (!IS_REDIS_ENABLED) {
    let count = 0;
    for (const key of memoryCache.keys()) {
      if (key.match(new RegExp(fullPattern.replace('*', '.*')))) {
        memoryCache.delete(key);
        count++;
      }
    }
    console.log('[Cache Mock] DEL pattern:', pattern, `(${count} keys)`);
    return count;
  }

  // Get keys matching pattern
  const keys = await redisCommand<string[]>('KEYS', fullPattern);

  if (!keys || keys.length === 0) {
    return 0;
  }

  // Delete all matching keys
  const result = await redisCommand<number>('DEL', ...keys);
  console.log('[Cache] DEL pattern:', pattern, `(${result} keys)`);
  return result ?? 0;
}

// =============================================================================
// Cache-Aside Pattern
// =============================================================================

/**
 * Get value from cache, or compute and cache if not present
 */
export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = TTL.MEDIUM
): Promise<T> {
  // Try to get from cache
  const cached = await get<T>(key);

  if (cached !== null) {
    return cached;
  }

  // Compute value
  const value = await factory();

  // Cache the result
  await set(key, value, ttlSeconds);

  return value;
}

// =============================================================================
// School-Scoped Cache Keys
// =============================================================================

/**
 * Build school-scoped cache key
 */
export function schoolKey(schoolId: string, ...parts: string[]): string {
  return `school:${schoolId}:${parts.join(':')}`;
}

/**
 * Invalidate all cache entries for a school
 */
export async function invalidateSchool(schoolId: string): Promise<number> {
  return deletePattern(`school:${schoolId}:*`);
}

// =============================================================================
// BigQuery Cache Helpers
// =============================================================================

/**
 * Build BigQuery cache key
 */
export function bigQueryKey(query: string, params?: Record<string, unknown>): string {
  const queryHash = simpleHash(query + JSON.stringify(params || {}));
  return `bigquery:${queryHash}`;
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// =============================================================================
// Rate Limiting
// =============================================================================

/**
 * Simple rate limiter using Redis
 * Returns true if request is allowed, false if rate limited
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const fullKey = buildKey(`ratelimit:${key}`);

  if (!IS_REDIS_ENABLED) {
    // Allow all in development
    return { allowed: true, remaining: maxRequests, resetIn: windowSeconds };
  }

  // Use sliding window counter
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Execute pipeline for atomic rate limiting
  const results = await redisPipeline<[number, number, string, string]>([
    ['ZREMRANGEBYSCORE', fullKey, '0', windowStart.toString()],
    ['ZCARD', fullKey],
    ['ZADD', fullKey, now.toString(), now.toString()],
    ['EXPIRE', fullKey, (windowSeconds + 1).toString()],
  ]);

  if (!results) {
    // Fail open if Redis is unavailable
    return { allowed: true, remaining: maxRequests, resetIn: windowSeconds };
  }

  const currentCount = results[1] as number;
  const allowed = currentCount < maxRequests;
  const remaining = Math.max(0, maxRequests - currentCount - 1);

  // Calculate reset time
  const resetIn = windowSeconds;

  if (!allowed) {
    console.log('[RateLimit] Exceeded:', key);
  }

  return { allowed, remaining, resetIn };
}

// =============================================================================
// Utility
// =============================================================================

/**
 * Clear the entire memory cache (development only)
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
  console.log('[Cache Mock] Cleared all entries');
}

/**
 * Get cache statistics (memory cache only)
 */
export function getMemoryCacheStats(): { size: number; keys: string[] } {
  const keys = Array.from(memoryCache.keys()).map((k) =>
    k.replace(KEY_PREFIX, '')
  );
  return { size: memoryCache.size, keys };
}

export { IS_REDIS_ENABLED };
