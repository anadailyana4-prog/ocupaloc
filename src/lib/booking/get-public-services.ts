import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeBookingSlug } from "@/lib/booking/normalize-booking-slug";

type Err = { ok: false; status: number; error: string };
type Ok = {
  ok: true;
  services: Array<{ id: string; nume: string; durata_minute: number; pret: number | null }>;
};

export type GetPublicServicesResult = Err | Ok;

export async function getPublicServices(admin: SupabaseClient, slugRaw: string): Promise<GetPublicServicesResult> {
  const slug = normalizeBookingSlug(slugRaw);

  const { data: prof, error: profErr } = await admin.from("profesionisti").select("id").eq("slug", slug).maybeSingle();

  if (profErr || !prof?.id) {
    return { ok: false, status: 404, error: "Pagina nu există." };
  }

  const { data: rows, error: srvErr } = await admin
    .from("servicii")
    .select("id, nume, durata_minute, pret")
    .eq("profesionist_id", prof.id)
    .eq("activ", true)
    .order("nume", { ascending: true });

  if (srvErr) {
    return { ok: false, status: 500, error: "Nu am putut încărca serviciile." };
  }

  return {
    ok: true,
    services: (rows ?? []).map((r) => ({
      id: r.id as string,
      nume: r.nume as string,
      durata_minute: Number(r.durata_minute ?? 0),
      pret: r.pret != null ? Number(r.pret) : null
    }))
  };
}
