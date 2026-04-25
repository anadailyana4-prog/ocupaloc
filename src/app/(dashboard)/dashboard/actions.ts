"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logBookingStatusEvent } from "@/lib/booking/status-events";
import { notifyClientBookingCancelledByProvider, notifyClientBookingConfirmation, notifyClientPostCompletion } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
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
  const { error } = await ctx.supabase
    .from("programari")
    .update({ status: "anulat" })
    .eq("id", parsed.data)
    .eq("profesionist_id", ctx.profId)
    .eq("status", "confirmat");
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
  const { error } = await ctx.supabase
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
  const { error } = await ctx.supabase
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

export type ManualBookingResult = { success: true; emailSent: boolean } | { success: false; message: string };

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

  const { data: srv, error: srvErr } = await ctx.supabase
    .from("servicii")
    .select("id, durata_minute")
    .eq("id", parsed.data.serviciuId)
    .eq("profesionist_id", ctx.profId)
    .maybeSingle();

  if (srvErr || !srv) {
    return { success: false, message: "Serviciu invalid sau nu îți aparține." };
  }

  const dataStart = new Date(`${parsed.data.dataStr}T${parsed.data.oraStr}:00`);
  if (Number.isNaN(dataStart.getTime())) {
    return { success: false, message: "Data sau ora sunt invalide." };
  }

  if (dataStart.getTime() <= Date.now()) {
    return { success: false, message: "Nu poți adăuga o programare în trecut." };
  }

  const dataFinal = new Date(dataStart.getTime() + (srv.durata_minute ?? 60) * 60_000);

  const { data: inserted, error: insErr } = await ctx.supabase
    .from("programari")
    .insert({
      profesionist_id: ctx.profId,
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

  // Notifică clientul dacă a furnizat email (fire-and-forget).
  const emailSent = Boolean(inserted?.id && parsed.data.emailClient);
  if (emailSent) {
    notifyClientBookingConfirmation(inserted.id).catch((err) =>
      reportError("email", "manual_booking_notify_client_failed", err, { bookingId: inserted.id })
    );
  }

  await logBookingStatusEvent({ bookingId: inserted.id, status: "confirmat", source: "salon_manual" });

  revalidatePath("/dashboard");
  return { success: true, emailSent };
}
