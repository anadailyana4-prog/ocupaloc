import { enqueueEmail } from "@/lib/email/email-queue";
import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { reportError } from "@/lib/observability";
import { recordOperationalEvent } from "@/lib/ops-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type WinbackCancelReasonsResult = {
  scanned: number;
  eligible: number;
  enqueued: number;
  skippedAlreadyActive: number;
  skippedMissingEmail: number;
  skippedCooldown: number;
  failed: number;
};

type CancelEventRow = {
  entity_id: string | null;
  created_at: string;
  metadata: {
    reason?: string;
  } | null;
};

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ocupaloc.ro").replace(/\/$/, "");
}

export async function runWinbackCancelReasonsJob(): Promise<WinbackCancelReasonsResult> {
  const admin = createSupabaseServiceClient();
  const now = Date.now();

  const targetFrom = new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString();
  const targetTo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: canceledRows, error: canceledError } = await admin
    .from("operational_events")
    .select("entity_id, created_at, metadata")
    .eq("flow", "billing")
    .eq("event_type", BILLING_EVENT_TYPES.SUBSCRIPTION_CANCELED)
    .gte("created_at", targetFrom)
    .lte("created_at", targetTo)
    .order("created_at", { ascending: false })
    .limit(500);

  if (canceledError) {
    throw new Error(`load canceled events failed: ${canceledError.message}`);
  }

  const rows = (canceledRows ?? []) as CancelEventRow[];
  const latestByProf = new Map<string, CancelEventRow>();

  for (const row of rows) {
    const profesionistId = row.entity_id?.trim();
    if (!profesionistId) continue;
    if ((row.metadata?.reason ?? "") !== "temporar_inchis") continue;

    const existing = latestByProf.get(profesionistId);
    if (!existing || new Date(row.created_at).getTime() > new Date(existing.created_at).getTime()) {
      latestByProf.set(profesionistId, row);
    }
  }

  const result: WinbackCancelReasonsResult = {
    scanned: rows.length,
    eligible: 0,
    enqueued: 0,
    skippedAlreadyActive: 0,
    skippedMissingEmail: 0,
    skippedCooldown: 0,
    failed: 0
  };

  for (const [profesionistId, cancelEvent] of latestByProf.entries()) {
    try {
      const [subRes, profRes, cooldownRes] = await Promise.all([
        admin
          .from("subscriptions")
          .select("status")
          .eq("profesionist_id", profesionistId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("profesionisti")
          .select("email_contact,nume_business")
          .eq("id", profesionistId)
          .maybeSingle(),
        admin
          .from("operational_events")
          .select("id", { count: "exact", head: true })
          .eq("flow", "billing")
          .eq("event_type", BILLING_EVENT_TYPES.WINBACK_OFFER_SENT)
          .eq("entity_id", profesionistId)
          .gte("created_at", new Date(now - 180 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const lastStatus = subRes.data?.status ?? null;
      if (lastStatus === "active" || lastStatus === "trialing" || lastStatus === "reactivated") {
        result.skippedAlreadyActive += 1;
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
      const checkoutUrl = `${siteUrl}/api/billing/create-checkout`;
      const subject = "Revenire OcupaLoc: reactivați contul când sunteți gata";
      const text =
        `Salut!\n\n` +
        `Am observat că ai întrerupt temporar activitatea pentru ${businessName}. ` +
        `Când ești pregătit să revii, poți reactiva abonamentul imediat din ${checkoutUrl}.\n\n` +
        `Notă: reactivarea nu include o nouă perioadă de trial.\n\n` +
        `Echipa OcupaLoc`;
      const html =
        `<!DOCTYPE html><html lang=\"ro\"><head><meta charset=\"utf-8\"></head><body style=\"font-family:sans-serif;background:#09090b;color:#fafaf9;padding:24px\">` +
        `<div style=\"max-width:560px;margin:0 auto\">` +
        `<h1 style=\"font-size:22px;color:#fde68a\">Suntem aici când revii</h1>` +
        `<p>Știm că ${businessName} a fost închis temporar. Când ești gata, poți reactiva rapid din butonul de mai jos.</p>` +
        `<p style=\"margin:24px 0\"><a href=\"${checkoutUrl}\" style=\"background:#fde68a;color:#09090b;padding:12px 22px;border-radius:9999px;text-decoration:none;font-weight:600\">Reactivează abonamentul</a></p>` +
        `<p style=\"font-size:13px;color:#a1a1aa\">Reactivarea standard nu include automat o nouă perioadă de trial.</p>` +
        `<p style=\"font-size:13px;color:#71717a\">Echipa OcupaLoc</p>` +
        `</div></body></html>`;

      await enqueueEmail({
        template: "billing_winback_temporar_inchis",
        toEmail,
        subject,
        payload: { text, html }
      }, admin);

      await recordOperationalEvent({
        eventType: BILLING_EVENT_TYPES.WINBACK_OFFER_SENT,
        flow: "billing",
        outcome: "success",
        entityId: profesionistId,
        metadata: {
          reason: "temporar_inchis",
          cancelEventAt: cancelEvent.created_at,
          channel: "email"
        }
      });

      result.enqueued += 1;
    } catch (error) {
      result.failed += 1;
      reportError("cron", "winback_cancel_reasons_item_failed", error, {
        profesionistId
      });
    }
  }

  return result;
}
