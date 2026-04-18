import type { SupabaseClient } from "@supabase/supabase-js";

export const ELIGIBLE_BOOKING_STATUSES = ["active", "trialing"] as const;

export type BillingSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type BillingSubscriptionSnapshot = {
  profesionistId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: BillingSubscriptionStatus;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  eventCreated: string;
};

function toStatus(value: string | null | undefined): BillingSubscriptionStatus {
  switch (value) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return value;
    default:
      return "incomplete";
  }
}

export function normalizeBillingStatus(value: string | null | undefined): BillingSubscriptionStatus {
  return toStatus(value);
}

export function isBookingStatusEligible(status: BillingSubscriptionStatus): boolean {
  return ELIGIBLE_BOOKING_STATUSES.includes(status as (typeof ELIGIBLE_BOOKING_STATUSES)[number]);
}

export async function saveBillingSubscriptionSnapshot(
  admin: SupabaseClient,
  snapshot: BillingSubscriptionSnapshot
): Promise<void> {
  const baseUpdate = {
    stripe_customer_id: snapshot.stripeCustomerId,
    stripe_subscription_id: snapshot.stripeSubscriptionId,
    status: snapshot.status,
    current_period_end: snapshot.currentPeriodEnd,
    trial_end: snapshot.trialEnd,
    cancel_at_period_end: snapshot.cancelAtPeriodEnd,
    canceled_at: snapshot.canceledAt,
    last_event_created: snapshot.eventCreated
  };

  if (snapshot.profesionistId) {
    const { error } = await admin.from("billing_subscriptions").upsert(
      {
        profesionist_id: snapshot.profesionistId,
        ...baseUpdate
      },
      { onConflict: "profesionist_id" }
    );

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  if (!snapshot.stripeSubscriptionId && !snapshot.stripeCustomerId) {
    return;
  }

  let query = admin.from("billing_subscriptions").update(baseUpdate);

  if (snapshot.stripeSubscriptionId) {
    query = query.eq("stripe_subscription_id", snapshot.stripeSubscriptionId);
  } else if (snapshot.stripeCustomerId) {
    query = query.eq("stripe_customer_id", snapshot.stripeCustomerId);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}
