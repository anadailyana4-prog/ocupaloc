import { NextRequest, NextResponse } from "next/server";

import { validateCronSecret } from "@/lib/cron-auth";
import { recordOperationalEvent, getRequestId } from "@/lib/ops-events";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

/**
 * POST /api/jobs/cleanup-idempotency-keys
 *
 * Cron job that deletes expired idempotency keys (older than 24 hours).
 * Prevents unbounded table growth in idempotencykeys.
 *
 * Authentication: requires `Authorization: Bearer <CRON_SECRET>` header
 *   (or legacy `x-cron-secret` header).
 *
 * @returns 200 with `{ deleted: number }` or 401/500.
 */

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(req.headers);

  if (!validateCronSecret(req.headers, process.env.REMINDERS_CRON_SECRET?.trim())) {
    await recordOperationalEvent({
      eventType: "cron_cleanup_failed",
      flow: "cron",
      outcome: "failure",
      requestId,
      statusCode: 401,
      latencyMs: Date.now() - startedAt,
      metadata: { reason: "unauthorized" }
    });
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createSupabaseServiceClient();

    // Delete expired idempotency keys
    const { data, error } = await admin.rpc("cleanup_expired_idempotency_keys");

    if (error) {
      reportError("cron", "cleanup_idempotency_failed", error, { requestId });
      await recordOperationalEvent({
        eventType: "cron_cleanup_failed",
        flow: "cron",
        outcome: "failure",
        requestId,
        statusCode: 500,
        latencyMs: Date.now() - startedAt,
        metadata: { error: error.message }
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Fallback: if RPC doesn't exist, try direct query
    let deletedCount = 0;
    if (!data) {
      const { error: deleteError } = await admin
        .from("idempotencykeys")
        .delete()
        .lt("expiresat", new Date().toISOString());

      if (deleteError) {
        reportError("cron", "cleanup_idempotency_direct_failed", deleteError, { requestId });
      }
    } else {
      // Count approximate rows affected (if available)
      deletedCount = data || 0;
    }

    await recordOperationalEvent({
      eventType: "cron_cleanup_completed",
      flow: "cron",
      outcome: "success",
      requestId,
      statusCode: 200,
      latencyMs: Date.now() - startedAt,
      metadata: { deletedCount }
    });

    return NextResponse.json(
      {
        ok: true,
        deleted: deletedCount,
        message: "Expired idempotency keys cleaned up",
        ranAt: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err) {
    reportError("cron", "cleanup_idempotency_fatal", err, { requestId });
    await recordOperationalEvent({
      eventType: "cron_cleanup_failed",
      flow: "cron",
      outcome: "failure",
      requestId,
      statusCode: 500,
      latencyMs: Date.now() - startedAt,
      metadata: { error: String(err) }
    });
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
