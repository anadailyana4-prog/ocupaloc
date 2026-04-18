import { addHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

import { notifyClientReminder } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { validateCronSecret } from "@/lib/cron-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type ReminderType = "24h" | "2h";

function getWindow(type: ReminderType): { from: Date; to: Date } {
  const now = new Date();
  if (type === "24h") {
    return {
      from: addHours(now, 23),
      to: addHours(now, 25)
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
  const { data: sentRows } = await admin
    .from("programari_reminders")
    .select("programare_id")
    .eq("tip", type)
    .in("programare_id", ids);

  const sent = new Set((sentRows ?? []).map((r) => r.programare_id));
  let count = 0;

  for (const row of rows) {
    if (sent.has(row.id)) continue;
    const delivered = await sendReminderWithRetry(row.id, type);
    if (!delivered) {
      continue;
    }

    const { error: insErr } = await admin.from("programari_reminders").insert({
      profesionist_id: row.profesionist_id,
      programare_id: row.id,
      tip: type
    });
    if (!insErr) {
      count += 1;
    }
  }

  return count;
}

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, process.env.REMINDERS_CRON_SECRET?.trim())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseServiceClient();
  const sent24h = await sendType(admin, "24h");
  const sent2h = await sendType(admin, "2h");

  return NextResponse.json({
    ok: true,
    sent24h,
    sent2h,
    total: sent24h + sent2h,
    ranAt: new Date().toISOString()
  });
}
