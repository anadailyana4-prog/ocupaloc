"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z.string().trim().min(2, "Numele este obligatoriu."),
  phone: z.string().trim().min(8, "Telefon invalid."),
  role: z.string().trim().min(2, "Rolul este obligatoriu.")
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
    full_name: String(formData.get("full_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    role: String(formData.get("role") ?? "")
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Date invalide.";
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`);
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      role: parsed.data.role
    },
    { onConflict: "id" }
  );

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
