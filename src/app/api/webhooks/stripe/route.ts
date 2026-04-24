import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

async function resolveProfesionistId(
  stripe: ReturnType<typeof getStripeClient>,
  admin: ReturnType<typeof createSupabaseServiceClient>,
  obj: Record<string, unknown>
): Promise<string | null> {
  // 1. Direct metadata on the object
  const meta = (obj.metadata ?? {}) as Record<string, string>;
  if (meta.profesionist_id) return meta.profesionist_id;

  // 2. For invoice events: look up subscription metadata
  const subId = (obj.subscription ?? obj.id) as string | undefined;
  if (subId && subId.startsWith("sub_")) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      if (sub.metadata?.profesionist_id) return sub.metadata.profesionist_id;
    } catch {
      // ignore
    }
  }

  // 3. Look up by stripe_customer_id in subscriptions table
  const customerId = obj.customer as string | undefined;
  if (customerId) {
    const { data } = await admin
      .from("subscriptions")
      .select("profesionist_id")
      .eq("stripe_customer_id", customerId)
      .limit(1)
      .maybeSingle();
    if (data?.profesionist_id) return String(data.profesionist_id);
  }

  return null;
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

  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEventAsync>>;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (error) {
    reportError("billing", "stripe_webhook_verification_failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const obj = event.data.object as unknown as Record<string, unknown>;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const subId = obj.subscription as string | undefined;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const profId = await resolveProfesionistId(stripe, admin, { ...sub, ...obj });
        if (!profId) {
          reportError("billing", "webhook_missing_profesionist_id", event.type, { eventId: event.id });
          break;
        }
        await admin.from("subscriptions").upsert(
          {
            profesionist_id: profId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: String(sub.customer),
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString()
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const profId = await resolveProfesionistId(stripe, admin, obj);
        if (!profId) {
          reportError("billing", "webhook_missing_profesionist_id", event.type, { eventId: event.id });
          break;
        }
        await admin.from("subscriptions").upsert(
          {
            profesionist_id: profId,
            stripe_subscription_id: String(obj.id),
            stripe_customer_id: String(obj.customer),
            status: event.type === "customer.subscription.deleted" ? "canceled" : String(obj.status),
            current_period_start: obj.current_period_start
              ? new Date((obj.current_period_start as number) * 1000).toISOString()
              : null,
            current_period_end: obj.current_period_end
              ? new Date((obj.current_period_end as number) * 1000).toISOString()
              : null,
            cancel_at_period_end: Boolean(obj.cancel_at_period_end),
            updated_at: new Date().toISOString()
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }
      case "invoice.payment_succeeded": {
        const subId = obj.subscription as string | undefined;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const profId = await resolveProfesionistId(stripe, admin, { ...sub });
        if (!profId) {
          reportError("billing", "webhook_missing_profesionist_id", event.type, { eventId: event.id });
          break;
        }
        await admin.from("subscriptions").upsert(
          {
            profesionist_id: profId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: String(sub.customer),
            status: "active",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString()
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }
      case "invoice.payment_failed": {
        const subId = obj.subscription as string | undefined;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const profId = await resolveProfesionistId(stripe, admin, { ...sub });
        if (!profId) {
          reportError("billing", "webhook_missing_profesionist_id", event.type, { eventId: event.id });
          break;
        }
        await admin.from("subscriptions").upsert(
          {
            profesionist_id: profId,
            stripe_subscription_id: sub.id,
            stripe_customer_id: String(sub.customer),
            status: "past_due",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString()
          },
          { onConflict: "stripe_subscription_id" }
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    reportError("billing", "stripe_webhook_handler_error", error, { eventType: event.type });
  }

  return NextResponse.json({ received: true });
}
