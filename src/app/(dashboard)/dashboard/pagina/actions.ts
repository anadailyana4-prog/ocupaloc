"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function getPrimaryProf(supabase: SupabaseServer): Promise<string | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prof } = await supabase.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();
  return prof?.id ?? null;
}

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Numele e obligatoriu.").max(200),
  phone: z
    .string()
    .trim()
    .max(50)
    .transform((s) => (s === "" ? null : s)),
  description: z
    .string()
    .trim()
    .max(200, "Descrierea poate avea maximum 200 de caractere.")
    .transform((s) => (s === "" ? null : s)),
  email: z
    .string()
    .trim()
    .max(200)
    .transform((s) => (s === "" ? null : s))
    .refine((s) => s === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), {
      message: "Adresa de email nu e validă."
    })
});

export async function savePageSettings(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const profId = await getPrimaryProf(supabase);
  if (!profId) {
    redirect("/dashboard/pagina?error=" + encodeURIComponent("Nu am găsit profilul profesionistului."));
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    description: String(formData.get("description") ?? ""),
    email: String(formData.get("email") ?? "")
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Date invalide.";
    redirect("/dashboard/pagina?error=" + encodeURIComponent(msg));
  }

  const { error } = await supabase
    .from("profesionisti")
    .update({
      nume_business: parsed.data.name,
      telefon: parsed.data.phone,
      description: parsed.data.description,
      email: parsed.data.email
    })
    .eq("id", profId);

  if (error) {
    redirect("/dashboard/pagina?error=" + encodeURIComponent(error.message));
  }

  const { data: prof } = await supabase.from("profesionisti").select("slug").eq("id", profId).maybeSingle();
  if (prof?.slug) {
    revalidatePath(`/${prof.slug}`);
  }
  revalidatePath("/dashboard/pagina");
  redirect("/dashboard/pagina?saved=1");
}
