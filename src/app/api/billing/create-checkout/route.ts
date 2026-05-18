import { NextResponse } from "next/server";

import { BILLING_TRIAL_DAYS, getSiteUrl, getStripePriceId, isBillingEnabled } from "@/lib/billing/config";
import { isTrialEligible } from "@/lib/billing/entitlement";
import { getOrCreateStripeCustomer } from "@/lib/billing/customer";
import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordOperationalEvent } from "@/lib/ops-events";

async function createCheckoutResponse() {
  if (!isBillingEnabled()) {
    return NextResponse.redirect(new URL("/preturi", getSiteUrl()), 303);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/login", getSiteUrl()), 303);
    }

    if (!user.email_confirmed_at) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Confirmă adresa de email înainte de activarea abonamentului."),
          getSiteUrl()
        ),
        303
      );
    }

    const admin = createSupabaseServiceClient();
    let { data: prof, error: profError } = await admin
      .from("profesionisti")
      .select("id,user_id,slug,nume_business,telefon")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fallback for legacy/migrated accounts where profesionisti.user_id is not aligned,
    // but membership ownership exists through tenant_id.
    if ((!prof || profError) && user.id) {
      const { data: membership } = await admin
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (membership?.tenant_id) {
        const fallback = await admin
          .from("profesionisti")
          .select("id,user_id,slug,nume_business,telefon")
          .eq("id", membership.tenant_id)
          .maybeSingle();
        if (!fallback.error && fallback.data) {
          prof = fallback.data;
          profError = null;
        }
      }
    }

    if (profError || !prof) {
      return NextResponse.redirect(new URL("/onboarding", getSiteUrl()), 303);
    }

    const rateLimitKey = `billing:create-checkout:prof:${String(prof.id)}`;
    const rateLimit = await checkApiRateLimit(admin, rateLimitKey, 8, 10 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.redirect(
        new URL(
          "/dashboard?error=" +
            encodeURIComponent("Ai făcut prea multe încercări de checkout. Încearcă din nou în câteva minute."),
          getSiteUrl()
        ),
        303
      );
    }

    // Guard: block duplicate active subscription
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id,status,stripe_customer_id")
      .eq("profesionist_id", String(prof.id))
      .in("status", ["active", "trialing", "reactivated"])
      .limit(1)
      .maybeSingle();

    const stripe = getStripeClient();

    if (existingSub) {
      if (existingSub.stripe_customer_id) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: String(existingSub.stripe_customer_id),
          return_url: `${getSiteUrl()}/dashboard?info=${encodeURIComponent("Ai deja un abonament activ.")}`
        });
        return NextResponse.redirect(portal.url, 303);
      }

      return NextResponse.redirect(
        new URL("/dashboard?info=Ai+deja+un+abonament+activ.+%C3%8El+po%C8%9Bi+gestiona+din+panoul+de+billing.", getSiteUrl()),
        303
      );
    }
    const customer = await getOrCreateStripeCustomer(stripe, {
      profesionistId: String(prof.id),
      userId: String(user.id),
      slug: String(prof.slug ?? ""),
      businessName: String(prof.nume_business ?? "OcupaLoc"),
      email: user.email ?? null
    });

    const trialEligibility = await isTrialEligible(String(prof.id), {
      admin,
      businessName: prof.nume_business ?? null,
      phone: prof.telefon ?? null
    });

    if (trialEligibility.reason.includes("history_query_failed") || trialEligibility.reason.includes("fingerprint_query_failed")) {
      reportError("billing", "trial_eligibility_check_failed", new Error(trialEligibility.reason), {
        profesionistId: String(prof.id),
        reason: trialEligibility.reason
      });
    }

    const isEligibleForTrial = trialEligibility.eligible;

    // Audit trail: log every trial eligibility decision.
    void recordOperationalEvent({
      eventType: isEligibleForTrial ? BILLING_EVENT_TYPES.TRIAL_GRANTED : BILLING_EVENT_TYPES.TRIAL_DENIED,
      flow: "billing",
      outcome: "success",
      entityId: String(prof.id),
      metadata: {
        profesionistId: String(prof.id),
        userId: String(user.id),
        eligible: isEligibleForTrial,
        reason: trialEligibility.reason,
        fingerprint: trialEligibility.fingerprint
      }
    });

    if (!isEligibleForTrial && trialEligibility.reason.startsWith("has_")) {
      void recordOperationalEvent({
        eventType: BILLING_EVENT_TYPES.REACTIVATION_ATTEMPTED,
        flow: "billing",
        outcome: "success",
        entityId: String(prof.id),
        metadata: {
          profesionistId: String(prof.id),
          userId: String(user.id),
          trialGranted: false,
          reason: trialEligibility.reason
        }
      });
    }

    const subscriptionData: {
      metadata: { profesionist_id: string; user_id: string; slug: string };
      trial_period_days?: number;
    } = {
      metadata: {
        profesionist_id: String(prof.id),
        user_id: String(user.id),
        slug: String(prof.slug ?? "")
      }
    };

    if (isEligibleForTrial) {
      subscriptionData.trial_period_days = BILLING_TRIAL_DAYS;
    }

    // Audit trail: log checkout session start.
    void recordOperationalEvent({
      eventType: BILLING_EVENT_TYPES.CHECKOUT_STARTED,
      flow: "billing",
      outcome: "success",
      entityId: String(prof.id),
      metadata: {
        profesionistId: String(prof.id),
        userId: String(user.id),
        trialGranted: isEligibleForTrial
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      client_reference_id: String(prof.id),
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      allow_promotion_codes: true,
      payment_method_collection: "always",
      success_url: `${getSiteUrl()}/billing/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getSiteUrl()}/billing/anulat`,
      subscription_data: subscriptionData,
      metadata: {
        profesionist_id: String(prof.id),
        user_id: String(user.id),
        slug: String(prof.slug ?? "")
      }
    });

    if (!session.url) {
      return NextResponse.redirect(new URL("/dashboard?error=" + encodeURIComponent("Nu am putut porni checkout-ul. Încearcă din nou."), getSiteUrl()), 303);
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    reportError("billing", "create_checkout_failed", error);
    return NextResponse.redirect(new URL("/dashboard?error=" + encodeURIComponent("Eroare la inițierea plății. Încearcă din nou."), getSiteUrl()), 303);
  }
}

export async function GET() {
  return createCheckoutResponse();
}

export async function POST() {
  return createCheckoutResponse();
}
