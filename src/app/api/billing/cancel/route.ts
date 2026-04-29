import { NextResponse } from "next/server";

import { getSiteUrl, isBillingEnabled } from "@/lib/billing/config";
import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
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

    for (const sub of localSubs ?? []) {
      if (sub.stripe_customer_id) {
        customerIds.add(String(sub.stripe_customer_id));
      }

      const subId = sub.stripe_subscription_id ? String(sub.stripe_subscription_id) : "";
      if (!subId) continue;

      try {
        await stripe.subscriptions.cancel(subId, { prorate: false });
      } catch (error) {
        reportError("billing", "cancel_subscription_stripe_failed", error, { profesionistId: String(prof.id), subscriptionId: subId });
      }
    }

    const { error: deleteLocalError } = await admin.from("subscriptions").delete().eq("profesionist_id", String(prof.id));
    if (deleteLocalError) {
      reportError("billing", "cancel_subscription_delete_local_failed", deleteLocalError, { profesionistId: String(prof.id) });
      return NextResponse.redirect(new URL("/dashboard?error=" + encodeURIComponent("Abonamentul Stripe a fost oprit, dar nu am putut curăța statusul local."), siteUrl), 303);
    }

    for (const customerId of customerIds) {
      try {
        await stripe.customers.del(customerId);
      } catch (error) {
        reportError("billing", "cancel_subscription_customer_delete_failed", error, { profesionistId: String(prof.id), customerId });
      }
    }

    return NextResponse.redirect(
      new URL(
        "/dashboard?info=" +
          encodeURIComponent("Abonamentul a fost anulat. Nu se vor mai retrage bani, iar înregistrările de abonament au fost eliminate local."),
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
