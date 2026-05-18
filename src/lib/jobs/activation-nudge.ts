import { enqueueEmail } from "@/lib/email/email-queue";
import { GROWTH_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { reportError } from "@/lib/observability";
import { recordOperationalEvent } from "@/lib/ops-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type ActivationNudgeResult = {
  scanned: number;
  eligible: number;
  enqueued: number;
  skippedMissingEmail: number;
  skippedHasBookings: number;
  skippedCooldown: number;
  failed: number;
};

type TrialRow = {
  profesionist_id: string;
  stripe_subscription_id: string;
  current_period_end: string | null;
};

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ocupaloc.ro").replace(/\/$/, "");
}

export async function runActivationNudgeJob(): Promise<ActivationNudgeResult> {
  const admin = createSupabaseServiceClient();
  const now = Date.now();
  const startedAt = Date.now();

  const minTrialAge = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const maxTrialAge = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: trialSubs, error: trialError } = await admin
    .from("subscriptions")
    .select("profesionist_id, stripe_subscription_id, current_period_end")
    .eq("status", "trialing")
    .gte("created_at", maxTrialAge)
    .lte("created_at", minTrialAge)
    .order("created_at", { ascending: false })
    .limit(500);

  if (trialError) {
    throw new Error(`activation_nudge load trial subscriptions failed: ${trialError.message}`);
  }

  const rows = (trialSubs ?? []) as TrialRow[];
  const uniqueByProf = new Map<string, TrialRow>();
  for (const row of rows) {
    if (!row.profesionist_id) continue;
    if (!uniqueByProf.has(row.profesionist_id)) {
      uniqueByProf.set(row.profesionist_id, row);
    }
  }

  const result: ActivationNudgeResult = {
    scanned: uniqueByProf.size,
    eligible: 0,
    enqueued: 0,
    skippedMissingEmail: 0,
    skippedHasBookings: 0,
    skippedCooldown: 0,
    failed: 0
  };

  for (const [profesionistId, trial] of uniqueByProf.entries()) {
    try {
      if (trial.current_period_end && new Date(trial.current_period_end).getTime() <= now) {
        continue;
      }

      const [bookingCountRes, profRes, cooldownRes] = await Promise.all([
        admin
          .from("programari")
          .select("id", { count: "exact", head: true })
          .eq("profesionist_id", profesionistId)
          .eq("status", "confirmat"),
        admin
          .from("profesionisti")
          .select("email_contact,nume_business")
          .eq("id", profesionistId)
          .maybeSingle(),
        admin
          .from("operational_events")
          .select("id", { count: "exact", head: true })
          .eq("flow", "growth")
          .eq("event_type", GROWTH_EVENT_TYPES.ACTIVATION_NUDGE_TRIGGERED)
          .eq("entity_id", profesionistId)
          .gte("created_at", new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      if ((bookingCountRes.count ?? 0) > 0) {
        result.skippedHasBookings += 1;
        continue;
      }

      if ((cooldownRes.count ?? 0) > 0) {
        result.skippedCooldown += 1;
        continue;
      }

      const toEmail = String(profRes.data?.email_contact ?? "").trim();
      const businessName = String(profRes.data?.nume_business ?? "business-ul tău").trim() || "business-ul tău";
      if (!toEmail) {
        result.skippedMissingEmail += 1;
        continue;
      }

      result.eligible += 1;

      const siteUrl = getSiteUrl();
      const dashboardUrl = `${siteUrl}/dashboard`;
      const subject = "Primești mai repede prima programare: 3 pași simpli";
      const text =
        `Salut!\n\n` +
        `Ai trial activ pentru ${businessName}, dar încă nu ai o programare confirmată. ` +
        `Poți accelera activarea în câteva minute:\n` +
        `1) Publică linkul de rezervare în bio/WhatsApp\n` +
        `2) Confirmă serviciile și intervalele disponibile\n` +
        `3) Trimite linkul către 5-10 clienți recurenți\n\n` +
        `Deschide dashboard-ul: ${dashboardUrl}\n\n` +
        `Echipa OcupaLoc`;
      const html =
        `<!DOCTYPE html><html lang=\"ro\"><head><meta charset=\"utf-8\"></head><body style=\"font-family:sans-serif;background:#09090b;color:#fafaf9;padding:24px\">` +
        `<div style=\"max-width:560px;margin:0 auto\">` +
        `<h1 style=\"font-size:22px;color:#fde68a\">Ai trial activ. Hai la prima programare.</h1>` +
        `<p>Pentru <strong>${businessName}</strong>, încă nu avem o programare confirmată. Avem 3 pași practici care te ajută imediat.</p>` +
        `<ol><li>Publică linkul de rezervare în bio/WhatsApp</li><li>Verifică serviciile și intervalele disponibile</li><li>Trimite linkul către 5-10 clienți recurenți</li></ol>` +
        `<p><a href=\"${dashboardUrl}\" style=\"background:#fde68a;color:#09090b;padding:12px 20px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block\">Deschide dashboard-ul</a></p>` +
        `<p style=\"font-size:12px;color:#a1a1aa\">Acest reminder este trimis automat pentru conturile în trial fără booking confirmat după 24h.</p>` +
        `</div></body></html>`;

      await enqueueEmail(
        {
          template: "activation_nudge_trial_24h",
          toEmail,
          subject,
          payload: { text, html }
        },
        admin
      );

      await recordOperationalEvent({
        eventType: GROWTH_EVENT_TYPES.ACTIVATION_NUDGE_TRIGGERED,
        flow: "growth",
        outcome: "success",
        entityId: profesionistId,
        metadata: {
          trigger: "trial_active_no_confirmed_booking_24h",
          stripeSubscriptionId: trial.stripe_subscription_id
        }
      });

      result.enqueued += 1;
    } catch (error) {
      result.failed += 1;
      reportError("cron", "activation_nudge_item_failed", error, { profesionistId });
    }
  }

  await recordOperationalEvent({
    eventType: GROWTH_EVENT_TYPES.ACTIVATION_NUDGE_JOB_FINISHED,
    flow: "growth",
    outcome: result.failed > 0 ? "failure" : "success",
    latencyMs: Date.now() - startedAt,
    metadata: result
  });

  return result;
}
