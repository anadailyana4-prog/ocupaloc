import { addHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import { notifyClientReminder } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { validateCronSecret } from "@/lib/cron-auth";
import { getRequestId, recordOperationalEvent } from "@/lib/ops-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type ReminderType = "24h" | "2h";

function isMissingProgramariRemindersTable(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("programari_reminders") && message.includes("does not exist");
}

function getWindow(type: ReminderType): { from: Date; to: Date } {
  const now = new Date();
  if (type === "24h") {
    // Window covers the full next-day slice so a once-daily cron catches all booking
    // times regardless of the hour they are scheduled. The programari_reminders
    // dedup table prevents a booking from receiving the same reminder twice.
    return {
      from: addHours(now, 23),
      to: addHours(now, 47)
    };
  }
  return {
    from: addHours(now, 1),
    to: addHours(now, 3)
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

async function sendType(admin: ReturnType<typeof createSupabaseServiceClient>, type: ReminderType): Promise<number> {
  const { from, to } = getWindow(type);

  const { data: rows, error } = await admin
    .from("programari")
    .select("id, email_client, profesionist_id")
    .eq("status", "confirmat")
    .not("email_client", "is", null)
    .gte("data_start", from.toISOString())
    .lte("data_start", to.toISOString())
    .order("data_start", { ascending: true })
    .limit(500);

  if (error || !rows?.length) {
    if (error) {
      reportError("cron", "reminder_query_failed", error, { type });
    }
    return 0;
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
  let count = 0;

  for (const row of rows) {
    if (sent.has(row.id)) continue;
    const delivered = await sendReminderWithRetry(row.id, type);
    if (!delivered) {
      continue;
    }

    count += 1;

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

  return count;
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

  let sent24h = 0;
  let sent2h = 0;

  try {
    sent24h = await sendType(admin, "24h");
    sent2h = await sendType(admin, "2h");
  } catch (err) {
    cronError = err;
    reportError("cron", "send_reminders_fatal", err, { phase: "sendType", requestId });
  }

  const result = {
    ok: cronError === null,
    sent24h,
    sent2h,
    total: sent24h + sent2h,
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
    metadata: { sent24h, sent2h, total: sent24h + sent2h }
  });

  // Machine-parseable single-line summary for log scraping / uptime monitors.
  console.log(`[cron:send-reminders] ${JSON.stringify({ ...result, requestId })}`);

  return NextResponse.json(result, { status: cronError ? 500 : 200, headers: { "x-request-id": requestId } });
}
