import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfesionistMilestoneRow = {
  id: string;
  nume_business?: string | null;
  telefon?: string | null;
  tip_activitate?: string | null;
  onboarding_pas?: number | null;
  onboarding_completed_at?: string | null;
  first_booking_at?: string | null;
};

export function isOnboardingProfileComplete(
  profile: Pick<ProfesionistMilestoneRow, "nume_business" | "telefon" | "tip_activitate" | "onboarding_pas">,
  telefonRequired = true
): boolean {
  return Boolean(
    profile.nume_business?.trim() &&
      profile.tip_activitate?.trim() &&
      (!telefonRequired || profile.telefon?.trim()) &&
      (profile.onboarding_pas ?? 0) >= 4
  );
}

export function hasOnboardingCompleted(profile: Pick<ProfesionistMilestoneRow, "onboarding_completed_at" | "onboarding_pas">): boolean {
  if (profile.onboarding_completed_at) return true;
  return (profile.onboarding_pas ?? 0) >= 4;
}

/** Fields to merge when marking onboarding complete (idempotent). */
export function onboardingCompletionPatch(now = new Date().toISOString()): {
  onboarding_pas: number;
  onboarding_completed_at: string;
} {
  return {
    onboarding_pas: 4,
    onboarding_completed_at: now
  };
}

/**
 * Set onboarding_completed_at once when profile criteria are met.
 * Safe to call on every onboarding save.
 */
export async function markOnboardingCompletedIfReady(
  admin: SupabaseClient,
  profesionistId: string,
  telefonRequired = true
): Promise<void> {
  const { data: profile, error } = await admin
    .from("profesionisti")
    .select("id, nume_business, telefon, tip_activitate, onboarding_pas, onboarding_completed_at")
    .eq("id", profesionistId)
    .maybeSingle();

  if (error || !profile?.id || profile.onboarding_completed_at) {
    return;
  }

  if (!isOnboardingProfileComplete(profile, telefonRequired)) {
    return;
  }

  const patch = onboardingCompletionPatch();
  await admin
    .from("profesionisti")
    .update({
      onboarding_pas: patch.onboarding_pas,
      onboarding_completed_at: patch.onboarding_completed_at,
      last_activity_at: patch.onboarding_completed_at
    })
    .eq("id", profesionistId)
    .is("onboarding_completed_at", null);
}

/**
 * Record first public booking milestone (idempotent).
 */
export async function markFirstBookingIfNeeded(admin: SupabaseClient, profesionistId: string): Promise<void> {
  const now = new Date().toISOString();
  await admin
    .from("profesionisti")
    .update({
      first_booking_at: now,
      last_activity_at: now
    })
    .eq("id", profesionistId)
    .is("first_booking_at", null);
}

/** Resolve profesionist id from public slug. */
export async function getProfesionistIdBySlug(admin: SupabaseClient, slug: string): Promise<string | null> {
  const { data } = await admin.from("profesionisti").select("id").eq("slug", slug.trim()).maybeSingle();
  return data?.id ?? null;
}
