import type { SupabaseClient } from "@supabase/supabase-js";

import { parseProgramJson } from "@/lib/program";
import { calcDataFinalProgramare, computeFreeSlots } from "@/lib/slots";

export type InsertProgramareInput = {
  slug: string;
  serviciuId: string;
  dateStr: string;
  slotIso: string;
  numeClient: string;
  telefonClient: string;
  emailClient?: string | null;
};

export type InsertProgramareResult =
  | { ok: true; programareId: string }
  | { ok: false; message: string };

/**
 * Inserează o programare publică pentru un profesionist (slug).
 * Verifică clienti_blocati, serviciu, slot liber, apoi insert.
 */
export async function insertProgramareForProfSlug(
  admin: SupabaseClient,
  input: InsertProgramareInput
): Promise<InsertProgramareResult> {
  const phone = input.telefonClient.trim();
  const name = input.numeClient.trim();

  const { data: prof, error: e1 } = await admin.from("profesionisti").select("*").eq("slug", input.slug).maybeSingle();
  if (e1 || !prof) {
    return { ok: false, message: "Pagina nu există." };
  }

  const { data: blocked } = await admin
    .from("clienti_blocati")
    .select("id")
    .eq("profesionist_id", prof.id)
    .eq("telefon", phone)
    .maybeSingle();
  if (blocked) {
    return {
      ok: false,
      message: `Ne pare rău, sună la ${prof.telefon ?? "salon"} pentru programare.`
    };
  }

  const { data: srv, error: e2 } = await admin
    .from("servicii")
    .select("*")
    .eq("id", input.serviciuId)
    .eq("profesionist_id", prof.id)
    .eq("activ", true)
    .maybeSingle();
  if (e2 || !srv) {
    return { ok: false, message: "Serviciu invalid." };
  }

  const dataStart = new Date(input.slotIso);
  if (Number.isNaN(dataStart.getTime())) {
    return { ok: false, message: "Oră invalidă." };
  }

  const startDay = `${input.dateStr}T00:00:00.000Z`;
  const endDay = `${input.dateStr}T23:59:59.999Z`;
  const { data: progs } = await admin
    .from("programari")
    .select("data_start,data_final,status")
    .eq("profesionist_id", prof.id)
    .neq("status", "anulat")
    .lt("data_start", endDay)
    .gt("data_final", startDay);

  const ocupate = (progs ?? []).map((p) => ({
    start: new Date(p.data_start as string),
    end: new Date(p.data_final as string)
  }));

  const program = parseProgramJson(prof.program);
  const prep = prof.lucreaza_acasa ? (prof.timp_pregatire as number) : 0;
  const slots = computeFreeSlots(
    input.dateStr,
    program,
    srv.durata_minute as number,
    prof.pauza_intre_clienti as number,
    prep,
    ocupate
  );
  const okSlot = slots.some((s) => Math.abs(s.getTime() - dataStart.getTime()) < 60 * 1000);
  if (!okSlot) {
    return { ok: false, message: "Slotul nu mai e disponibil. Alege altă oră." };
  }

  const hasEarlier = ocupate.some((o) => o.start < dataStart);
  const ePrimul = !hasEarlier;
  const dataFinal = calcDataFinalProgramare(
    dataStart,
    srv.durata_minute as number,
    prof.pauza_intre_clienti as number,
    prep,
    ePrimul
  );

  const { data: inserted, error: ins } = await admin
    .from("programari")
    .insert({
      profesionist_id: prof.id,
      serviciu_id: srv.id,
      nume_client: name,
      telefon_client: phone,
      email_client: input.emailClient?.trim() || null,
      data_start: dataStart.toISOString(),
      data_final: dataFinal.toISOString(),
      status: "confirmat",
      creat_de: "client"
    })
    .select("id")
    .single();
  if (ins || !inserted?.id) {
    return { ok: false, message: ins?.message ?? "Nu am putut crea programarea." };
  }

  return { ok: true, programareId: inserted.id };
}
