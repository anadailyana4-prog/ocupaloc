import type Stripe from "stripe";
import { NextResponse } from "next/server";

import { processBillingWebhookEvent } from "@/lib/billing/webhook-processor";
import { normalizeBillingStatus, saveBillingSubscriptionSnapshot, type BillingSubscriptionSnapshot } from "@/lib/billing/subscriptions";
import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

function toIsoDate(value: number | null | undefined): string | null {
  if (typeof value !== "number") {
    return null;
  }
  return new Date(value * 1000).toISOString();
}

function buildSnapshotFromSubscription(
  subscription: Stripe.Subscription,
  eventCreated: number,
  fallbackProfesionistId?: string | null
): BillingSubscriptionSnapshot {
  return {
    profesionistId: subscription.metadata?.profesionist_id || fallbackProfesionistId || null,
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null,
    stripeSubscriptionId: subscription.id,
    status: normalizeBillingStatus(subscription.status),
    currentPeriodEnd: toIsoDate(subscription.current_period_end),
    trialEnd: toIsoDate(subscription.trial_end),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    canceledAt: toIsoDate(subscription.canceled_at),
    eventCreated: toIsoDate(eventCreated) || new Date().toISOString()
  };
}

async function buildSnapshotForEvent(stripe: Stripe, event: Stripe.Event): Promise<BillingSubscriptionSnapshot | null> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return buildSnapshotFromSubscription(event.data.object as Stripe.Subscription, event.created);
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subscriptionId) {
        return null;
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return buildSnapshotFromSubscription(subscription, event.created, session.metadata?.profesionist_id || null);
    }
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (!subscriptionId) {
        return null;
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return buildSnapshotFromSubscription(subscription, event.created);
    }
    default:
      return null;
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook configuration." }, { status: 400 });
  }

  const payload = await req.text();
  const stripe = getStripeClient();
  const admin = createSupabaseServiceClient();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    const result = await processBillingWebhookEvent(event, {
      async recordEvent(inputEvent) {
        const { error } = await admin.from("billing_webhook_events").insert({
          stripe_event_id: inputEvent.id,
          event_type: inputEvent.type,
          event_created: toIsoDate(inputEvent.created),
          payload: inputEvent as unknown as Record<string, unknown>
        });

        if (!error) {
          return "inserted";
        }

        const details = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
        if (details.includes("duplicate") || details.includes("23505")) {
          return "duplicate";
        }

        throw new Error(error.message);
      },
      async buildSnapshot(inputEvent) {
        return buildSnapshotForEvent(stripe, inputEvent);
      },
      async persistSnapshot(snapshot) {
        await saveBillingSubscriptionSnapshot(admin, snapshot);
      }
    });

    if (result.handled) {
      console.info("[stripe-webhook]", event.type, event.id, result.duplicate ? "duplicate" : "processed");
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    reportError("billing", "stripe_webhook_verification_failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
}
