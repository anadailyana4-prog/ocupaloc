import { NextResponse } from "next/server";

import { BILLING_TRIAL_DAYS, getSiteUrl, getStripePriceId, isBillingEnabled } from "@/lib/billing/config";
import { getOrCreateStripeCustomer } from "@/lib/billing/customer";
import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  if (!isBillingEnabled()) {
    return NextResponse.redirect(new URL("/preturi", getSiteUrl()), 303);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", getSiteUrl()), 303);
    }

    const admin = createSupabaseServiceClient();
    const { data: prof, error: profError } = await admin
      .from("profesionisti")
      .select("id,user_id,slug,nume_business,email_contact")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profError || !prof) {
      return NextResponse.redirect(new URL("/dashboard?error=" + encodeURIComponent("Profilul profesional nu a fost găsit. Completează onboarding-ul."), getSiteUrl()), 303);
    }

    // Guard: block duplicate active subscription
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id,status,stripe_customer_id")
      .eq("profesionist_id", String(prof.id))
      .in("status", ["active", "trialing"])
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
      email: prof.email_contact ? String(prof.email_contact) : user.email ?? null
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      client_reference_id: String(prof.id),
      line_items: [{ price: getStripePriceId(), quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${getSiteUrl()}/billing/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getSiteUrl()}/billing/anulat`,
      subscription_data: {
        trial_period_days: BILLING_TRIAL_DAYS,
        metadata: {
          profesionist_id: String(prof.id),
          user_id: String(user.id),
          slug: String(prof.slug ?? "")
        }
      },
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
