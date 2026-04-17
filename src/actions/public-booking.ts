"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { insertProgramareForProfSlug } from "@/lib/booking/insert-programare";
import { normalizeBookingSlug } from "@/lib/booking/normalize-booking-slug";
import { notifyClientBookingConfirmation, notifyProfesionistDespreProgramare } from "@/lib/email/programare-notify";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const schema = z.object({
  slug: z.string().min(1),
  serviciuId: z.string().uuid(),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotIso: z.string(),
  numeClient: z.string().min(2, "Numele e prea scurt."),
  telefonClient: z.string().min(8, "Introdu un număr de telefon valid."),
  emailClient: z.string().trim().email("Introdu un email valid.")
});

export async function createPublicBooking(raw: z.infer<typeof schema>) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { slug, serviciuId, dateStr, slotIso, numeClient, telefonClient, emailClient } = parsed.data;
  const normalizedSlug = normalizeBookingSlug(slug);

  try {
    const admin = createSupabaseServiceClient();

    const hdrs = await headers();
    const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimit = await checkApiRateLimit(admin, `sa:book:${normalizedSlug}:${ip}`, 20, 300_000);
    if (!rateLimit.allowed) {
      return { ok: false as const, message: "Prea multe cereri. Încearcă din nou în câteva minute." };
    }
    const res = await insertProgramareForProfSlug(admin, {
      slug: normalizedSlug,
      serviciuId,
      dateStr,
      slotIso,
      numeClient,
      telefonClient,
      emailClient: emailClient.trim()
    });
    if (!res.ok) {
      return { ok: false as const, message: res.message };
    }
    await notifyProfesionistDespreProgramare(res.programareId);
    await notifyClientBookingConfirmation(res.programareId);
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare la salvare.";
    return { ok: false as const, message };
  }
}
