import type { SupabaseClient } from "@supabase/supabase-js";

import { BILLING_TRIAL_DAYS, isBillingEnabled } from "@/lib/billing/config";
import { normalizeRoPhone } from "@/lib/phone";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type CommercialPlanStatus =
  | { kind: "trial"; daysLeft: number }
  | { kind: "active"; periodEnd: string }
  | { kind: "past_due" }
  | { kind: "canceled" }
  | { kind: "trialing_stripe"; daysLeft: number }
  | { kind: "none" };

export type TrialEligibilityResult = {
  eligible: boolean;
  reason: string;
  fingerprint: {
    hasConflict: boolean;
    normalizedPhonePresent: boolean;
    normalizedBusinessNamePresent: boolean;
  };
};

export type BookingEntitlementResult = {
  allowed: boolean;
  reason: string;
};

function normalizeBusinessName(value: string | null | undefined): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function computeLegacyTrialStatus(profesionistCreatedAt: string | null | undefined): CommercialPlanStatus {
  if (!profesionistCreatedAt) {
    return { kind: "none" };
  }

  const createdAt = new Date(profesionistCreatedAt).getTime();
  const trialEnd = createdAt + BILLING_TRIAL_DAYS * 86400000;
  const daysLeft = Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000));

  if (daysLeft > 0) {
    return { kind: "trial", daysLeft };
  }

  return { kind: "none" };
}

