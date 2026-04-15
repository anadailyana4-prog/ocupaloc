"use server";

import { createClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function bootstrapTenantAfterSignup(input: { orgName: string; slug: string }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { ok: false as const, error: "Nu ești autentificat." };
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return { ok: false as const, error: "Lipsește SUPABASE_SERVICE_ROLE_KEY pe server." };
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: existing } = await admin.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();
  if (!existing?.id) {
    const { error: insErr } = await admin.from("profesionisti").insert({
      user_id: user.id,
      nume_business: input.orgName,
      tip_activitate: "frizerie",
      slug: input.slug,
      onboarding_pas: 1
    });
    if (insErr) {
      return { ok: false as const, error: insErr.message };
    }
  }

  return { ok: true as const };
}
