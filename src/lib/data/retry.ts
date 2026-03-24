/**
 * Retry Utility with Exponential Backoff
 * ======================================
 *
 * Provides retry logic for SIS sync adapters and other external API calls.
 *
 * Features:
 * - Exponential backoff: 1s, 2s, 4s (3 retries max by default)
 * - Sentry breadcrumb logging for each retry attempt
 * - Dead letter logging on final failure
 * - Configurable retry conditions
 * - Async timeout support
 */

import { addBreadcrumb, captureException, setTag } from '@/lib/monitoring/sentry';

/**
 * Configuration options for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;

  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs?: number;

  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;

  /** Timeout for each attempt in milliseconds (default: 30000) */
  timeoutMs?: number;

  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;

  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown, attempt: number) => boolean;

  /** Context for Sentry logging */
  context?: {
    adapterName?: string;
    schoolId?: string;
    operation?: string;
  };
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: Required<Omit<RetryConfig, 'context' | 'shouldRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  timeoutMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Default function to determine if an error should trigger a retry
 * Retries on network errors, timeouts, and 5xx server errors
 */
function defaultShouldRetry(error: unknown, _attempt: number): boolean {
  // Always retry on network/timeout errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // Check for abort/timeout errors
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  // Check for HTTP errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    // Retry on 5xx server errors and specific 4xx errors
    if (status >= 500 || status === 429 || status === 408) {
      return true;
    }
  }

  // Check for common network error messages
  if (error instanceof Error) {
    const retryableMessages = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ENETUNREACH',
      'socket hang up',
      'network error',
      'timeout',
    ];
    return retryableMessages.some((msg) =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  return false;
}

/**
 * Calculate delay for a given attempt using exponential backoff
 */
function calculateDelay(attempt: number, config: Required<Omit<RetryConfig, 'context' | 'shouldRetry'>>): number {
  const delay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  // Add jitter (0-10% of delay) to prevent thundering herd
  const jitter = delay * Math.random() * 0.1;
  return Math.min(delay + jitter, config.maxDelayMs);
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await fn();
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => cleverAdapter.sync(schoolId, credentials),
 *   {
 *     maxRetries: 3,
 *     context: { adapterName: 'clever', schoolId }
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Sync completed:', result.data);
 * } else {
 *   console.error('Sync failed after retries:', result.error);
 * }
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const shouldRetry = config?.shouldRetry ?? defaultShouldRetry;
  const context = config?.context ?? {};

  let lastError: Error | undefined;
  let attempt = 0;

  // Set Sentry tags for context
  if (context.adapterName) {
    setTag('sync_adapter', context.adapterName);
  }
  if (context.schoolId) {
    setTag('school_id', context.schoolId);
  }

  while (attempt <= mergedConfig.maxRetries) {
    attempt++;

    try {
      // Log retry attempt as breadcrumb
      if (attempt > 1) {
        addBreadcrumb({
          category: 'retry',
          message: `Retry attempt ${attempt} of ${mergedConfig.maxRetries + 1}`,
          level: 'warning',
          data: {
            attempt,
            maxRetries: mergedConfig.maxRetries,
            ...context,
          },
        });
      }

      // Execute with timeout
      const result = await withTimeout(fn, mergedConfig.timeoutMs);

      return {
        success: true,
        data: result,
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log each failure as breadcrumb
      addBreadcrumb({
        category: 'retry',
        message: `Attempt ${attempt} failed: ${lastError.message}`,
        level: 'error',
        data: {
          attempt,
          error: lastError.message,
          ...context,
        },
      });

      // Check if we should retry
      if (attempt <= mergedConfig.maxRetries && shouldRetry(error, attempt)) {
        const delay = calculateDelay(attempt, mergedConfig);
        console.log(
          `[Retry] Attempt ${attempt} failed, retrying in ${Math.round(delay)}ms...`,
          { error: lastError.message, ...context }
        );
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  // Final failure - log to dead letter and Sentry
  const finalError = lastError ?? new Error('Unknown error');

  // Log to dead letter (Sentry with special tag)
  captureException(finalError, {
    ...context,
    attempts: attempt,
    totalDurationMs: Date.now() - startTime,
    dead_letter: true, // Tag for dead letter filtering
    operation: context.operation ?? 'sync',
  });

  console.error(
    `[Retry] All ${attempt} attempts failed:`,
    { error: finalError.message, ...context }
  );

  return {
    success: false,
    error: finalError,
    attempts: attempt,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Create a retry wrapper with pre-configured settings
 * Useful for creating adapter-specific retry functions
 */
export function createRetryWrapper(baseConfig: RetryConfig) {
  return <T>(fn: () => Promise<T>, overrideConfig?: Partial<RetryConfig>) =>
    withRetry(fn, { ...baseConfig, ...overrideConfig });
}

/**
 * Retry wrapper specifically for SIS sync operations
 * Pre-configured with sensible defaults for external API calls
 */
export const withSyncRetry = createRetryWrapper({
  maxRetries: 3,
  baseDelayMs: 1000,
  timeoutMs: 60000, // 60 seconds for sync operations
  backoffMultiplier: 2,
});

/**
 * Dead letter record type for failed operations
 */
export interface DeadLetterRecord {
  id: string;
  adapterName: string;
  schoolId: string;
  operation: string;
  error: string;
  attempts: number;
  failedAt: Date;
  payload?: unknown;
}

/**
 * Log a failed operation to the dead letter concept
 * In production, this could write to a database table or external service
 */
export async function logToDeadLetter(record: Omit<DeadLetterRecord, 'id' | 'failedAt'>): Promise<void> {
  const deadLetter: DeadLetterRecord = {
    id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...record,
    failedAt: new Date(),
  };

  // Log as Sentry event with dead_letter tag for filtering
  captureException(new Error(`Dead letter: ${record.operation} failed`), {
    dead_letter: true,
    dead_letter_id: deadLetter.id,
    adapter: record.adapterName,
    school_id: record.schoolId,
    operation: record.operation,
    error_message: record.error,
    attempts: record.attempts,
    payload: record.payload,
  });

  console.error('[DeadLetter] Logged failed operation:', {
    id: deadLetter.id,
    adapter: record.adapterName,
    operation: record.operation,
  });
}
