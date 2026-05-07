/**
 * Structured JSON logger — single file, no dependencies, no Sentry.
 * All logs output as JSON to console for easy aggregation in production.
 *
 * Sentry error capture remains in observability.ts reportError().
 */

import { randomUUID } from 'crypto';

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: {
    name?: string;
    message?: string;
    code?: string;
    statusCode?: number;
  };
  context?: Record<string, string | number | boolean | null | undefined>;
}

function normalizeError(error: unknown): LogEntry['error'] | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    const entry: LogEntry['error'] = {
      name: error.name,
      message: error.message,
    };

    // Include custom fields if attached
    if ('code' in error && typeof error.code === 'string') {
      entry.code = error.code;
    }
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      entry.statusCode = error.statusCode;
    }

    return entry;
  }

  return { message: String(error) };
}

/**
 * Internal function: output a log entry.
 * Uses console.error for all levels so they're visible in production logs.
 */
function output(entry: LogEntry): void {
  console.error(JSON.stringify(entry));
}

/**
 * Log an error with optional error object and context.
 */
export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, string | number | boolean | null | undefined>
): void {
  output({
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    error: normalizeError(error),
    context,
  });
}

/**
 * Log a warning (e.g., rate limit exceeded, client blocked).
 * Error object is optional.
 */
export function logWarn(
  message: string,
  context?: Record<string, string | number | boolean | null | undefined>,
  error?: unknown
): void {
  output({
    timestamp: new Date().toISOString(),
    level: 'warn',
    message,
    error: error ? normalizeError(error) : undefined,
    context,
  });
}

/**
 * Log informational message.
 */
export function logInfo(
  message: string,
  context?: Record<string, string | number | boolean | null | undefined>
): void {
  output({
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    context,
  });
}

/**
 * Extract request ID from headers, or generate a new one.
 * Simple helper, no async context needed.
 */
export function getRequestId(headers: Headers): string {
  return (
    headers.get('x-request-id')?.trim() ||
    headers.get('x-correlation-id')?.trim() ||
    randomUUID()
  );
}
