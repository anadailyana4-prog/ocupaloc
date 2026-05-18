"use server";

import { bootstrapTenantAfterSignup } from "@/app/(auth)/signup/actions";
import { markOnboardingCompletedIfReady } from "@/lib/professional-milestones";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DraftService = {
  nume: string;
  pret: string;
  durata: string;
};

type DraftWorkDay = {
  key: "luni" | "marti" | "miercuri" | "joi" | "vineri" | "sambata" | "duminica";
  active: boolean;
  start: string;
  end: string;
};

export type SignupDraftPayload = {
  orgName?: string;
  slug?: string;
  activity?: string;
  phone?: string;
  services?: DraftService[];
  workDays?: DraftWorkDay[];
};

export type ApplySignupDraftResult =
  | { ok: true; applied: boolean; reason?: string }
  | { ok: false; error: string };

/**
 * Applies signup wizard data saved in the browser after the user confirms email and logs in.
 * Best-effort and idempotent — never blocks dashboard/onboarding.
 */
export async function applySignupDraft(draft: SignupDraftPayload): Promise<ApplySignupDraftResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Nu ești autentificat." };
  }

  const orgName = draft.orgName?.trim();
  if (!orgName) {
    return { ok: true, applied: false, reason: "missing_org_name" };
  }

  const admin = createSupabaseServiceClient();
  const { data: existing } = await admin
    .from("profesionisti")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.id) {
    const { count } = await admin
      .from("servicii")
      .select("id", { count: "exact", head: true })
      .eq("profesionist_id", existing.id);

    const hasServices = (count ?? 0) > 0;
    const hasDraftServices = (draft.services ?? []).some((s) => s.nume.trim());

    if (hasServices && !hasDraftServices) {
      await markOnboardingCompletedIfReady(admin, existing.id);
      return { ok: true, applied: false, reason: "profile_already_has_services" };
    }
  }

  const result = await bootstrapTenantAfterSignup({
    userId: user.id,
    orgName,
    slug: draft.slug?.trim() || orgName,
    activity: draft.activity,
    phone: draft.phone,
    services: draft.services,
    workDays: draft.workDays
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const { data: prof } = await admin.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();
  if (prof?.id) {
    await markOnboardingCompletedIfReady(admin, prof.id);
  }

  return { ok: true, applied: true };
}
