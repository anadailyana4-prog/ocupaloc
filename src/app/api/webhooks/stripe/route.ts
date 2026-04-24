import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Upsert subscription row in DB from a Stripe Subscription object.
// Always uses service role — never exposed to public.
// ---------------------------------------------------------------------------
async function upsertSubscription(subscription: Stripe.Subscription): Promise<void> {
  const admin = createSupabaseServiceClient();

  const profesionistId = subscription.metadata?.profesionist_id ?? null;
  if (!profesionistId) {
    // Fallback: look up by customer id in our subscriptions table.
    console.warn("[stripe-webhook] subscription missing profesionist_id metadata:", subscription.id);
    return;
  }

  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  const trialStart = subscription.trial_start
    ? new Date(subscription.trial_start * 1000).toISOString()
    : null;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : null;
  const canceledAt = subscription.canceled_at
    ? new Date(subscription.canceled_at * 1000).toISOString()
    : null;

  const { error } = await admin.from("subscriptions").upsert(
    {
      profesionist_id: profesionistId,
      stripe_customer_id: String(subscription.customer),
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      trial_start: trialStart,
      trial_end: trialEnd,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      canceled_at: canceledAt
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (error) {
    reportError("billing", "subscription_upsert_failed", error, {
      subscriptionId: subscription.id,
      profesionistId,
      status: subscription.status
    });
  }
}

// ---------------------------------------------------------------------------
// Resolve subscription from checkout.session.completed event.
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripe: ReturnType<typeof getStripeClient>): Promise<void> {
  if (session.mode !== "subscription" || !session.subscription) return;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // Inject profesionist_id from session metadata if missing on subscription.
  if (!subscription.metadata?.profesionist_id && session.metadata?.profesionist_id) {
    await stripe.subscriptions.update(subscriptionId, {
      metadata: { ...subscription.metadata, profesionist_id: session.metadata.profesionist_id }
    });
    subscription.metadata = { ...subscription.metadata, profesionist_id: session.metadata.profesionist_id };
  }
  await upsertSubscription(subscription);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook configuration." }, { status: 400 });
  }

  const payload = await req.text();
  const stripe = getStripeClient();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, stripe);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        // Refresh subscription after successful payment to capture new period.
        const invoice = event.data.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);
        }
        break;
      }
      case "invoice.payment_failed": {
        // Let the subscription.updated event handle status → past_due transition.
        // Log here for ops visibility.
        const invoice = event.data.object as Stripe.Invoice;
        reportError("billing", "invoice_payment_failed", "Stripe invoice payment failed", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_due
        });
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    reportError("billing", "stripe_webhook_verification_failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
}

