import type Stripe from "stripe";

import { getStripeClient } from "@/lib/billing/stripe";
import { BILLING_EVENT_TYPES } from "@/lib/ops-event-taxonomy";
import { reportError } from "@/lib/observability";
import { recordOperationalEvent } from "@/lib/ops-events";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type BillingReconciliationResult = {
  checkedDb: number;
  checkedStripe: number;
  fixed: number;
  failed: number;
};

function readNumber(object: Record<string, unknown>, key: string): number | null {
  const value = object[key];
  return typeof value === "number" ? value : null;
}

async function reconcileDbSubscription(
  stripe: Stripe,
  dbSub: {
    profesionist_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  }
): Promise<{ fixed: boolean; failed: boolean }> {
  const admin = createSupabaseServiceClient();

  try {
    const stripeSub = await stripe.subscriptions.retrieve(dbSub.stripe_subscription_id);
    const stripeRecord = stripeSub as unknown as Record<string, unknown>;

    const nextStatus = String(stripeRecord.status ?? "incomplete");
    const nextPeriodEnd = readNumber(stripeRecord, "current_period_end")
      ? new Date(readNumber(stripeRecord, "current_period_end")! * 1000).toISOString()
      : null;
    const nextPeriodStart = readNumber(stripeRecord, "current_period_start")
      ? new Date(readNumber(stripeRecord, "current_period_start")! * 1000).toISOString()
      : null;
    const nextCancelAtPeriodEnd = Boolean(stripeRecord.cancel_at_period_end);

    const driftDetected =
      dbSub.status !== nextStatus ||
      dbSub.current_period_end !== nextPeriodEnd ||
      dbSub.current_period_start !== nextPeriodStart ||
      dbSub.cancel_at_period_end !== nextCancelAtPeriodEnd;

    if (!driftDetected) {
      return { fixed: false, failed: false };
    }

    await recordOperationalEvent({
      eventType: BILLING_EVENT_TYPES.RECONCILIATION_MISMATCH,
      flow: "billing",
      outcome: "failure",
      entityId: dbSub.profesionist_id,
      metadata: {
        source: "db_vs_stripe_existing_subscription",
        stripeSubscriptionId: dbSub.stripe_subscription_id,
        profesionistId: dbSub.profesionist_id,
        dbStatus: dbSub.status,
        stripeStatus: nextStatus,
        dbCurrentPeriodStart: dbSub.current_period_start,
        stripeCurrentPeriodStart: nextPeriodStart,
        dbCurrentPeriodEnd: dbSub.current_period_end,
        stripeCurrentPeriodEnd: nextPeriodEnd,
        dbCancelAtPeriodEnd: dbSub.cancel_at_period_end,
        stripeCancelAtPeriodEnd: nextCancelAtPeriodEnd
      }
    });

    const { error } = await admin
      .from("subscriptions")
      .update({
        status: nextStatus,
        current_period_start: nextPeriodStart,
        current_period_end: nextPeriodEnd,
        cancel_at_period_end: nextCancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq("stripe_subscription_id", dbSub.stripe_subscription_id);

    if (error) {
      throw new Error(error.message);
    }

    return { fixed: true, failed: false };
  } catch (error) {
    reportError("billing", "billing_reconciliation_item_failed", error, {
      stripeSubscriptionId: dbSub.stripe_subscription_id,
      profesionistId: dbSub.profesionist_id
    });

    return { fixed: false, failed: true };
  }
}

export async function runBillingReconciliation(): Promise<BillingReconciliationResult> {
  const startedAt = Date.now();
  const stripe = getStripeClient();
  const admin = createSupabaseServiceClient();

  await recordOperationalEvent({
    eventType: BILLING_EVENT_TYPES.RECONCILIATION_STARTED,
    flow: "billing",
    outcome: "success",
    metadata: {}
  });

  const { data: dbSubs, error } = await admin
    .from("subscriptions")
    .select("profesionist_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, cancel_at_period_end");

  if (error) {
    throw new Error(`subscriptions fetch failed: ${error.message}`);
  }

  const result: BillingReconciliationResult = {
    checkedDb: dbSubs?.length ?? 0,
    checkedStripe: 0,
    fixed: 0,
    failed: 0
  };

  for (const dbSub of dbSubs ?? []) {
    const item = await reconcileDbSubscription(stripe, dbSub);
    if (item.fixed) {
      result.fixed += 1;
      await recordOperationalEvent({
        eventType: BILLING_EVENT_TYPES.RECONCILIATION_FIXED,
        flow: "billing",
        outcome: "success",
        metadata: {
          stripeSubscriptionId: dbSub.stripe_subscription_id,
          profesionistId: dbSub.profesionist_id
        }
      });
    }
    if (item.failed) {
      result.failed += 1;
      await recordOperationalEvent({
        eventType: BILLING_EVENT_TYPES.RECONCILIATION_FAILED,
        flow: "billing",
        outcome: "failure",
        metadata: {
          stripeSubscriptionId: dbSub.stripe_subscription_id,
          profesionistId: dbSub.profesionist_id
        }
      });
    }
  }

  const stripeSubs = await stripe.subscriptions.list({ status: "all", limit: 100 });
  result.checkedStripe = stripeSubs.data.length;

  for (const stripeSub of stripeSubs.data) {
    const stripeRecord = stripeSub as unknown as Record<string, unknown>;
    const exists = (dbSubs ?? []).some((dbSub) => dbSub.stripe_subscription_id === stripeSub.id);
    if (exists) {
      continue;
    }

    const profesionistId = stripeSub.metadata?.profesionist_id;
    const customerId = typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id;

    if (!profesionistId || !customerId) {
      continue;
    }

    await recordOperationalEvent({
      eventType: BILLING_EVENT_TYPES.RECONCILIATION_MISMATCH,
      flow: "billing",
      outcome: "failure",
      entityId: profesionistId,
      metadata: {
        source: "stripe_subscription_missing_in_db",
        stripeSubscriptionId: stripeSub.id,
        profesionistId
      }
    });

    const { error: upsertError } = await admin.from("subscriptions").upsert(
      {
        profesionist_id: profesionistId,
        stripe_subscription_id: stripeSub.id,
        stripe_customer_id: customerId,
        status: stripeSub.status,
        current_period_start: readNumber(stripeRecord, "current_period_start")
          ? new Date(readNumber(stripeRecord, "current_period_start")! * 1000).toISOString()
          : null,
        current_period_end: readNumber(stripeRecord, "current_period_end")
          ? new Date(readNumber(stripeRecord, "current_period_end")! * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        updated_at: new Date().toISOString()
      },
      { onConflict: "stripe_subscription_id" }
    );

    if (upsertError) {
      result.failed += 1;
      await recordOperationalEvent({
        eventType: BILLING_EVENT_TYPES.RECONCILIATION_FAILED,
        flow: "billing",
        outcome: "failure",
        metadata: { stripeSubscriptionId: stripeSub.id, reason: upsertError.message }
      });
      continue;
    }

    result.fixed += 1;
    await recordOperationalEvent({
      eventType: BILLING_EVENT_TYPES.RECONCILIATION_FIXED,
      flow: "billing",
      outcome: "success",
      metadata: { stripeSubscriptionId: stripeSub.id, profesionistId }
    });
  }

  await recordOperationalEvent({
    eventType: BILLING_EVENT_TYPES.RECONCILIATION_SUMMARY,
    flow: "billing",
    outcome: result.failed > 0 ? "failure" : "success",
    latencyMs: Date.now() - startedAt,
    metadata: result
  });

  return result;
}
