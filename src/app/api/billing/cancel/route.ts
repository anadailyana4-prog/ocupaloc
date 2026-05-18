import { NextResponse } from "next/server";

import { getSiteUrl, isBillingEnabled } from "@/lib/billing/config";
import { getStripeClient } from "@/lib/billing/stripe";
import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { recordOperationalEvent } from "@/lib/ops-events";
import { reportError } from "@/lib/observability";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let siteUrl: string;
  try {
    siteUrl = getSiteUrl();
  } catch {
    return NextResponse.redirect("https://ocupaloc.ro/dashboard", 303);
  }

  if (!isBillingEnabled()) {
    return NextResponse.redirect(new URL("/dashboard?info=" + encodeURIComponent("Billing este dezactivat."), siteUrl), 303);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", siteUrl), 303);
    }

    const admin = createSupabaseServiceClient();
    let { data: prof, error: profError } = await admin
      .from("profesionisti")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if ((!prof || profError) && user.id) {
      const { data: membership } = await admin
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membership?.tenant_id) {
        const fallback = await admin.from("profesionisti").select("id").eq("id", membership.tenant_id).maybeSingle();
        if (!fallback.error && fallback.data) {
          prof = fallback.data;
          profError = null;
        }
      }
    }

    if (profError || !prof?.id) {
      return NextResponse.redirect(new URL("/onboarding", siteUrl), 303);
    }

    const rateLimitKey = `billing:cancel:prof:${String(prof.id)}`;
    const rateLimit = await checkApiRateLimit(admin, rateLimitKey, 4, 30 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Ai trimis prea multe cereri de anulare. Încearcă din nou în aproximativ 30 de minute."),
          siteUrl
        ),
        303
      );
    }

    const formData = await request.formData();
    const cancelReasonRaw = String(formData.get("cancel_reason") ?? "").trim();
    const cancelNoteRaw = String(formData.get("cancel_note") ?? "").trim();
    const cancelModeRaw = String(formData.get("cancel_mode") ?? "period_end").trim();
    const cancelMode = cancelModeRaw === "immediate" ? "immediate" : "period_end";
    const allowedReasons = new Set([
      "prea_scump",
      "lipsa_functii",
      "temporar_inchis",
      "suport",
      "altul"
    ]);

    if (!allowedReasons.has(cancelReasonRaw)) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Alege un motiv valid pentru anulare înainte să continui."),
          siteUrl
        ),
        303
      );
    }

    const { data: localSubs, error: subsError } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, status")
      .eq("profesionist_id", String(prof.id));

    if (subsError) {
      reportError("billing", "cancel_subscription_load_local_failed", subsError, { profesionistId: String(prof.id) });
      return NextResponse.redirect(new URL("/dashboard?error=" + encodeURIComponent("Nu am putut încărca abonamentul."), siteUrl), 303);
    }

    const stripe = getStripeClient();
    const customerIds = new Set<string>();
    const subscriptionIdsToCancel = new Set<string>();

    for (const sub of localSubs ?? []) {
      if (sub.stripe_customer_id) {
        customerIds.add(String(sub.stripe_customer_id));
      }
      if (sub.stripe_subscription_id) {
        subscriptionIdsToCancel.add(String(sub.stripe_subscription_id));
      }
    }

    // Fallback for stale local state: derive Stripe customer by current user email.
    if (customerIds.size === 0 && user.email) {
      try {
        const customerList = await stripe.customers.list({ email: user.email, limit: 10 });
        for (const c of customerList.data) {
          customerIds.add(c.id);
        }
      } catch (error) {
        reportError("billing", "cancel_subscription_find_customer_failed", error, {
          profesionistId: String(prof.id)
        });
      }
    }

    // If no local subscription rows exist, inspect Stripe subscriptions for known customers.
    if (subscriptionIdsToCancel.size === 0 && customerIds.size > 0) {
      for (const customerId of customerIds) {
        try {
          const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
          for (const subscription of subscriptions.data) {
            const metaProfId = subscription.metadata?.profesionist_id;
            if (metaProfId && metaProfId !== String(prof.id)) continue;

            if (
              subscription.status === "active" ||
              subscription.status === "trialing" ||
              subscription.status === "past_due" ||
              subscription.status === "unpaid"
            ) {
              subscriptionIdsToCancel.add(subscription.id);
            }
          }
        } catch (error) {
          reportError("billing", "cancel_subscription_list_customer_subscriptions_failed", error, {
            profesionistId: String(prof.id),
            customerId
          });
        }
      }
    }

    if (subscriptionIdsToCancel.size === 0) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Nu am găsit un abonament activ de anulat. Verifică Billing Portal sau contactează suportul."),
          siteUrl
        ),
        303
      );
    }

    let canceledCount = 0;
    const canceledRows: Array<{
      stripe_subscription_id: string;
      stripe_customer_id: string;
      status: string;
      cancel_at_period_end: boolean;
      current_period_start: string | null;
      current_period_end: string | null;
    }> = [];

    for (const subId of subscriptionIdsToCancel) {
      try {
        const canceledSub =
          cancelMode === "immediate"
            ? await stripe.subscriptions.cancel(subId, { prorate: false })
            : await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
        const canceledSubRecord = canceledSub as unknown as Record<string, unknown>;
        const currentPeriodStart =
          typeof canceledSubRecord.current_period_start === "number"
            ? new Date(canceledSubRecord.current_period_start * 1000).toISOString()
            : null;
        const currentPeriodEnd =
          typeof canceledSubRecord.current_period_end === "number"
            ? new Date(canceledSubRecord.current_period_end * 1000).toISOString()
            : null;
        const customerId = typeof canceledSub.customer === "string" ? canceledSub.customer : canceledSub.customer.id;

        if (customerId) {
          customerIds.add(customerId);
          canceledRows.push({
            stripe_subscription_id: canceledSub.id,
            stripe_customer_id: customerId,
            status: canceledSub.status,
            cancel_at_period_end: Boolean(canceledSub.cancel_at_period_end),
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd
          });
        }

        canceledCount += 1;
      } catch (error) {
        reportError("billing", "cancel_subscription_stripe_failed", error, {
          profesionistId: String(prof.id),
          subscriptionId: subId
        });
      }
    }

    if (canceledCount === 0) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Nu am putut confirma anularea în Stripe. Nu s-a aplicat nicio schimbare locală."),
          siteUrl
        ),
        303
      );
    }

    if (canceledRows.length === 0) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Abonamentul a fost actualizat în Stripe, dar nu am putut identifica datele locale pentru sincronizare."),
          siteUrl
        ),
        303
      );
    }

    const { error: upsertCanceledError } = await admin
      .from("subscriptions")
      .upsert(
        canceledRows.map((row) => ({
          profesionist_id: String(prof.id),
          stripe_subscription_id: row.stripe_subscription_id,
          stripe_customer_id: row.stripe_customer_id,
          status: row.status,
          cancel_at_period_end: row.cancel_at_period_end,
          current_period_start: row.current_period_start,
          current_period_end: row.current_period_end,
          updated_at: new Date().toISOString()
        })),
        { onConflict: "stripe_subscription_id" }
      );

    if (upsertCanceledError) {
      reportError("billing", "cancel_subscription_upsert_canceled_failed", upsertCanceledError, {
        profesionistId: String(prof.id)
      });
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Abonamentul Stripe a fost oprit, dar nu am putut sincroniza statusul local corect."),
          siteUrl
        ),
        303
      );
    }

    await recordOperationalEvent({
      eventType: BILLING_EVENT_TYPES.SUBSCRIPTION_CANCELED,
      flow: "billing",
      outcome: "success",
      entityId: String(prof.id),
      metadata: {
        reason: cancelReasonRaw,
        note: cancelNoteRaw || null,
        canceledCount,
        cancelType: cancelMode
      }
    });

    const infoMessage =
      cancelMode === "immediate"
        ? "Abonamentul a fost anulat imediat. Accesul a fost oprit și istoricul de billing a fost păstrat."
        : "Abonamentul rămâne activ până la finalul perioadei curente și nu se va reînnoi automat.";

    return NextResponse.redirect(
      new URL(
        "/dashboard?canceled=1&info=" +
          encodeURIComponent(infoMessage),
        siteUrl
      ),
      303
    );
  } catch (error) {
    reportError("billing", "cancel_subscription_unexpected_error", error);
    return NextResponse.redirect(
      new URL("/dashboard?error=" + encodeURIComponent("Nu am putut anula abonamentul acum. Încearcă din nou."), siteUrl),
      303
    );
  }
}
