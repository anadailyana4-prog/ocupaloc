"use server";

import { z } from "zod";

import { insertProgramareForProfSlug } from "@/lib/booking/insert-programare";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const schema = z.object({
  slug: z.string().min(1),
  serviciuId: z.string().uuid(),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotIso: z.string(),
  numeClient: z.string().min(2, "Numele e prea scurt."),
  telefonClient: z.string().min(8, "Introdu un număr de telefon valid."),
  emailClient: z.string().email().optional().or(z.literal(""))
});

export async function createPublicBooking(raw: z.infer<typeof schema>) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors };
  }
  const { slug, serviciuId, dateStr, slotIso, numeClient, telefonClient, emailClient } = parsed.data;

  try {
    const admin = createSupabaseServiceClient();
    const res = await insertProgramareForProfSlug(admin, {
      slug,
      serviciuId,
      dateStr,
      slotIso,
      numeClient,
      telefonClient,
      emailClient: emailClient?.trim() || null
    });
    if (!res.ok) {
      return { ok: false as const, message: res.message };
    }
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare la salvare.";
    return { ok: false as const, message };
  }
}
