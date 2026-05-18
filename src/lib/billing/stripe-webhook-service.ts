import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findWebhookEventByStripeId,
  insertPendingWebhookEvent,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  resetWebhookEventToPending,
  type WebhookEventRecord
} from "@/lib/billing/webhook-events-repository";
import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { reportError } from "@/lib/observability";
import { recordOperationalEvent } from "@/lib/ops-events";

type ProcessResult = {
  replayed: boolean;
};

type StripeWebhookServiceDeps = {
  processBusinessEvent: typeof processBusinessEvent;
  recordOperationalEvent: typeof recordOperationalEvent;
};

const defaultDeps: StripeWebhookServiceDeps = {
  processBusinessEvent,
  recordOperationalEvent
};

function readNumber(object: Record<string, unknown>, key: string): number | null {
  const value = object[key];
  return typeof value === "number" ? value : null;
}

function toIsoOrNull(epochSeconds: number | null | undefined): string | null {
  if (!epochSeconds) {
    return null;
  }

  return new Date(epochSeconds * 1000).toISOString();
}

async function resolveProfesionistId(
  stripe: Stripe,
  admin: SupabaseClient,
  object: Stripe.Event.Data.Object
): Promise<string | null> {
  const metadata = (object as { metadata?: Record<string, string | undefined> }).metadata;
  if (metadata?.profesionist_id) {
    return metadata.profesionist_id;
  }

  const subscriptionId = (object as { subscription?: string | Stripe.Subscription | null; id?: string }).subscription;
  const normalizedSubId = typeof subscriptionId === "string"
    ? subscriptionId
    : typeof (object as { id?: string }).id === "string" && (object as { id?: string }).id?.startsWith("sub_")
      ? (object as { id: string }).id
      : null;

  if (normalizedSubId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(normalizedSubId);
      if (stripeSub.metadata?.profesionist_id) {
        return stripeSub.metadata.profesionist_id;
      }
    } catch {
      // Ignore lookup failure and continue with local fallback.
    }
  }

  const customer = (object as { customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null }).customer;
  const customerId = typeof customer === "string" ? customer : customer?.id;

  if (!customerId) {
    return null;
  }

  const { data, error } = await admin
    .from("subscriptions")
    .select("profesionist_id")
    .eq("stripe_customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`resolve profesionist by customer failed: ${error.message}`);
  }

  return data?.profesionist_id ?? null;
}

async function upsertSubscriptionFromEvent(
  admin: SupabaseClient,
  input: {
    profesionistId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status: string;
    currentPeriodStart?: number | null;
    currentPeriodEnd?: number | null;
    cancelAtPeriodEnd?: boolean;
  }
): Promise<void> {
  let nextStatus = input.status;
  if (nextStatus === "active" || nextStatus === "trialing") {
    const { data: previousSub } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id,status")
      .eq("profesionist_id", input.profesionistId)
      .neq("stripe_subscription_id", input.stripeSubscriptionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousSub?.status === "canceled") {
      nextStatus = "reactivated";
    }
  }

  const { error } = await admin.from("subscriptions").upsert(
    {
      profesionist_id: input.profesionistId,
      stripe_subscription_id: input.stripeSubscriptionId,
      stripe_customer_id: input.stripeCustomerId,
      status: nextStatus,
      current_period_start: toIsoOrNull(input.currentPeriodStart),
      current_period_end: toIsoOrNull(input.currentPeriodEnd),
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      updated_at: new Date().toISOString()
    },
    { onConflict: "stripe_subscription_id" }
  );

  if (error) {
    throw new Error(`subscriptions upsert failed: ${error.message}`);
  }

  if (nextStatus === "active" || nextStatus === "reactivated") {
    await recordOperationalEvent({
      eventType: BILLING_EVENT_TYPES.SUBSCRIPTION_ACTIVATED,
      flow: "billing",
      outcome: "success",
      entityId: input.profesionistId,
      metadata: {
        profesionistId: input.profesionistId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        status: nextStatus
      }
    });
  }
}

