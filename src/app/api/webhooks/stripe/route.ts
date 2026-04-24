import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";

export type StripeWebhookDeps = {
  getStripe: typeof getStripeClient;
};

const defaultDeps: StripeWebhookDeps = { getStripe: getStripeClient };

export async function handleStripeWebhookRequest(
  req: Request,
  deps: StripeWebhookDeps = defaultDeps
): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = req.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook configuration." }, { status: 400 });
  }

  const payload = await req.text();
  const stripe = deps.getStripe();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        console.info("[stripe-webhook]", event.type, event.id);
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

export async function POST(req: Request) {
  return handleStripeWebhookRequest(req);
}
