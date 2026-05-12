import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/config/env";
import { validateCronSecret } from "@/lib/cron-auth";
import { reportError } from "@/lib/observability";
import { notifyAdmins } from "@/lib/outreach/telegram-bot";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REMINDER_AFTER_HOURS = 24;

type ZoneReminderCandidate = {
  id: string;
  display_name: string;
  exhaustion_stage: string;
  updated_at: string;
};

function hoursAgoIso(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function hasRecentReminder(zoneId: string) {
  const admin = createSupabaseServiceClient();
  const result = await admin
    .from("operator_actions")
    .select("id")
    .eq("action_type", "approve_next_reminder_sent")
    .eq("target_type", "coverage_zone")
    .eq("target_id", zoneId)
    .gte("created_at", hoursAgoIso(REMINDER_AFTER_HOURS))
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return Boolean(result.data);
}

async function markReminderSent(zone: ZoneReminderCandidate) {
  const admin = createSupabaseServiceClient();
  const insert = await admin.from("operator_actions").insert({
    action_type: "approve_next_reminder_sent",
    role: "operator",
    actor_label: "system-cron",
    target_type: "coverage_zone",
    target_id: zone.id,
    notes: `Reminder trimis pentru zona ${zone.display_name} (${zone.exhaustion_stage})`,
    payload: {
      zoneId: zone.id,
      zoneName: zone.display_name,
      exhaustionStage: zone.exhaustion_stage,
      thresholdHours: REMINDER_AFTER_HOURS
    }
  });

  if (insert.error) {
    throw insert.error;
  }
}

export async function GET(request: NextRequest) {
  const secret = env.optional("OUTREACH_CRON_SECRET") ?? env.optional("CRON_SECRET");
  if (!validateCronSecret(request.headers, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "true";

  try {
    const admin = createSupabaseServiceClient();
    const zoneResult = await admin
      .from("coverage_zones")
      .select("id, display_name, exhaustion_stage, updated_at")
      .eq("is_active", true)
      .in("exhaustion_stage", ["exhausted_candidate", "exhausted_final"]) 
      .lte("updated_at", hoursAgoIso(REMINDER_AFTER_HOURS));

    if (zoneResult.error) {
      throw zoneResult.error;
    }

    const zones = (zoneResult.data ?? []) as ZoneReminderCandidate[];
    if (zones.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: "No candidate zones" });
    }

    let sent = 0;
    const skipped: string[] = [];

    for (const zone of zones) {
      const recentlySent = await hasRecentReminder(zone.id);
      if (recentlySent && !force) {
        skipped.push(zone.id);
        continue;
      }

      const message = [
        "⚠️ REMINDER APROBARE",
        "",
        `Zona: ${zone.display_name}`,
        `Status epuizare: ${zone.exhaustion_stage}`,
        `Au trecut peste ${REMINDER_AFTER_HOURS}h fara /approve-next.`,
        "Actiune recomandata: foloseste /approve-next pentru trecerea controlata."
      ].join("\n");

      await notifyAdmins(message);
      await markReminderSent(zone);
      sent += 1;
    }

    return NextResponse.json({ ok: true, sent, skipped: skipped.length });
  } catch (error) {
    reportError("cron", "outreach_approval_reminders_failed", error, { force });
    return NextResponse.json({ ok: false, error: "Outreach approval reminders failed" }, { status: 500 });
  }
}
