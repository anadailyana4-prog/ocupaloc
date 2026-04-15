"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  nume_business: z.string().trim().min(2, "Numele salonului e prea scurt.").max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Slug: doar litere mici, cifre și cratimă."),
  telefon: z.string().trim().min(8, "Introdu un telefon valid.").max(40),
  tip_activitate: z.enum(["frizerie"])
});

export async function submitProfesionistiOnboarding(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    redirect("/login");
  }

  const parsed = schema.safeParse({
    nume_business: String(formData.get("nume_business") ?? ""),
    slug: String(formData.get("slug") ?? "").toLowerCase(),
    telefon: String(formData.get("telefon") ?? ""),
    tip_activitate: (String(formData.get("tip_activitate") ?? "frizerie") as "frizerie")
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Date invalide.";
    redirect("/onboarding?error=" + encodeURIComponent(msg));
  }

  const { data: taken } = await supabase.from("profesionisti").select("user_id").eq("slug", parsed.data.slug).maybeSingle();
  if (taken && taken.user_id !== user.id) {
    redirect("/onboarding?error=" + encodeURIComponent("Slug-ul e deja folosit."));
  }

  const { data: existing } = await supabase.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("profesionisti")
      .update({
        nume_business: parsed.data.nume_business,
        slug: parsed.data.slug,
        telefon: parsed.data.telefon,
        tip_activitate: parsed.data.tip_activitate,
        onboarding_pas: 4
      })
      .eq("user_id", user.id);
    if (error) {
      redirect("/onboarding?error=" + encodeURIComponent(error.message));
    }
  } else {
    const { error } = await supabase.from("profesionisti").insert({
      user_id: user.id,
      nume_business: parsed.data.nume_business,
      slug: parsed.data.slug,
      telefon: parsed.data.telefon,
      tip_activitate: parsed.data.tip_activitate,
      onboarding_pas: 4
    });
    if (error) {
      redirect("/onboarding?error=" + encodeURIComponent(error.message));
    }
  }

  redirect("/dashboard");
}
