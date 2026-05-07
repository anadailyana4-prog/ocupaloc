import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/billing/stripe";
import { env } from "@/lib/config/env";
import { processStripeWebhookEvent } from "@/lib/billing/stripe-webhook-service";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type StripeWebhookDeps = {
  getStripe: typeof getStripeClient;
  getAdmin: typeof createSupabaseServiceClient;
  processEvent: typeof processStripeWebhookEvent;
};

const defaultDeps: StripeWebhookDeps = {
  getStripe: getStripeClient,
  getAdmin: createSupabaseServiceClient,
  processEvent: processStripeWebhookEvent
}

export async function handleStripeWebhookRequest(
  req: Request,
  deps: StripeWebhookDeps = defaultDeps
): Promise<NextResponse> {
  const secret = env.optional("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = deps.getStripe();
  const admin = deps.getAdmin();

  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEventAsync>>;
  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch (err) {
    reportError("billing", "stripe_webhook_signature_error", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const result = await deps.processEvent(stripe, admin, event);
    return NextResponse.json({
      received: true,
      replayed: result.replayed,
      eventId: event.id,
      eventType: event.type
    });
  } catch (error) {
    reportError("billing", "stripe_webhook_handler_error", error, {
      eventType: event.type,
      eventId: event.id
    });
    return NextResponse.json({
      received: false,
      error: "Webhook processing failed",
      eventId: event.id
    }, { status: 500 });
  }
}
