"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logBookingStatusEvent } from "@/lib/booking/status-events";
import { notifyClientBookingCancelledByProvider, notifyClientBookingConfirmation, notifyClientPostCompletion } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { withProgramPauza } from "@/lib/program";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { writeWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BookingActionResult = { success: true } | { success: false; message: string };

const idSchema = z.string().uuid();

async function getProfIdForUser(): Promise<{ supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>; profId: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: prof } = await supabase.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();
  if (!prof?.id) return null;
  return { supabase, profId: prof.id };
}

export async function cancelBooking(id: string): Promise<BookingActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, message: "ID invalid." };
  }
  const ctx = await getProfIdForUser();
  if (!ctx) {
    return { success: false, message: "Nu ești autentificat sau lipsește profilul." };
  }
  const admin = createSupabaseServiceClient();
  const { error } = await admin
    .from("programari")
    .update({ status: "anulat" })
    .eq("id", parsed.data)
    .eq("profesionist_id", ctx.profId)
    .in("status", ["confirmat", "in_asteptare"]);
  if (error) {
    return { success: false, message: error.message };
  }
  await logBookingStatusEvent({ bookingId: parsed.data, status: "anulat", source: "salon_dashboard" });
  try {
    await notifyClientBookingCancelledByProvider(parsed.data);
  } catch (error) {
    reportError("email", "notify_client_cancellation_failed", error, { bookingId: parsed.data });
  }
  revalidatePath("/dashboard");
  return { success: true };
}

export async function completeBooking(id: string): Promise<BookingActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, message: "ID invalid." };
  }
  const ctx = await getProfIdForUser();
  if (!ctx) {
    return { success: false, message: "Nu ești autentificat sau lipsește profilul." };
  }
  const admin = createSupabaseServiceClient();
  const { error } = await admin
    .from("programari")
    .update({ status: "finalizat" })
    .eq("id", parsed.data)
    .eq("profesionist_id", ctx.profId)
    .eq("status", "confirmat");
  if (error) {
    return { success: false, message: error.message };
  }
  await logBookingStatusEvent({ bookingId: parsed.data, status: "finalizat", source: "salon_dashboard" });
  try {
    await notifyClientPostCompletion(parsed.data);
  } catch (err) {
    reportError("email", "notify_client_post_completion_failed", err, { bookingId: parsed.data });
  }
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markNoShow(id: string): Promise<BookingActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, message: "ID invalid." };
  }
  const ctx = await getProfIdForUser();
  if (!ctx) {
    return { success: false, message: "Nu ești autentificat sau lipsește profilul." };
  }
  const admin = createSupabaseServiceClient();
  const { error } = await admin
    .from("programari")
    .update({ status: "noaparit" })
    .eq("id", parsed.data)
    .eq("profesionist_id", ctx.profId)
    .eq("status", "confirmat");
  if (error) {
    return { success: false, message: error.message };
  }
  await logBookingStatusEvent({ bookingId: parsed.data, status: "noaparit", source: "salon_dashboard" });
  revalidatePath("/dashboard");
  return { success: true };
}

const publicFields = z.object({
  telefon: z.string().trim().max(50).optional().transform((s) => (s === "" ? null : s)),
  description: z.string().trim().max(2000).optional().transform((s) => (s === "" ? null : s))
});

const pauzeFields = z.object({
  pauza_intre_clienti: z.preprocess(
    (v) => {
      if (typeof v !== "string") return undefined;
      const t = v.trim();
      if (!t) return undefined;
      return Number(t);
    },
    z.number().int("Pauza trebuie să fie un număr întreg.").min(0, "Pauza minimă este 0 minute.").max(120, "Pauza maximă este 120 minute.").optional()
  ),
  pauza_start: z
    .string()
    .trim()
    .optional()
    .transform((s) => {
      if (!s) return undefined;
      return /^\d{2}:\d{2}$/.test(s) ? s : "invalid";
    }),
  pauza_durata: z.preprocess(
    (v) => {
      if (typeof v !== "string") return undefined;
      const t = v.trim();
      if (!t) return undefined;
      return Number(t);
    },
    z.number().int("Durata pauzei trebuie să fie un număr întreg.").min(15, "Durata minimă a pauzei zilnice este 15 minute.").max(240, "Durata maximă a pauzei zilnice este 240 minute.").optional()
  )
});

