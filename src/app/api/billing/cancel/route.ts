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
    for (const subId of subscriptionIdsToCancel) {
      try {
        await stripe.subscriptions.cancel(subId, { prorate: false });
        canceledCount += 1;
      } catch (error) {
        reportError("billing", "cancel_subscription_stripe_failed", error, { profesionistId: String(prof.id), subscriptionId: subId });
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
        "/dashboard?canceled=1&info=" +
          encodeURIComponent("Abonamentul a fost anulat în Stripe. Nu se vor mai retrage bani, iar înregistrările locale au fost curățate."),
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
