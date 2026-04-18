import type { SupabaseClient } from "@supabase/supabase-js";

import { BILLING_TRIAL_DAYS, isBillingEnabled } from "@/lib/billing/config";
import { isBookingStatusEligible, normalizeBillingStatus } from "@/lib/billing/subscriptions";

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

  const createdAt = new Date(profesionistCreatedAt);
  if (Number.isNaN(createdAt.getTime())) {
    return { allowed: true, reason: "" };
  }

  const trialEnd = new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  if (Date.now() <= trialEnd.getTime()) {
    return { allowed: true, reason: "" };
  }

  const { data, error } = await admin
    .from("billing_subscriptions")
    .select("status,trial_end")
    .eq("profesionist_id", profesionistId)
    .maybeSingle();

  if (error) {
    return { allowed: false, reason: "Abonamentul nu este activ." };
  }

  // A future trial_end from Stripe snapshot extends access even after local signup trial window.
  const subscriptionTrialEnd = data?.trial_end ? new Date(data.trial_end) : null;
  if (subscriptionTrialEnd && !Number.isNaN(subscriptionTrialEnd.getTime()) && Date.now() <= subscriptionTrialEnd.getTime()) {
    return { allowed: true, reason: "" };
  }

  const status = normalizeBillingStatus(data?.status);
  if (isBookingStatusEligible(status)) {
    return { allowed: true, reason: "" };
  }

  return { allowed: false, reason: "Abonamentul nu este activ." };
}
