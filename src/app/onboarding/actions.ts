"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { slugifyBusinessName, uniqueSlug } from "@/lib/slug";
import { writeWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  nume_business: z.string().trim().min(2, "Numele business-ului este obligatoriu."),
  telefon: z.string().trim().min(8, "Telefon invalid."),
  tip_activitate: z.string().trim().min(2, "Tipul activității este obligatoriu.")
});

export async function saveOnboardingProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = schema.safeParse({
    nume_business: String(formData.get("nume_business") ?? ""),
    telefon: String(formData.get("telefon") ?? ""),
    tip_activitate: String(formData.get("tip_activitate") ?? "")
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Date invalide.";
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`);
  }

  const { data: existingProf } = await supabase.from("profesionisti").select("id, slug").eq("user_id", user.id).maybeSingle();

  let errorMessage: string | null = null;
  if (existingProf?.id) {
    const result = await writeWithTelefonFallback(
      async (values) => await supabase.from("profesionisti").update(values).eq("id", existingProf.id),
      {
        nume_business: parsed.data.nume_business,
        telefon: parsed.data.telefon,
        tip_activitate: parsed.data.tip_activitate,
        onboarding_pas: 4
      }
    );
    errorMessage = result.error?.message ?? null;
  } else {
    const base = slugifyBusinessName(parsed.data.nume_business);
    const slug = await uniqueSlug(base, async (candidate) => {
      const { data } = await supabase.from("profesionisti").select("id").eq("slug", candidate).maybeSingle();
      return Boolean(data?.id);
    });

    const result = await writeWithTelefonFallback(
      async (values) => await supabase.from("profesionisti").insert(values),
      {
        user_id: user.id,
        slug,
        nume_business: parsed.data.nume_business,
        telefon: parsed.data.telefon,
        tip_activitate: parsed.data.tip_activitate,
        onboarding_pas: 4
      }
    );
    errorMessage = result.error?.message ?? null;
  }

  if (errorMessage) {
    redirect(`/onboarding?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/dashboard");
}
