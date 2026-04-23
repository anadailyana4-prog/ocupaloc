"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logBookingStatusEvent } from "@/lib/booking/status-events";
import { notifyClientBookingCancelledBySalon } from "@/lib/email/programare-notify";
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
    await notifyClientBookingCancelledBySalon(parsed.data);
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

export async function updatePublicSalonFields(formData: FormData) {
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
    redirect("/dashboard?error=" + encodeURIComponent("Date invalide."));
  }
  const { error } = await writeWithTelefonFallback(
    async (values) => await supabase.from("profesionisti").update(values).eq("user_id", user.id),
    {
      telefon: parsed.data.telefon,
      description: parsed.data.description
    }
  );
  if (error) {
    redirect("/dashboard?error=" + encodeURIComponent(error.message ?? "Nu am putut salva datele publice."));
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function updateSmartRules(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const parsed = smartRulesFields.safeParse({
    smart_rules_enabled: String(formData.get("smart_rules_enabled") ?? "") === "on",
    smart_max_future_bookings: Number(formData.get("smart_max_future_bookings") ?? 0),
    smart_client_cancel_threshold: Number(formData.get("smart_client_cancel_threshold") ?? 0),
    smart_cancel_window_days: Number(formData.get("smart_cancel_window_days") ?? 60),
    smart_min_notice_minutes: Number(formData.get("smart_min_notice_minutes") ?? 0)
  });

  if (!parsed.success) {
    redirect("/dashboard?error=" + encodeURIComponent("Setări reguli smart invalide."));
  }

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

  if (error) {
    redirect("/dashboard?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}
