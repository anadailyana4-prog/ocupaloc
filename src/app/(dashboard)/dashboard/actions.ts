"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  revalidatePath("/dashboard");
  return { success: true };
}

const publicFields = z.object({
  telefon: z.string().trim().max(50).optional().transform((s) => (s === "" ? null : s)),
  description: z.string().trim().max(2000).optional().transform((s) => (s === "" ? null : s))
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
  const { error } = await supabase
    .from("profesionisti")
    .update({
      telefon: parsed.data.telefon,
      description: parsed.data.description
    })
    .eq("user_id", user.id);
  if (error) {
    redirect("/dashboard?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}
