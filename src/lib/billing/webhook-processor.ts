import type Stripe from "stripe";

import type { BillingSubscriptionSnapshot } from "@/lib/billing/subscriptions";

type ProcessDeps = {
  recordEvent: (event: Stripe.Event) => Promise<"inserted" | "duplicate">;
  buildSnapshot: (event: Stripe.Event) => Promise<BillingSubscriptionSnapshot | null>;
  persistSnapshot: (snapshot: BillingSubscriptionSnapshot) => Promise<void>;
};

export type BillingWebhookProcessResult = {
  handled: boolean;
  duplicate: boolean;
};

export const HANDLED_BILLING_EVENTS = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed"
]);

export async function processBillingWebhookEvent(
  event: Stripe.Event,
  deps: ProcessDeps
): Promise<BillingWebhookProcessResult> {
  if (!HANDLED_BILLING_EVENTS.has(event.type)) {
    return { handled: false, duplicate: false };
  }

  const state = await deps.recordEvent(event);
  if (state === "duplicate") {
    return { handled: true, duplicate: true };
  }

  const snapshot = await deps.buildSnapshot(event);
  if (snapshot) {
    await deps.persistSnapshot(snapshot);
  }

  return { handled: true, duplicate: false };
}
