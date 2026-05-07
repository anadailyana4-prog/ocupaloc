/**
 * Idempotency key handling for booking requests.
 *
 * Safe concurrency model:
 * - unique(idempotency_key) prevents duplicate in-flight requests
 * - Concurrent requests with same key: first acquires lock, others wait
 * - If acquisition fails (UNIQUE constraint): wait for in_progress → read result
 * - After 5s timeout waiting: return 409 to client (tell them to retry with same key)
 *
 * Uses PR1 structured logging (logError, logWarn).
 * No console calls.
 */

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { logError, logWarn } from "@/lib/logger";

export type IdempotentResult = {
  success: boolean;
  programareId?: string;
  error?: string;
  errorCode?: string;
  statusCode: number;
};

type DeduplicationRecord = {
  status: "in_progress" | "completed" | "failed";
  result: IdempotentResult | null;
};

const LOCK_WAIT_TIMEOUT_MS = 5000;
const LOCK_POLL_INTERVAL_MS = 100;

/**
 * Try to acquire an idempotency lock for this request.
 * Returns: 'acquired' if we got the lock, 'in_progress' if someone else is processing, 'completed' if already done.
 */
export async function acquireIdempotencyLock(
  idempotencyKey: string,
  requestId?: string
): Promise<"acquired" | "in_progress" | "completed"> {
  const admin = createSupabaseServiceClient();

  try {
    // Try to insert with status='in_progress'
    const { data, error } = await admin.from("request_deduplication").insert({
      idempotency_key: idempotencyKey,
      request_id: requestId ?? null,
      status: "in_progress",
      result: null
    });

    if (!error) {
      // We got the lock
      return "acquired";
    }

    if (error.code === "23505") {
      // UNIQUE constraint violation — someone else has this key
      // Check their status
      const { data: existing } = await admin
        .from("request_deduplication")
        .select("status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing?.status === "in_progress") {
        return "in_progress";
      } else if (existing?.status === "completed" || existing?.status === "failed") {
        return "completed";
      }
    }

    // Unexpected error
    logError(
      "[idempotency] acquireIdempotencyLock failed",
      error,
      { idempotencyKey, requestId, errorCode: error.code }
    );
  } catch (err) {
    logError(
      "[idempotency] acquireIdempotencyLock unexpected error",
      err,
      { idempotencyKey, requestId }
    );
  }

  return "in_progress"; // Assume locked if we can't check
}

/**
 * Wait for an in-progress lock to complete (with timeout).
 * Polls with backoff until: result becomes available, timeout, or error.
 * Returns: cached result if found, null if timeout.
 */
export async function waitForInProgressLock(
  idempotencyKey: string,
  requestId?: string
): Promise<IdempotentResult | null> {
  const admin = createSupabaseServiceClient();
  const startTime = Date.now();

  while (Date.now() - startTime < LOCK_WAIT_TIMEOUT_MS) {
    try {
      const { data } = await admin
        .from("request_deduplication")
        .select("status, result")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (data && (data.status === "completed" || data.status === "failed")) {
        return data.result as IdempotentResult | null;
      }

      // Still in_progress, wait a bit and retry
      await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_INTERVAL_MS));
    } catch (err) {
      logError(
        "[idempotency] waitForInProgressLock failed",
        err,
        { idempotencyKey, requestId }
      );
      return null;
    }
  }

  // Timeout
  logWarn(
    "[idempotency] waitForInProgressLock timeout",
    { idempotencyKey, requestId, waitedMs: LOCK_WAIT_TIMEOUT_MS }
  );
  return null;
}

/**
 * Retrieve cached result for an idempotency key (if available and not expired).
 */
export async function getIdempotentResult(
  idempotencyKey: string,
  requestId?: string
): Promise<IdempotentResult | null> {
  const admin = createSupabaseServiceClient();

  try {
    const { data, error } = await admin
      .from("request_deduplication")
      .select("status, result")
      .eq("idempotency_key", idempotencyKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) {
      logError(
        "[idempotency] getIdempotentResult query failed",
        error,
        { idempotencyKey, requestId }
      );
      return null;
    }

    if (data) {
      if (data.status === "completed" || data.status === "failed") {
        return data.result as IdempotentResult | null;
      }
    }

    return null;
  } catch (err) {
    logError(
      "[idempotency] getIdempotentResult unexpected error",
      err,
      { idempotencyKey, requestId }
    );
    return null;
  }
}

/**
 * Store the result of a booking request (marking lock as complete).
 */
export async function storeIdempotentResult(
  idempotencyKey: string,
  result: IdempotentResult,
  requestId?: string
): Promise<void> {
  const admin = createSupabaseServiceClient();

  try {
    const { error } = await admin
      .from("request_deduplication")
      .update({
        status: result.success ? "completed" : "failed",
        result: result
      })
      .eq("idempotency_key", idempotencyKey);

    if (error) {
      logError(
        "[idempotency] storeIdempotentResult failed",
        error,
        { idempotencyKey, requestId }
      );
    }
  } catch (err) {
    logError(
      "[idempotency] storeIdempotentResult unexpected error",
      err,
      { idempotencyKey, requestId }
    );
  }
}

/**
 * Handle idempotency for a booking request:
 * 1. Try to acquire lock
 * 2. If already in_progress: wait for result
 * 3. If completed: return cached
 * 4. If acquired: execute booking (caller will store result)
 *
 * Returns: cached result if found/completed, null if we got the lock
 */
export async function handleIdempotencyCheck(
  idempotencyKey: string | undefined,
  requestId?: string
): Promise<IdempotentResult | null> {
  if (!idempotencyKey) {
    return null; // No idempotency key, proceed normally
  }

  const lockStatus = await acquireIdempotencyLock(idempotencyKey, requestId);

  if (lockStatus === "acquired") {
    // We got the lock, proceed with booking
    return null;
  }

  if (lockStatus === "in_progress") {
    // Wait for in-flight request to complete
    logWarn(
      "[idempotency] waiting for in-progress request",
      { idempotencyKey, requestId }
    );
    const result = await waitForInProgressLock(idempotencyKey, requestId);

    if (result) {
      logWarn(
        "[idempotency] retrieved result from in-progress lock",
        { idempotencyKey, requestId, success: result.success }
      );
      return result;
    }

    // Timeout waiting
    return {
      success: false,
      error: "Cererea este în curs de procesare. Te rugăm reîncearcă cu aceeași cheie.",
      errorCode: "REQUEST_IN_PROGRESS",
      statusCode: 409
    };
  }

  if (lockStatus === "completed") {
    // Already completed, return cached
    const cached = await getIdempotentResult(idempotencyKey, requestId);
    if (cached) {
      logWarn(
        "[idempotency] returning cached result",
        { idempotencyKey, requestId, success: cached.success }
      );
      return cached;
    }
  }

  return null;
}
