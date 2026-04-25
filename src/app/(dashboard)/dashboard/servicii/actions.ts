"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const servicePayload = z.object({
  name: z.string().min(1).max(200),
  duration_min: z.coerce.number().int().min(1).max(480),
  price: z.coerce.number().min(0),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional()
});

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function getPrimaryProf(supabase: SupabaseServer): Promise<{ id: string; slug: string } | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prof } = await supabase.from("profesionisti").select("id, slug").eq("user_id", user.id).maybeSingle();
  if (!prof?.id || !prof.slug) return null;
  return { id: prof.id, slug: prof.slug };
}

export type ServiceActionResult = { success: true } | { success: false; message: string };

const MAX_FEATURED_SERVICES = 6;

export async function createService(raw: z.infer<typeof servicePayload>): Promise<ServiceActionResult> {
  const parsed = servicePayload.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Date invalide." };
  }
  const supabase = await createSupabaseServerClient();
  const prof = await getPrimaryProf(supabase);
  if (!prof) {
    return { success: false, message: "Nu am găsit profilul profesionistului." };
  }

  const { data: inserted, error } = await supabase
    .from("servicii")
    .insert({
      profesionist_id: prof.id,
      nume: parsed.data.name.trim(),
      durata_minute: parsed.data.duration_min,
      pret: parsed.data.price,
      activ: parsed.data.is_active,
      is_featured: parsed.data.is_featured ?? false
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { success: false, message: error?.message ?? "Nu am putut crea serviciul." };
  }

  revalidatePath("/dashboard/servicii");
  revalidatePath(`/${prof.slug}`);
  return { success: true };
}

export async function updateService(serviceId: string, raw: z.infer<typeof servicePayload>): Promise<ServiceActionResult> {
  const id = z.string().uuid().safeParse(serviceId);
  if (!id.success) {
    return { success: false, message: "ID invalid." };
  }
  const parsed = servicePayload.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Date invalide." };
  }

  const supabase = await createSupabaseServerClient();
  const prof = await getPrimaryProf(supabase);
  if (!prof) {
    return { success: false, message: "Nu am găsit profilul profesionistului." };
  }

  const updatePayload: {
    nume: string;
    durata_minute: number;
    pret: number;
    activ: boolean;
    is_featured?: boolean;
  } = {
    nume: parsed.data.name.trim(),
    durata_minute: parsed.data.duration_min,
    pret: parsed.data.price,
    activ: parsed.data.is_active
  };
  if (typeof parsed.data.is_featured === "boolean") {
    updatePayload.is_featured = parsed.data.is_featured;
  }

  const { error } = await supabase.from("servicii").update(updatePayload).eq("id", id.data).eq("profesionist_id", prof.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/servicii");
  revalidatePath(`/${prof.slug}`);
  return { success: true };
}

export async function setServiceFeatured(serviceId: string, isFeatured: boolean): Promise<ServiceActionResult> {
  const id = z.string().uuid().safeParse(serviceId);
  if (!id.success) {
    return { success: false, message: "ID invalid." };
  }

  const supabase = await createSupabaseServerClient();
  const prof = await getPrimaryProf(supabase);
  if (!prof) {
    return { success: false, message: "Nu am găsit profilul profesionistului." };
  }

  if (isFeatured) {
    const { count, error: countError } = await supabase
      .from("servicii")
      .select("id", { count: "exact", head: true })
      .eq("profesionist_id", prof.id)
      .eq("is_featured", true);

    if (countError) {
      return { success: false, message: countError.message };
    }

    if ((count ?? 0) >= MAX_FEATURED_SERVICES) {
      return { success: false, message: "Poți selecta maxim 6 servicii afișate primele." };
    }
  }

  const { error } = await supabase
    .from("servicii")
    .update({ is_featured: isFeatured })
    .eq("id", id.data)
    .eq("profesionist_id", prof.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/servicii");
  revalidatePath(`/${prof.slug}`);
  return { success: true };
}

export async function deleteService(serviceId: string): Promise<ServiceActionResult> {
  const id = z.string().uuid().safeParse(serviceId);
  if (!id.success) {
    return { success: false, message: "ID invalid." };
  }

  const supabase = await createSupabaseServerClient();
  const prof = await getPrimaryProf(supabase);
  if (!prof) {
    return { success: false, message: "Nu am găsit profilul profesionistului." };
  }

  const { error } = await supabase.from("servicii").delete().eq("id", id.data).eq("profesionist_id", prof.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/servicii");
  revalidatePath(`/${prof.slug}`);
  return { success: true };
}