const smartRulesFields = z.object({
  smart_rules_enabled: z.boolean(),
  smart_max_future_bookings: z.number().int().min(0).max(10),
  smart_client_cancel_threshold: z.number().int().min(0).max(10),
  smart_cancel_window_days: z.number().int().min(7).max(365),
  smart_min_notice_minutes: z.number().int().min(0).max(1440)
});

export async function updatePublicBusinessFields(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const raw = {
    telefon: String(formData.get("telefon") ?? ""),
    description: String(formData.get("description") ?? "")
  };
  const parsed = publicFields.safeParse(raw);
  if (!parsed.success) {
    redirect("/dashboard/setari?error=" + encodeURIComponent("Date invalide."));
  }
  const { error } = await writeWithTelefonFallback(
    async (values) => await supabase.from("profesionisti").update(values).eq("user_id", user.id),
    {
      telefon: parsed.data.telefon,
      description: parsed.data.description
    }
  );
  if (error) {
    redirect("/dashboard/setari?error=" + encodeURIComponent(error.message ?? "Nu am putut salva datele publice."));
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/setari");
  redirect("/dashboard/setari?saved=1");
}

export async function updatePauzeSettings(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const raw = {
    pauza_intre_clienti: String(formData.get("pauza_intre_clienti") ?? ""),
    pauza_start: String(formData.get("pauza_start") ?? ""),
    pauza_durata: String(formData.get("pauza_durata") ?? "")
  };
  const parsed = pauzeFields.safeParse(raw);
  if (!parsed.success) {
    redirect("/dashboard/setari?error=" + encodeURIComponent("Date invalide la pauze."));
  }

  if (parsed.data.pauza_start === "invalid") {
    redirect("/dashboard/setari?error=" + encodeURIComponent("Ora de start a pauzei zilnice este invalidă (format HH:MM)."));
  }

  const hasBreakStart = Boolean(parsed.data.pauza_start);
  const hasBreakDuration = parsed.data.pauza_durata !== undefined;
  if (hasBreakStart !== hasBreakDuration) {
    redirect("/dashboard/setari?error=" + encodeURIComponent("Completează atât ora de start cât și durata pauzei zilnice."));
  }

  // Fetch existing program to merge pauza config
  const { data: prof } = await supabase
    .from("profesionisti")
    .select("program")
    .eq("user_id", user.id)
    .maybeSingle();

  const pauzaProgramConfig =
    hasBreakStart && hasBreakDuration
      ? {
          start: parsed.data.pauza_start as string,
          durationMinutes: parsed.data.pauza_durata as number
        }
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateValues: Record<string, any> = {};
  if (parsed.data.pauza_intre_clienti !== undefined) {
    updateValues.pauza_intre_clienti = parsed.data.pauza_intre_clienti;
  }
  if (pauzaProgramConfig !== null) {
    updateValues.program = withProgramPauza(prof?.program ?? null, pauzaProgramConfig);
  } else if (!hasBreakStart && !hasBreakDuration) {
    // Clear pauza zilnica from program if both fields are empty
    updateValues.program = withProgramPauza(prof?.program ?? null, null);
  }

  if (Object.keys(updateValues).length > 0) {
    const { error } = await supabase.from("profesionisti").update(updateValues).eq("user_id", user.id);
    if (error) {
      redirect("/dashboard/setari?error=" + encodeURIComponent(error.message ?? "Nu am putut salva setările de pauze."));
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/setari");
  redirect("/dashboard/setari?saved=1");
}

export type SaveSmartRulesResult = { ok: true } | { ok: false; message: string };

export async function saveSmartRulesFromClient(data: {
  smart_rules_enabled: boolean;
  smart_max_future_bookings: number;
  smart_client_cancel_threshold: number;
  smart_cancel_window_days: number;
  smart_min_notice_minutes: number;
}): Promise<SaveSmartRulesResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Neautentificat." };

  const parsed = smartRulesFields.safeParse(data);
  if (!parsed.success) return { ok: false, message: "Date invalide." };

  const { error } = await supabase
    .from("profesionisti")
    .update({
      smart_rules_enabled: parsed.data.smart_rules_enabled,
      smart_max_future_bookings: parsed.data.smart_max_future_bookings,
      smart_client_cancel_threshold: parsed.data.smart_client_cancel_threshold,
      smart_cancel_window_days: parsed.data.smart_cancel_window_days,
      smart_min_notice_minutes: parsed.data.smart_min_notice_minutes
    })
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/setari");
  return { ok: true };
}

// -----------------------------------------------
// Programare manuală adăugată de owner
// -----------------------------------------------

const manualBookingSchema = z.object({
  numeClient: z.string().trim().min(1, "Numele clientului este obligatoriu.").max(120),
  telefonClient: z.string().trim().min(4, "Telefonul este obligatoriu.").max(50),
  emailClient: z
    .string()
    .trim()
    .max(254)
    .email("Email invalid.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v ?? null)),
  serviciuId: z.string().uuid("Serviciu invalid."),
  dataStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data invalidă."),
  oraStr: z.string().regex(/^\d{2}:\d{2}$/, "Ora invalidă.")
});

export type ManualBookingResult =
  | { success: true; clientNotification: "queued" | "failed" | "not_requested" }
  | { success: false; message: string };

export async function addManualBooking(input: {
  numeClient: string;
  telefonClient: string;
  emailClient?: string;
  serviciuId: string;
  dataStr: string;
  oraStr: string;
}): Promise<ManualBookingResult> {
  const parsed = manualBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Date invalide." };
  }

  // Reject past-date bookings
  const { toDate } = await import("date-fns-tz");
  const appointmentDate = toDate(`${parsed.data.dataStr}T${parsed.data.oraStr}:00`, { timeZone: "Europe/Bucharest" });
  if (appointmentDate < new Date()) {
    return { success: false, message: "Nu poți adăuga o programare în trecut." };
  }

  const ctx = await getProfIdForUser();
  if (!ctx) {
    return { success: false, message: "Nu ești autentificat sau lipsește profilul." };
  }

  const admin = createSupabaseServiceClient();

  const { data: srv, error: srvErr } = await admin
    .from("servicii")
    .select("id, durata_minute")
    .eq("id", parsed.data.serviciuId)
    .eq("profesionist_id", ctx.profId)
    .maybeSingle();

  if (srvErr || !srv) {
    return { success: false, message: "Serviciu invalid sau nu îți aparține." };
  }

  const dataStart = toDate(`${parsed.data.dataStr}T${parsed.data.oraStr}:00`, { timeZone: "Europe/Bucharest" });
  if (Number.isNaN(dataStart.getTime())) {
    return { success: false, message: "Data sau ora sunt invalide." };
  }

  // We already checked if appointmentDate < new Date() above, which uses toDate correctly
  const dataFinal = new Date(dataStart.getTime() + (srv.durata_minute ?? 60) * 60_000);

  const { data: inserted, error: insErr } = await admin
    .from("programari")
    .insert({
      profesionist_id: ctx.profId,
      tenant_id: ctx.profId,
      serviciu_id: parsed.data.serviciuId,
      nume_client: parsed.data.numeClient,
      telefon_client: parsed.data.telefonClient,
      email_client: parsed.data.emailClient ?? null,
      data_start: dataStart.toISOString(),
      data_final: dataFinal.toISOString(),
      status: "confirmat",
      creat_de: "salon_manual"
    })
    .select("id")
    .single();

  if (insErr) {
    if (insErr.code === "23P01") {
      return { success: false, message: "Intervalul se suprapune cu o programare existentă. Alege altă oră." };
    }
    return { success: false, message: insErr.message };
  }

  let clientNotification: "queued" | "failed" | "not_requested" = "not_requested";
  if (inserted?.id && parsed.data.emailClient) {
    try {
      const sent = await notifyClientBookingConfirmation(inserted.id);
      clientNotification = sent ? "queued" : "failed";
    } catch (err) {
      clientNotification = "failed";
      reportError("email", "manual_booking_notify_client_failed", err, { bookingId: inserted.id });
    }
  }

  await logBookingStatusEvent({ bookingId: inserted.id, status: "confirmat", source: "salon_manual" });

  revalidatePath("/dashboard");
  return { success: true, clientNotification };
}
