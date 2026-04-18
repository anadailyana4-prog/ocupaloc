import type { SupabaseClient } from "@supabase/supabase-js";

import { BILLING_TRIAL_DAYS, isBillingEnabled } from "@/lib/billing/config";

export type BookingEntitlementResult = {
  allowed: boolean;
  reason: string;
};

export async function checkBookingEntitlement(
  _admin: SupabaseClient,
  _profesionistId: string,
  profesionistCreatedAt: string
): Promise<BookingEntitlementResult> {
  // Billing checks are soft-gated until full webhook persistence is enabled.
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

  // Keep booking path available; Stripe enforces charging cadence after trial.
  return { allowed: true, reason: "" };
}
