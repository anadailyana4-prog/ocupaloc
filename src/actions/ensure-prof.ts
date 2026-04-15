"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ensureProfesionistRow() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: existing } = await supabase.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();
  if (existing) return { ok: true as const, id: existing.id };

  const base = `studio-${user.id.slice(0, 8)}`;
  const { error } = await supabase.from("profesionisti").insert({
    user_id: user.id,
    nume_business: "Studio nou",
    tip_activitate: "",
    slug: base
  });
  if (error) {
    return { ok: false as const, message: error.message };
  }
  return { ok: true as const };
}
