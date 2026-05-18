import { addHours, addMinutes, subMinutes } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { NextRequest, NextResponse } from "next/server";

import { notifyClientReminder } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { validateCronSecret } from "@/lib/cron-auth";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

/**
 * POST /api/jobs/send-reminders
 *
 * Cron job that sends email reminders to clients with upcoming appointments.
 * Called by Vercel Cron (or any scheduler) every 30 minutes.
 *
 * Authentication: requires `Authorization: Bearer <CRON_SECRET>` header
 *   (or legacy `x-cron-secret` header).
 *
 * @body {{ type: "24h" | "2h" }} Which reminder window to process.
 *   - "24h": appointments starting in ~24 hours
 *   - "2h":  appointments starting in ~2 hours
 * @returns 200 with `{ sent, skipped, errors }` counts, or 401/500.
 */

type ReminderType = "24h" | "2h" | "morning";
const TZ = "Europe/Bucharest";

function isMissingProgramariRemindersTable(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("programari_reminders") && message.includes("does not exist");
}

function getWindow(type: ReminderType): { from: Date; to: Date } {
  const now = new Date();
  if (type === "24h") {
    // Daily at 11:00: target only bookings from the next calendar day
    // (Europe/Bucharest), so clients get confirm/cancel reminder for "mâine".
    const nextDay = formatInTimeZone(addHours(now, 24), TZ, "yyyy-MM-dd");
    return {
      from: toDate(`${nextDay}T00:00:00`, { timeZone: TZ }),
      to: toDate(`${nextDay}T23:59:59`, { timeZone: TZ })
    };
  }
  if (type === "morning") {
    // Morning at 8-9 AM: target bookings for today (Europe/Bucharest)
    const today = formatInTimeZone(now, TZ, "yyyy-MM-dd");
    return {
      from: toDate(`${today}T00:00:00`, { timeZone: TZ }),
      to: toDate(`${today}T23:59:59`, { timeZone: TZ })
    };
  }
  // 2h reminder: same cadence/tolerance approach as 24h.
  const target = addHours(now, 2);
  return {
    from: subMinutes(target, 2),
    to: addMinutes(target, 3)
  };
}

async function sendReminderWithRetry(programareId: string, type: ReminderType): Promise<boolean> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const sent = await notifyClientReminder(programareId, type);
    if (sent) return true;
    if (attempt < maxAttempts) {
      // Backoff scurt pentru erori tranzitorii la providerul de email.
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }
  reportError("cron", "reminder_delivery_failed", "All reminder retries failed", {
    programareId,
    type
  });
  return false;
}

type ReminderDeliveryStats = {
  sent: number;
  failed: number;
};

async function sendType(admin: ReturnType<typeof createSupabaseServiceClient>, type: ReminderType): Promise<ReminderDeliveryStats> {
  const { from, to } = getWindow(type);

  const { data: rows, error } = await admin
    .from("programari")
    .select("id, profesionist_id")
    .eq("status", "confirmat")
    .not("email_client", "is", null)
    .or("email_reminders_enabled.is.null,email_reminders_enabled.eq.true", { foreignTable: "profesionisti" })
    .gte("data_start", from.toISOString())
    .lte("data_start", to.toISOString())
    .order("data_start", { ascending: true })
    .limit(500);

  if (error || !rows?.length) {
    if (error) {
      reportError("cron", "reminder_query_failed", error, { type });
    }
    return { sent: 0, failed: 0 };
  }

  const { error: trackingCheckError } = await admin
    .from("programari_reminders")
    .select("id")
    .limit(1);

  const trackingDisabled = isMissingProgramariRemindersTable(trackingCheckError);
  if (trackingCheckError && !trackingDisabled) {
    reportError("cron", "reminder_tracking_query_failed", trackingCheckError, { type });
  }
  const stats: ReminderDeliveryStats = {
    sent: 0,
    failed: 0
  };

  for (const row of rows) {
    if (!trackingDisabled) {
      const { data: claimRows, error: claimError } = await admin
        .from("programari_reminders")
        .upsert(
          {
            profesionist_id: row.profesionist_id,
            programare_id: row.id,
            tip: type
          },
          { onConflict: "programare_id,tip", ignoreDuplicates: true }
        )
        .select("id");

      if (claimError) {
        if (!isMissingProgramariRemindersTable(claimError)) {
          reportError("cron", "reminder_tracking_insert_failed", claimError, {
            type,
            programareId: row.id
          });
        }
        continue;
      }

      if (!claimRows?.length) {
        continue;
      }
    }

    const delivered = await sendReminderWithRetry(row.id, type);
    if (!delivered) {
      stats.failed += 1;
      if (!trackingDisabled) {
        const { error: releaseError } = await admin
          .from("programari_reminders")
          .delete()
          .eq("programare_id", row.id)
          .eq("tip", type);

        if (releaseError && !isMissingProgramariRemindersTable(releaseError)) {
          reportError("cron", "reminder_tracking_release_failed", releaseError, {
            type,
            programareId: row.id
          });
        }
      }
      continue;
    }

    stats.sent += 1;
  }

  return stats;
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const requestId = getRequestId(req.headers);

  if (!validateCronSecret(req.headers, process.env.REMINDERS_CRON_SECRET?.trim())) {
    await recordOperationalEvent({
      eventType: "cron_reminders_failed",
      flow: "cron",
      outcome: "failure",
      requestId,
      statusCode: 401,
      latencyMs: Date.now() - startedAt,
      metadata: { reason: "unauthorized" }
    });
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "x-request-id": requestId } });
  }

  const admin = createSupabaseServiceClient();
  let cronError: unknown = null;

  // Determine which reminder types to send
  const typeParam = req.nextUrl.searchParams.get("type");
  const typesToSend: ReminderType[] = typeParam
    ? [typeParam as ReminderType]
    : ["24h", "2h"];

  const totals: ReminderDeliveryStats = { sent: 0, failed: 0 };
  const byType: Record<ReminderType, ReminderDeliveryStats> = {
    "24h": { sent: 0, failed: 0 },
    "2h": { sent: 0, failed: 0 },
    "morning": { sent: 0, failed: 0 }
  };

  try {
    for (const type of typesToSend) {
      byType[type] = await sendType(admin, type);
      totals.sent += byType[type].sent;
      totals.failed += byType[type].failed;
    }
  } catch (err) {
    cronError = err;
    reportError("cron", "send_reminders_fatal", err, { phase: "sendType", requestId });
  }

  const result = {
    ok: cronError === null,
    sent24h: byType["24h"].sent,
    sent2h: byType["2h"].sent,
    sentMorning: byType["morning"].sent,
    sentEmail: totals.sent,
    failed: totals.failed,
    total: totals.sent,
    ranAt: new Date().toISOString(),
    ...(cronError ? { error: String(cronError) } : {})
  };

  await recordOperationalEvent({
    eventType: cronError ? "cron_reminders_failed" : "cron_reminders_sent",
    flow: "cron",
    outcome: cronError ? "failure" : "success",
    requestId,
    statusCode: cronError ? 500 : 200,
    latencyMs: Date.now() - startedAt,
    metadata: result
  });

  // Machine-parseable single-line summary for log scraping / uptime monitors.
  console.log(`[cron:send-reminders] ${JSON.stringify({ ...result, requestId })}`);

  return NextResponse.json(result, { status: cronError ? 500 : 200, headers: { "x-request-id": requestId } });
}
