"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const servicePayload = z.object({
  name: z.string().min(1).max(200),
  duration_min: z.coerce.number().int().min(1).max(480),
  price: z.coerce.number().min(0),
  is_active: z.boolean().optional().default(true),
  is_featured: z.boolean().optional()
});

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function getPrimaryProf(supabase: SupabaseServer): Promise<{ id: string; slug: string; nume_business: string | null } | null> {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prof } = await supabase.from("profesionisti").select("id, slug, nume_business").eq("user_id", user.id).maybeSingle();
  if (!prof?.id || !prof.slug) return null;
  return { id: prof.id, slug: prof.slug, nume_business: prof.nume_business ?? null };
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
  const admin = createSupabaseServiceClient();

  // Keep tenant creation resilient: a historical slug collision in `tenants`
  // must not block adding services from dashboard.
  const { data: existingTenant, error: existingTenantErr } = await admin
    .from("tenants")
    .select("id")
    .eq("id", prof.id)
    .maybeSingle();

  if (existingTenantErr) {
    return { success: false, message: existingTenantErr.message };
  }

  if (!existingTenant) {
    let tenantCreated = false;
    const slugCandidates = [prof.slug, `${prof.slug}-${prof.id.slice(0, 8)}`];

    for (const candidateSlug of slugCandidates) {
      const { error: tenantInsertErr } = await admin.from("tenants").insert({
        id: prof.id,
        slug: candidateSlug,
        name: prof.nume_business ?? prof.slug
      });

      if (!tenantInsertErr) {
        tenantCreated = true;
        break;
      }

      const isSlugConflict = tenantInsertErr.code === "23505" && tenantInsertErr.message.toLowerCase().includes("slug");
      if (!isSlugConflict) {
        return { success: false, message: tenantInsertErr.message };
      }
    }

    if (!tenantCreated) {
      return { success: false, message: "Nu am putut sincroniza tenant-ul pentru acest cont." };
    }
  }

  const { data: inserted, error } = await admin
    .from("servicii")
    .insert({
      profesionist_id: prof.id,
      tenant_id: prof.id,
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
  const admin = createSupabaseServiceClient();

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

  const { error } = await admin.from("servicii").update(updatePayload).eq("id", id.data).eq("profesionist_id", prof.id);

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
  const admin = createSupabaseServiceClient();

  if (isFeatured) {
    const { count, error: countError } = await admin
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

  const { error } = await admin
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
  const admin = createSupabaseServiceClient();

  const { error } = await admin.from("servicii").delete().eq("id", id.data).eq("profesionist_id", prof.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/servicii");
  revalidatePath(`/${prof.slug}`);
  return { success: true };
}
