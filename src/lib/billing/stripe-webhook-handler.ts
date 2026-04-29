import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/billing/stripe";
import { reportError } from "@/lib/observability";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

// ─── Dependency injection type ────────────────────────────────────────────────
// Allows replacing real Stripe SDK and Supabase admin in unit tests.

export type StripeWebhookDeps = {
  getStripe: typeof getStripeClient;
  getAdmin: typeof createSupabaseServiceClient;
};

const defaultDeps: StripeWebhookDeps = {
  getStripe: getStripeClient,
  getAdmin: createSupabaseServiceClient,
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function resolveProfesionistId(
  stripe: ReturnType<typeof getStripeClient>,
  admin: ReturnType<typeof createSupabaseServiceClient>,
  obj: Record<string, unknown>
): Promise<string | null> {
  // 1. Direct metadata on the object
  const meta = (obj.metadata ?? {}) as Record<string, string>;
  if (meta.profesionist_id) return meta.profesionist_id;

  // 2. For invoice/sub events: look up subscription metadata via Stripe SDK
  const subId = (obj.subscription ?? obj.id) as string | undefined;
  if (subId && subId.startsWith("sub_")) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      if (sub.metadata?.profesionist_id) return sub.metadata.profesionist_id;
    } catch {
      // ignore – test stubs may not implement retrieve
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
    if (data?.profesionist_id) return data.profesionist_id;
  }

  return null;
}

// ─── Exported handler (injectable for tests) ─────────────────────────────────

export async function handleStripeWebhookRequest(
  req: Request,
  deps: StripeWebhookDeps = defaultDeps
): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
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

  const obj = (event.data?.object ?? {}) as unknown as Record<string, unknown>;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const subId = obj.subscription as string | undefined;
        if (!subId) break;
        const profesionistId = await resolveProfesionistId(stripe, admin, obj);
        if (!profesionistId) {
          reportError("billing", "stripe_webhook_profesionist_unresolved", "Missing profesionist_id mapping", {
            eventType: event.type,
            subId,
            customerId: obj.customer as string | undefined,
            eventId: event.id
          });
          break;
        }
        await admin
          .from("subscriptions")
          .upsert(
            {
              profesionist_id: profesionistId,
              stripe_subscription_id: subId,
              stripe_customer_id: obj.customer as string,
              status: "active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subId = obj.id as string | undefined;
        if (!subId) break;
        const profesionistId = await resolveProfesionistId(stripe, admin, obj);
        if (!profesionistId) {
          reportError("billing", "stripe_webhook_profesionist_unresolved", "Missing profesionist_id mapping", {
            eventType: event.type,
            subId,
            customerId: obj.customer as string | undefined,
            eventId: event.id
          });
          break;
        }
        await admin
          .from("subscriptions")
          .upsert(
            {
              profesionist_id: profesionistId,
              stripe_subscription_id: subId,
              stripe_customer_id: obj.customer as string,
              status: obj.status as string,
              current_period_end: obj.current_period_end
                ? new Date((obj.current_period_end as number) * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );
        break;
      }
      case "customer.subscription.deleted": {
        const subId = obj.id as string | undefined;
        if (!subId) break;
        await admin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subId);
        break;
      }
      case "invoice.payment_succeeded": {
        const subId = obj.subscription as string | undefined;
        if (!subId) break;
        const profesionistId = await resolveProfesionistId(stripe, admin, obj);
        if (!profesionistId) {
          reportError("billing", "stripe_webhook_profesionist_unresolved", "Missing profesionist_id mapping", {
            eventType: event.type,
            subId,
            customerId: obj.customer as string | undefined,
            eventId: event.id
          });
          break;
        }
        await admin
          .from("subscriptions")
          .upsert(
            {
              profesionist_id: profesionistId,
              stripe_subscription_id: subId,
              stripe_customer_id: obj.customer as string,
              status: "active",
              current_period_end: obj.period_end
                ? new Date((obj.period_end as number) * 1000).toISOString()
                : obj.lines
                  ? (() => {
                      const lines = (obj as Record<string, unknown>).lines as { data?: Array<{ period?: { end?: number } }> } | undefined;
                      const end = lines?.data?.[0]?.period?.end;
                      return end ? new Date(end * 1000).toISOString() : null;
                    })()
                  : null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_subscription_id" }
          );
        break;
      }
      case "invoice.payment_failed": {
        const subId = obj.subscription as string | undefined;
        if (!subId) break;
        let canceledInStripe = false;
        try {
          await stripe.subscriptions.cancel(subId, { prorate: false });
          canceledInStripe = true;
        } catch (error) {
          reportError("billing", "stripe_webhook_auto_cancel_failed", error, {
            eventType: event.type,
            subId,
            customerId: obj.customer as string | undefined,
            eventId: event.id
          });
        }

        await admin
          .from("subscriptions")
          .update({
            status: canceledInStripe ? "canceled" : "past_due",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subId);
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
