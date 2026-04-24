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

  // 1. Verifică dacă există un abonament activ sau în trial din tabelul subscriptions.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, trial_end, current_period_end, cancel_at_period_end")
    .eq("profesionist_id", profesionistId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub) {
    const now = Date.now();

    if (sub.status === "active" || sub.status === "trialing") {
      // Verifică că perioada curentă nu a expirat (safety check).
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : Infinity;
      if (now <= periodEnd) {
        return { allowed: true, reason: "" };
      }
    }

    if (sub.status === "past_due") {
      // Permite acces în grace period de 7 zile după ultima scadentă.
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : 0;
      const graceMs = 7 * 24 * 60 * 60 * 1000;
      if (now <= periodEnd + graceMs) {
        return { allowed: true, reason: "grace_period" };
      }
      return { allowed: false, reason: "subscription_past_due" };
    }

    if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "incomplete_expired") {
      return { allowed: false, reason: `subscription_${sub.status}` };
    }

    if (sub.status === "incomplete" || sub.status === "paused") {
      return { allowed: false, reason: `subscription_${sub.status}` };
    }
  }

  // 2. Fallback: trial bazat pe data creării contului (pentru conturi înainte de billing persistence).
  const createdAt = new Date(profesionistCreatedAt);
  if (!Number.isNaN(createdAt.getTime())) {
    const trialEnd = new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000);
    if (Date.now() <= trialEnd.getTime()) {
      return { allowed: true, reason: "legacy_trial" };
    }
  }

  return { allowed: false, reason: "no_active_subscription" };
}

