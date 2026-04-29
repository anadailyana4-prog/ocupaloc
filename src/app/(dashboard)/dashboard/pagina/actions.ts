"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isMissingProfesionistiColumn } from "@/lib/supabase/profesionisti-fallback";
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
  whatsapp: z
    .string()
    .trim()
    .max(50)
    .transform((s) => (s === "" ? null : s)),
  adresa_publica: z
    .string()
    .trim()
    .max(300)
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
    whatsapp: String(formData.get("whatsapp") ?? ""),
    adresa_publica: String(formData.get("adresa_publica") ?? ""),
    description: String(formData.get("description") ?? ""),
    email: String(formData.get("email") ?? "")
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Date invalide.";
    redirect("/dashboard/pagina?error=" + encodeURIComponent(msg));
  }

  const runUpdate = async (values: Record<string, unknown>) => await supabase.from("profesionisti").update(values).eq("id", profId);
  const baseValues = {
    nume_business: parsed.data.name,
    description: parsed.data.description,
    email: parsed.data.email,
    adresa_publica: parsed.data.adresa_publica
  };

  const updateAttempts: Array<Record<string, unknown>> = [
    { ...baseValues, telefon: parsed.data.phone, whatsapp: parsed.data.whatsapp },
    { ...baseValues, telefon: parsed.data.phone },
    { ...baseValues, whatsapp: parsed.data.whatsapp },
    { ...baseValues }
  ];

  let error: { message?: string | null } | null = null;
  for (const values of updateAttempts) {
    const result = await runUpdate(values);
    if (!result.error) {
      error = null;
      break;
    }

    const missingTelefon = isMissingProfesionistiColumn(result.error, "telefon");
    const missingWhatsapp = isMissingProfesionistiColumn(result.error, "whatsapp");
    if (missingTelefon || missingWhatsapp) {
      error = result.error;
      continue;
    }

    error = result.error;
    break;
  }

  if (error) {
    redirect("/dashboard/pagina?error=" + encodeURIComponent(error.message ?? "Nu am putut salva datele."));
  }

  const { data: prof } = await supabase.from("profesionisti").select("slug").eq("id", profId).maybeSingle();
  if (prof?.slug) {
    revalidatePath(`/${prof.slug}`);
  }
  revalidatePath("/dashboard/pagina");
  redirect("/dashboard/pagina?saved=1");
}
