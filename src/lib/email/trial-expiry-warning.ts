/**
 * Trial expiry warning emails.
 * Fires once per professional when their trial ends in ~3 days (window D+2–D+4).
 * Dedup: one send per (professional, trial end instant) via operational_events —
 * safe for daily cron without duplicate emails while the account stays in the window.
 */

import { BILLING_TRIAL_DAYS, isBillingEnabled } from "@/lib/billing/config";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/observability";
import { recordOperationalEvent } from "@/lib/ops-events";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");

const TRIAL_EXPIRY_WARNING_EVENT = "trial_expiry_warning_sent";

async function trialExpiryWarningAlreadyLogged(
  admin: ReturnType<typeof createSupabaseServiceClient>,
  profesionistId: string,
  trialEndIso: string
): Promise<boolean> {
  const since = new Date(Date.now() - 120 * 86400000).toISOString();
  const { data: rows, error } = await admin
    .from("operational_events")
    .select("metadata")
    .eq("event_type", TRIAL_EXPIRY_WARNING_EVENT)
    .eq("entity_id", profesionistId)
    .gte("created_at", since);

  if (error) {
    reportError("cron", "trial_expiry_dedup_query_failed", error);
    return false;
  }

  return (rows ?? []).some((row) => {
    const meta = row.metadata as { trial_end_iso?: string } | null;
    return meta?.trial_end_iso === trialEndIso;
  });
}