async function processBusinessEvent(stripe: Stripe, admin: SupabaseClient, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const object = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
      if (!subscriptionId) {
        return;
      }

      const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
      if (!customerId) {
        return;
      }

      const profesionistId = await resolveProfesionistId(stripe, admin, object);
      if (!profesionistId) {
        throw new Error(`Unable to resolve profesionist_id for event ${event.id}`);
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subRecord = stripeSubscription as unknown as Record<string, unknown>;
      await upsertSubscriptionFromEvent(admin, {
        profesionistId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        status: stripeSubscription.status,
        currentPeriodStart: readNumber(subRecord, "current_period_start"),
        currentPeriodEnd: readNumber(subRecord, "current_period_end"),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      });
      return;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const object = event.data.object as Stripe.Invoice;
      const subRecord = object as unknown as {
        subscription?: string | { id?: string | null } | null;
        parent?: { subscription_details?: { subscription?: string | null } | null } | null;
      };
      const subscriptionId =
        typeof subRecord.subscription === "string"
          ? subRecord.subscription
          : subRecord.subscription?.id ?? subRecord.parent?.subscription_details?.subscription ?? null;
      if (!subscriptionId) {
        return;
      }

      const customerId = typeof object.customer === "string" ? object.customer : object.customer?.id;
      if (!customerId) {
        return;
      }

      const profesionistId = await resolveProfesionistId(stripe, admin, object);
      if (!profesionistId) {
        throw new Error(`Unable to resolve profesionist_id for event ${event.id}`);
      }

      const periodEnd = object.lines.data[0]?.period?.end ?? null;
      await upsertSubscriptionFromEvent(admin, {
        profesionistId,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        status: "active",
        currentPeriodEnd: periodEnd
      });
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const object = event.data.object as Stripe.Subscription;
      const customerId = typeof object.customer === "string" ? object.customer : object.customer.id;
      const profesionistId = await resolveProfesionistId(stripe, admin, object);
      if (!profesionistId) {
        throw new Error(`Unable to resolve profesionist_id for event ${event.id}`);
      }

      await upsertSubscriptionFromEvent(admin, {
        profesionistId,
        stripeSubscriptionId: object.id,
        stripeCustomerId: customerId,
        status: object.status,
        currentPeriodStart: readNumber(object as unknown as Record<string, unknown>, "current_period_start"),
        currentPeriodEnd: readNumber(object as unknown as Record<string, unknown>, "current_period_end"),
        cancelAtPeriodEnd: object.cancel_at_period_end
      });
      return;
    }
    default:
      return;
  }
}

async function getOrCreateWebhookRecord(admin: SupabaseClient, event: Stripe.Event): Promise<WebhookEventRecord> {
  const existing = await findWebhookEventByStripeId(admin, event.id);
  if (!existing) {
    return insertPendingWebhookEvent(admin, {
      stripeEventId: event.id,
      eventType: event.type,
      payload: event as unknown as Record<string, unknown>
    });
  }

  if (existing.status === "failed") {
    await resetWebhookEventToPending(admin, existing.id);
    return {
      ...existing,
      status: "pending",
      error_message: null,
      processed_at: null
    };
  }

  return existing;
}

export async function processStripeWebhookEvent(
  stripe: Stripe,
  admin: SupabaseClient,
  event: Stripe.Event,
  deps: StripeWebhookServiceDeps = defaultDeps
): Promise<ProcessResult> {
  const startedAt = Date.now();

  const record = await getOrCreateWebhookRecord(admin, event);

  if (record.status === "processed") {
    await deps.recordOperationalEvent({
      eventType: "webhook.replayed",
      flow: "billing",
      outcome: "success",
      latencyMs: Date.now() - startedAt,
      metadata: { stripeEventId: event.id, eventType: event.type }
    });
    return { replayed: true };
  }

  await deps.recordOperationalEvent({
    eventType: "webhook.received",
    flow: "billing",
    outcome: "success",
    latencyMs: Date.now() - startedAt,
    metadata: { stripeEventId: event.id, eventType: event.type }
  });

  try {
    await deps.processBusinessEvent(stripe, admin, event);
    await markWebhookEventProcessed(admin, record.id);

    await deps.recordOperationalEvent({
      eventType: "webhook.processed",
      flow: "billing",
      outcome: "success",
      latencyMs: Date.now() - startedAt,
      metadata: { stripeEventId: event.id, eventType: event.type }
    });

    return { replayed: false };
  } catch (error) {
    await markWebhookEventFailed(admin, record.id, error instanceof Error ? error.message : String(error));
    reportError("billing", "stripe_webhook_processing_failed", error, {
      stripeEventId: event.id,
      eventType: event.type
    });

    await deps.recordOperationalEvent({
      eventType: "webhook.failed",
      flow: "billing",
      outcome: "failure",
      latencyMs: Date.now() - startedAt,
      metadata: {
        stripeEventId: event.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : String(error)
      }
    });

    throw error;
  }
}
