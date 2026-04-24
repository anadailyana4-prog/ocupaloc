import type { SupabaseClient } from "@supabase/supabase-js";

import { BILLING_TRIAL_DAYS, isBillingEnabled } from "@/lib/billing/config";

export type BookingEntitlementResult = {
  allowed: boolean;
  reason: string;
};

export async function checkBookingEntitlement(
  admin: SupabaseClient,
  profesionistId: string,
  profesionistCreatedAt: string
): Promise<BookingEntitlementResult> {
  if (!isBillingEnabled()) {
    return { allowed: true, reason: "" };
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, current_period_end, cancel_at_period_end")
    .eq("profesionist_id", profesionistId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub) {
    const { status, current_period_end } = sub;
    const periodEnd = current_period_end ? new Date(current_period_end) : null;
    const now = Date.now();

    if (status === "active" || status === "trialing") {
      if (!periodEnd || now <= periodEnd.getTime()) {
        return { allowed: true, reason: "" };
      }
    }

    if (status === "past_due") {
      if (periodEnd && now <= periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000) {
        return { allowed: true, reason: "grace_period" };
      }
      return { allowed: false, reason: "subscription_past_due" };
    }

    if (status === "incomplete") return { allowed: false, reason: "subscription_incomplete" };
    if (status === "paused") return { allowed: false, reason: "subscription_paused" };
    if (status === "canceled") return { allowed: false, reason: "subscription_canceled" };
    return { allowed: false, reason: "subscription_past_due" };
  }

  const createdAt = new Date(profesionistCreatedAt);
  if (Number.isNaN(createdAt.getTime())) return { allowed: true, reason: "" };
  const trialEnd = new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  if (Date.now() <= trialEnd.getTime()) {
    return { allowed: true, reason: "legacy_trial" };
  }
  return { allowed: false, reason: "no_active_subscription" };
}