function escapeHtml(v: string): string {
  return v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) throw new Error("Resend not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text, html: input.html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

function buildTrialExpiryEmail(business: string, daysLeft: number) {
  const escBusiness = escapeHtml(business);
  const pricingUrl = `${SITE_URL}/preturi`;
  const dashboardUrl = `${SITE_URL}/dashboard/billing`;

  const subject = `Trial OcupaLoc expiră în ${daysLeft} ${daysLeft === 1 ? "zi" : "zile"} — abonează-te pentru a continua`;
  const text = `Bună ziua,\n\nPerioada de trial pentru ${business} expiră în ${daysLeft} ${daysLeft === 1 ? "zi" : "zile"}.\n\nDupă expirare, clienții nu mai pot face rezervări noi.\n\nGestionează abonamentul: ${dashboardUrl}\nPrețuri: ${pricingUrl}\n\nEchipa OcupaLoc`;
  const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="utf-8"></head><body style="font-family:sans-serif;background:#09090b;color:#fafaf9;padding:32px">
<div style="max-width:560px;margin:0 auto">
  <h1 style="font-size:22px;color:#fde68a;margin-bottom:8px">Trial expiră în ${daysLeft} ${daysLeft === 1 ? "zi" : "zile"}</h1>
  <p style="color:#a1a1aa;margin-bottom:16px">Bună ziua,</p>
  <p>Perioada de trial pentru <strong>${escBusiness}</strong> expiră în curând.</p>
  <p>După expirare, clienții nu vor mai putea face rezervări noi prin OcupaLoc.</p>
  <p style="margin:24px 0">
    <a href="${dashboardUrl}" style="background:#fde68a;color:#09090b;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;display:inline-block;margin-right:8px">
      Gestionează abonamentul
    </a>
    <a href="${pricingUrl}" style="color:#60a5fa">Vezi prețurile</a>
  </p>
  <p style="font-size:13px;color:#71717a">Ai întrebări? Răspunde la acest email sau vizitează <a href="${SITE_URL}/suport" style="color:#60a5fa">${SITE_URL}/suport</a>.</p>
  <p style="font-size:13px;color:#71717a;margin-top:24px">Echipa OcupaLoc</p>
</div>
</body></html>`;

  return { subject, text, html };
}

async function sendStripeTrialExpiryWarnings(): Promise<{ sent: number; skipped: number; failed: number }> {
  const admin = createSupabaseServiceClient();
  const now = new Date();
  const trialEndWindowStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const trialEndWindowEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const { data: subs, error: subsErr } = await admin
    .from("subscriptions")
    .select("profesionist_id, current_period_end")
    .eq("status", "trialing")
    .gte("current_period_end", trialEndWindowStart.toISOString())
    .lte("current_period_end", trialEndWindowEnd.toISOString());

  if (subsErr) {
    reportError("cron", "stripe_trial_expiry_query_failed", subsErr);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  if (!subs?.length) return { sent: 0, skipped: 0, failed: 0 };

  const profIds = subs.map((s) => s.profesionist_id as string);
  const { data: profs, error: profErr } = await admin
    .from("profesionisti")
    .select("id, email_contact, nume_business")
    .in("id", profIds)
    .not("email_contact", "is", null)
    .neq("email_contact", "");

  if (profErr) {
    reportError("cron", "stripe_trial_expiry_prof_query_failed", profErr);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const profById = new Map((profs ?? []).map((p) => [p.id as string, p]));
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of subs) {
    const prof = profById.get(sub.profesionist_id as string);
    if (!prof?.email_contact) {
      skipped++;
      continue;
    }

    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end as string).getTime() : 0;
    const trialEndIso = sub.current_period_end ? new Date(sub.current_period_end as string).toISOString() : "";
    if (trialEndIso && (await trialExpiryWarningAlreadyLogged(admin, prof.id as string, trialEndIso))) {
      skipped++;
      continue;
    }

    const daysLeft = Math.max(0, Math.ceil((periodEnd - now.getTime()) / 86400000));
    const business = (prof.nume_business as string | null)?.trim() || "business-ul tău";
    const email = prof.email_contact as string;
    const { subject, text, html } = buildTrialExpiryEmail(business, daysLeft);

    try {
      await sendResendEmail({ to: email, subject, text, html });
      await recordOperationalEvent({
        eventType: TRIAL_EXPIRY_WARNING_EVENT,
        flow: "email",
        outcome: "success",
        entityId: prof.id as string,
        metadata: { trial_end_iso: trialEndIso, channel: "stripe_trialing" },
      });
      sent++;
    } catch (err) {
      reportError("cron", "stripe_trial_expiry_send_failed", err instanceof Error ? err : new Error(String(err)), {
        profId: prof.id
      });
      failed++;
    }
  }

  return { sent, skipped, failed };
}

export async function sendTrialExpiryWarnings(): Promise<{ sent: number; skipped: number; failed: number }> {
  if (isBillingEnabled()) {
    return sendStripeTrialExpiryWarnings();
  }

  const admin = createSupabaseServiceClient();
  const now = new Date();

  // Target: professionals whose trial ends in 2–4 days (D-3 ± 1 day tolerance)
  const trialEndWindowStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const trialEndWindowEnd = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  // Convert back to created_at range: created_at = trialEnd - TRIAL_DAYS
  const createdAtWindowStart = new Date(trialEndWindowStart.getTime() - BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const createdAtWindowEnd = new Date(trialEndWindowEnd.getTime() - BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { data: profs, error: profErr } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, created_at")
    .not("email_contact", "is", null)
    .neq("email_contact", "")
    .gte("onboarding_pas", 4)
    .gte("created_at", createdAtWindowStart.toISOString())
    .lte("created_at", createdAtWindowEnd.toISOString());

  if (profErr) {
    reportError("cron", "trial_expiry_query_failed", profErr);
    return { sent: 0, skipped: 0, failed: 0 };
  }

  if (!profs?.length) return { sent: 0, skipped: 0, failed: 0 };

  // Exclude professionals that already have an active/trialing Stripe subscription
  const profIds = profs.map((p) => p.id);
  const { data: activeSubs } = await admin
    .from("subscriptions")
    .select("profesionist_id")
    .in("profesionist_id", profIds)
    .in("status", ["active", "trialing", "reactivated"]);

  const alreadyPaid = new Set((activeSubs ?? []).map((s) => s.profesionist_id));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const prof of profs) {
    if (alreadyPaid.has(prof.id)) { skipped++; continue; }

    const email = prof.email_contact as string;
    const business = (prof.nume_business as string | null)?.trim() || "business-ul tău";
    const createdAt = new Date(prof.created_at as string);
    const trialEnd = new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const trialEndIso = trialEnd.toISOString();
    if (await trialExpiryWarningAlreadyLogged(admin, prof.id as string, trialEndIso)) {
      skipped++;
      continue;
    }

    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000));

    const { subject, text, html } = buildTrialExpiryEmail(business, daysLeft);

    try {
      await sendResendEmail({ to: email, subject, text, html });
      await recordOperationalEvent({
        eventType: TRIAL_EXPIRY_WARNING_EVENT,
        flow: "email",
        outcome: "success",
        entityId: prof.id as string,
        metadata: { trial_end_iso: trialEndIso, channel: "legacy_trial" },
      });
      sent++;
    } catch (err) {
      reportError("cron", "trial_expiry_send_failed", err instanceof Error ? err : new Error(String(err)), { profId: prof.id });
      failed++;
    }
  }

  return { sent, skipped, failed };
}
