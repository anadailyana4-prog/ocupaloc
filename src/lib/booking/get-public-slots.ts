import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeBookingSlug } from "@/lib/booking/normalize-booking-slug";
import { parseProgramJson } from "@/lib/program";
import { computeFreeSlots } from "@/lib/slots";

type GetPublicSlotsInput = {
  slug: string;
  serviceId: string;
  date: string;
  normalizeSlug?: boolean;
};

type ErrorResult = {
  ok: false;
  status: number;
  error: string;
};

type SuccessResult = {
  ok: true;
  prof: {
    id: string;
    user_id: string;
    program: unknown;
    pauza_intre_clienti: number;
    timp_pregatire: number;
    lucreaza_acasa: boolean;
  };
  srv: {
    id: string;
    durata_minute: number;
  };
  slots: Date[];
};

export type GetPublicSlotsResult = ErrorResult | SuccessResult;

export async function getPublicSlots(admin: SupabaseClient, input: GetPublicSlotsInput): Promise<GetPublicSlotsResult> {
  const slug = input.normalizeSlug === false ? input.slug : normalizeBookingSlug(input.slug);

  const { data: prof, error: profErr } = await admin
    .from("profesionisti")
    .select("id,user_id,program,pauza_intre_clienti,timp_pregatire,lucreaza_acasa")
    .eq("slug", slug)
    .maybeSingle();

  if (profErr || !prof) {
    return { ok: false, status: 404, error: "Pagina nu există." };
  }

  const { data: srv, error: srvErr } = await admin
    .from("servicii")
    .select("id,durata_minute")
    .eq("id", input.serviceId)
    .eq("profesionist_id", prof.id)
    .eq("activ", true)
    .maybeSingle();

  if (srvErr || !srv) {
    return { ok: false, status: 400, error: "Serviciu invalid." };
  }

  const startDay = `${input.date}T00:00:00.000Z`;
  const endDay = `${input.date}T23:59:59.999Z`;

  const { data: progs } = await admin
    .from("programari")
    .select("data_start,data_final,status")
    .eq("profesionist_id", prof.id)
    .neq("status", "anulat")
    .lt("data_start", endDay)
    .gt("data_final", startDay);

  const occupied = (progs ?? []).map((p) => ({
    start: new Date(String(p.data_start)),
    end: new Date(String(p.data_final))
  }));

  const prep = prof.lucreaza_acasa ? Number(prof.timp_pregatire ?? 0) : 0;
  const slots = computeFreeSlots(
    input.date,
    parseProgramJson(prof.program),
    Number(srv.durata_minute ?? 0),
    Number(prof.pauza_intre_clienti ?? 0),
    prep,
    occupied
  );

  return {
    ok: true,
    prof: {
      id: String(prof.id),
      user_id: String(prof.user_id),
      program: prof.program,
      pauza_intre_clienti: Number(prof.pauza_intre_clienti ?? 0),
      timp_pregatire: Number(prof.timp_pregatire ?? 0),
      lucreaza_acasa: Boolean(prof.lucreaza_acasa)
    },
    srv: {
      id: String(srv.id),
      durata_minute: Number(srv.durata_minute ?? 0)
    },
    slots
  };
}