export async function getPlanStatus(
  profesionistId: string,
  options?: {
    admin?: SupabaseClient;
    profesionistCreatedAt?: string | null;
  }
): Promise<CommercialPlanStatus> {
  if (!isBillingEnabled()) {
    return computeLegacyTrialStatus(options?.profesionistCreatedAt ?? null);
  }

  const admin = options?.admin ?? createSupabaseServiceClient();
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("profesionist_id", profesionistId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if ((error?.code ?? "") === "PGRST205") {
    return computeLegacyTrialStatus(options?.profesionistCreatedAt ?? null);
  }

  if (error || !sub) {
    return { kind: "none" };
  }

  const now = Date.now();
  if (sub.status === "trialing") {
    const end = sub.current_period_end ? new Date(sub.current_period_end).getTime() : now;
    return { kind: "trialing_stripe", daysLeft: Math.max(0, Math.ceil((end - now) / 86400000)) };
  }

  if (sub.status === "active" || sub.status === "reactivated") {
    return { kind: "active", periodEnd: sub.current_period_end ?? new Date().toISOString() };
  }

  if (sub.status === "past_due") {
    return { kind: "past_due" };
  }

  if (sub.status === "canceled") {
    return { kind: "canceled" };
  }

  return { kind: "none" };
}

export async function isTrialEligible(
  profesionistId: string,
  options?: {
    admin?: SupabaseClient;
    businessName?: string | null;
    phone?: string | null;
  }
): Promise<TrialEligibilityResult> {
  const admin = options?.admin ?? createSupabaseServiceClient();

  const { count: historicalSubscriptions, error: historicalSubscriptionsError } = await admin
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("profesionist_id", profesionistId);

  if (historicalSubscriptionsError) {
    return {
      eligible: false,
      reason: "history_query_failed_fail_closed",
      fingerprint: {
        hasConflict: false,
        normalizedPhonePresent: false,
        normalizedBusinessNamePresent: false
      }
    };
  }

  let sourcePhone = options?.phone ?? null;
  let sourceBusinessName = options?.businessName ?? null;

  if (sourcePhone == null || sourceBusinessName == null) {
    const { data: prof, error: profError } = await admin
      .from("profesionisti")
      .select("telefon,nume_business")
      .eq("id", profesionistId)
      .maybeSingle();

    if (profError) {
      return {
        eligible: false,
        reason: "fingerprint_source_profile_query_failed_fail_closed",
        fingerprint: {
          hasConflict: false,
          normalizedPhonePresent: false,
          normalizedBusinessNamePresent: false
        }
      };
    }

    sourcePhone = sourcePhone ?? prof?.telefon ?? null;
    sourceBusinessName = sourceBusinessName ?? prof?.nume_business ?? null;
  }

  const normalizedPhone = normalizeRoPhone(String(sourcePhone ?? ""));
  const normalizedBusinessName = normalizeBusinessName(sourceBusinessName);
  const normalizedPhonePresent = Boolean(normalizedPhone);
  const normalizedBusinessNamePresent = Boolean(normalizedBusinessName);

  if (normalizedPhonePresent || normalizedBusinessNamePresent) {
    const { data: potentialDuplicates, error: fingerprintError } = await admin
      .from("profesionisti")
      .select("id,telefon,nume_business")
      .neq("id", profesionistId);

    if (fingerprintError) {
      return {
        eligible: false,
        reason: "fingerprint_query_failed_fail_closed",
        fingerprint: {
          hasConflict: true,
          normalizedPhonePresent,
          normalizedBusinessNamePresent
        }
      };
    }

    for (const candidate of potentialDuplicates ?? []) {
      const candidatePhone = normalizeRoPhone(String(candidate.telefon ?? ""));
      const candidateBusinessName = normalizeBusinessName(candidate.nume_business);

      const phoneMatch = normalizedPhonePresent && normalizedPhone === candidatePhone;
      const businessNameMatch =
        normalizedBusinessNamePresent && normalizedBusinessName === candidateBusinessName;

      if (phoneMatch || businessNameMatch) {
        return {
          eligible: false,
          reason:
            phoneMatch && businessNameMatch
              ? "business_identity_duplicate_phone_and_name"
              : phoneMatch
                ? "business_identity_duplicate_phone"
                : "business_identity_duplicate_business_name",
          fingerprint: {
            hasConflict: true,
            normalizedPhonePresent,
            normalizedBusinessNamePresent
          }
        };
      }
    }
  }

  const hasHistory = (historicalSubscriptions ?? 0) > 0;
  return {
    eligible: !hasHistory,
    reason: hasHistory
      ? `has_${historicalSubscriptions}_prior_subscriptions`
      : "no_prior_subscriptions",
    fingerprint: {
      hasConflict: false,
      normalizedPhonePresent,
      normalizedBusinessNamePresent
    }
  };
}

export async function canAcceptBookings(
  profesionistId: string,
  options?: {
    admin?: SupabaseClient;
    profesionistCreatedAt?: string | null;
  }
): Promise<BookingEntitlementResult> {
  if (!isBillingEnabled()) {
    return { allowed: true, reason: "" };
  }

  const admin = options?.admin ?? createSupabaseServiceClient();
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("profesionist_id", profesionistId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if ((error?.code ?? "") === "PGRST205") {
    const status = computeLegacyTrialStatus(options?.profesionistCreatedAt ?? null);
    return status.kind === "trial" || status.kind === "active"
      ? { allowed: true, reason: "legacy_trial" }
      : { allowed: false, reason: "no_active_subscription" };
  }

  if (error) {
    return { allowed: false, reason: "billing_error" };
  }

  if (!sub) {
    const status = computeLegacyTrialStatus(options?.profesionistCreatedAt ?? null);
    return status.kind === "trial" || status.kind === "active"
      ? { allowed: true, reason: "legacy_trial" }
      : { allowed: false, reason: "no_active_subscription" };
  }

  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
  const now = Date.now();

  if (sub.status === "active" || sub.status === "trialing" || sub.status === "reactivated") {
    if (!periodEnd || now <= periodEnd) {
      return { allowed: true, reason: "" };
    }
  }

  if (sub.status === "past_due") {
    if (periodEnd && now <= periodEnd + 7 * 24 * 60 * 60 * 1000) {
      return { allowed: true, reason: "grace_period" };
    }
    return { allowed: false, reason: "subscription_past_due" };
  }

  if (sub.status === "incomplete") return { allowed: false, reason: "subscription_incomplete" };
  if (sub.status === "paused") return { allowed: false, reason: "subscription_paused" };
  if (sub.status === "canceled") return { allowed: false, reason: "subscription_canceled" };

  return { allowed: false, reason: "subscription_past_due" };
}