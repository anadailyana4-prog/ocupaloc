"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { withProgramPauza } from "@/lib/program";
import { slugifyBusinessName, uniqueSlug } from "@/lib/slug";
import { recordOperationalEvent } from "@/lib/ops-events";
import { writeWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  nume_business: z.string().trim().min(2, "Numele business-ului este obligatoriu."),
  telefon: z.string().trim().min(8, "Telefon invalid."),
  whatsapp: z.string().trim().max(40).optional(),
  tip_activitate: z.string().trim().min(2, "Tipul activitatii este obligatoriu."),
  pauza_start: z
    .string()
    .trim()
    .optional()
    .transform((s) => {
      if (!s) return undefined;
      return /^\d{2}:\d{2}$/.test(s) ? s : "invalid";
    }),
  pauza_durata: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      return Number(trimmed);
    },
    z.number().int("Durata pauzei trebuie sa fie un numar intreg.").min(15, "Durata minima a pauzei este 15 minute.").max(240, "Durata maxima a pauzei este 240 minute.").optional()
  ),
  pauza_intre_clienti: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      return Number(trimmed);
    },
    z.number().int("Pauza trebuie sa fie un numar intreg.").min(0, "Pauza minima este 0 minute.").max(120, "Pauza maxima este 120 minute.").optional()
  )
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
    whatsapp: String(formData.get("whatsapp") ?? ""),
    tip_activitate: String(formData.get("tip_activitate") ?? ""),
    pauza_start: String(formData.get("pauza_start") ?? ""),
    pauza_durata: String(formData.get("pauza_durata") ?? ""),
    pauza_intre_clienti: String(formData.get("pauza_intre_clienti") ?? "")
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? "Date invalide.";
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`);
  }

  if (parsed.data.pauza_start === "invalid") {
    redirect(`/onboarding?error=${encodeURIComponent("Ora pauzei este invalida. Foloseste formatul HH:MM.")}`);
  }

  const hasBreakStart = Boolean(parsed.data.pauza_start);
  const hasBreakDuration = parsed.data.pauza_durata !== undefined;
  if (hasBreakStart !== hasBreakDuration) {
    redirect(`/onboarding?error=${encodeURIComponent("Completeaza atat ora de start, cat si durata pauzei.")}`);
  }

  const { data: existingProf } = await supabase.from("profesionisti").select("id, slug, program").eq("user_id", user.id).maybeSingle();

  let errorMessage: string | null = null;
  const pauseValue = parsed.data.pauza_intre_clienti;
  const pauzaProgramConfig =
    hasBreakStart && hasBreakDuration
      ? {
          start: parsed.data.pauza_start as string,
          durationMinutes: parsed.data.pauza_durata as number
        }
      : undefined;

  if (existingProf?.id) {
    const values: Record<string, unknown> = {
      nume_business: parsed.data.nume_business,
      telefon: parsed.data.telefon,
      whatsapp: parsed.data.whatsapp || null,
      tip_activitate: parsed.data.tip_activitate,
      onboarding_pas: 4
    };
    if (pauseValue !== undefined) {
      values.pauza_intre_clienti = pauseValue;
    }
    if (pauzaProgramConfig) {
      values.program = withProgramPauza(existingProf?.program ?? null, pauzaProgramConfig);
    }

    const result = await writeWithTelefonFallback(
      async (values) => await supabase.from("profesionisti").update(values).eq("id", existingProf.id),
      values
    );
    errorMessage = result.error?.message ?? null;
  } else {
    const base = slugifyBusinessName(parsed.data.nume_business);
    const slug = await uniqueSlug(base, async (candidate) => {
      const { data } = await supabase.from("profesionisti").select("id").eq("slug", candidate).maybeSingle();
      return Boolean(data?.id);
    });

    const values: Record<string, unknown> = {
      user_id: user.id,
      slug,
      nume_business: parsed.data.nume_business,
      telefon: parsed.data.telefon,
      whatsapp: parsed.data.whatsapp || null,
      tip_activitate: parsed.data.tip_activitate,
      onboarding_pas: 4
    };
    if (pauseValue !== undefined) {
      values.pauza_intre_clienti = pauseValue;
    }
    if (pauzaProgramConfig) {
      values.program = withProgramPauza(null, pauzaProgramConfig);
    }

    const result = await writeWithTelefonFallback(
      async (values) => await supabase.from("profesionisti").insert(values),
      values
    );
    errorMessage = result.error?.message ?? null;
  }

  if (errorMessage) {
    redirect(`/onboarding?error=${encodeURIComponent(errorMessage)}`);
  }

  await recordOperationalEvent({
    eventType: "onboarding_profile_completed",
    flow: "onboarding",
    outcome: "success",
    entityId: user.id,
    statusCode: 200,
    metadata: {
      source: "onboarding_actions",
      activity: parsed.data.tip_activitate
    }
  });

  // Get the slug (either updated or newly created) to pass to bun-venit
  const { data: updatedProf } = await supabase.from("profesionisti").select("slug").eq("user_id", user.id).maybeSingle();
  const slug = updatedProf?.slug ?? existingProf?.slug ?? "";

  redirect(`/onboarding/bun-venit?slug=${encodeURIComponent(slug)}`);
}
