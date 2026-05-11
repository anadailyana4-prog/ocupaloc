import { addHours, addMinutes, subMinutes } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { NextRequest, NextResponse } from "next/server";

import { notifyClientReminder } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { validateCronSecret } from "@/lib/cron-auth";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";
import { sendReminderSms, type SmsProvider } from "@/lib/sms/reminders";
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
  sentSms: number;
  sentEmail: number;
  fallbackEmailSent: number;
  failed: number;
};

function isSmsProvider(value: string | null | undefined): value is SmsProvider {
  return value === "twilio" || value === "messagebird";
}

async function deliverReminder(
  row: {
    id: string;
    telefon_client: string | null;
    email_client: string | null;
    data_start: string;
    profesionisti: { nume_business?: string | null; sms_reminders_enabled?: boolean | null; sms_provider?: string | null; sms_sender?: string | null; sms_fallback_email?: boolean | null } | { nume_business?: string | null; sms_reminders_enabled?: boolean | null; sms_provider?: string | null; sms_sender?: string | null; sms_fallback_email?: boolean | null }[] | null;
    servicii: { nume?: string | null } | { nume?: string | null }[] | null;
  },
  type: ReminderType
): Promise<{ delivered: boolean; usedSms: boolean; usedEmail: boolean; usedFallbackEmail: boolean }> {
  const relProf = row.profesionisti;
  const relServ = row.servicii;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;
  const provider = profesionist?.sms_provider?.trim();
  const smsEnabled = Boolean(profesionist?.sms_reminders_enabled) && Boolean(row.telefon_client) && isSmsProvider(provider);
  const allowFallbackEmail = profesionist?.sms_fallback_email !== false;

  if (smsEnabled) {
    const smsSent = await sendReminderSms(
      {
        clientPhone: row.telefon_client ?? "",
        salonName: profesionist?.nume_business?.trim() || "acest business",
        serviceName: serviciu?.nume?.trim() || "serviciu",
        startsAt: new Date(row.data_start),
        provider,
        sender: profesionist?.sms_sender ?? null
      },
      type
    );

    if (smsSent) {
      return { delivered: true, usedSms: true, usedEmail: false, usedFallbackEmail: false };
    }

    reportError("cron", "reminder_sms_failed", "SMS reminder failed", {
      programareId: row.id,
      type,
      provider
    });

    if (!allowFallbackEmail) {
      return { delivered: false, usedSms: true, usedEmail: false, usedFallbackEmail: false };
    }

    const emailSent = await sendReminderWithRetry(row.id, type);
    return {
      delivered: emailSent,
      usedSms: true,
      usedEmail: emailSent,
      usedFallbackEmail: emailSent
    };
  }

  const emailSent = await sendReminderWithRetry(row.id, type);
  return {
    delivered: emailSent,
    usedSms: false,
    usedEmail: emailSent,
    usedFallbackEmail: false
  };
}

async function sendType(admin: ReturnType<typeof createSupabaseServiceClient>, type: ReminderType): Promise<ReminderDeliveryStats> {
  const { from, to } = getWindow(type);

  const { data: rows, error } = await admin
    .from("programari")
    .select("id, email_client, telefon_client, data_start, profesionist_id, profesionisti(nume_business, sms_reminders_enabled, sms_provider, sms_sender, sms_fallback_email), servicii(nume)")
    .eq("status", "confirmat")
    .or("email_client.not.is.null,telefon_client.not.is.null")
    .gte("data_start", from.toISOString())
    .lte("data_start", to.toISOString())
    .order("data_start", { ascending: true })
    .limit(500);

  if (error || !rows?.length) {
    if (error) {
      reportError("cron", "reminder_query_failed", error, { type });
    }
    return { sent: 0, sentSms: 0, sentEmail: 0, fallbackEmailSent: 0, failed: 0 };
  }

  const ids = rows.map((r) => r.id);
  const { data: sentRows, error: sentRowsError } = await admin
    .from("programari_reminders")
    .select("programare_id")
    .eq("tip", type)
    .in("programare_id", ids);

  const trackingDisabled = isMissingProgramariRemindersTable(sentRowsError);
  if (sentRowsError && !trackingDisabled) {
    reportError("cron", "reminder_tracking_query_failed", sentRowsError, { type });
  }

  const sent = new Set((sentRows ?? []).map((r) => r.programare_id));
  const stats: ReminderDeliveryStats = {
    sent: 0,
    sentSms: 0,
    sentEmail: 0,
    fallbackEmailSent: 0,
    failed: 0
  };

  for (const row of rows) {
    if (sent.has(row.id)) continue;
    const delivered = await deliverReminder(row, type);
    if (!delivered.delivered) {
      stats.failed += 1;
      continue;
    }

    stats.sent += 1;
    if (delivered.usedSms) stats.sentSms += 1;
    if (delivered.usedEmail) stats.sentEmail += 1;
    if (delivered.usedFallbackEmail) stats.fallbackEmailSent += 1;

    if (trackingDisabled) {
      continue;
    }

    const { error: insErr } = await admin.from("programari_reminders").insert({
      profesionist_id: row.profesionist_id,
      programare_id: row.id,
      tip: type
    });
    if (insErr && !isMissingProgramariRemindersTable(insErr)) {
      reportError("cron", "reminder_tracking_insert_failed", insErr, {
        type,
        programareId: row.id
      });
    }
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

  const totals: ReminderDeliveryStats = { sent: 0, sentSms: 0, sentEmail: 0, fallbackEmailSent: 0, failed: 0 };
  const byType: Record<ReminderType, ReminderDeliveryStats> = {
    "24h": { sent: 0, sentSms: 0, sentEmail: 0, fallbackEmailSent: 0, failed: 0 },
    "2h": { sent: 0, sentSms: 0, sentEmail: 0, fallbackEmailSent: 0, failed: 0 },
    "morning": { sent: 0, sentSms: 0, sentEmail: 0, fallbackEmailSent: 0, failed: 0 }
  };

  try {
    for (const type of typesToSend) {
      byType[type] = await sendType(admin, type);
      totals.sent += byType[type].sent;
      totals.sentSms += byType[type].sentSms;
      totals.sentEmail += byType[type].sentEmail;
      totals.fallbackEmailSent += byType[type].fallbackEmailSent;
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
    sentSms: totals.sentSms,
    sentEmail: totals.sentEmail,
    sentEmailFallback: totals.fallbackEmailSent,
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
