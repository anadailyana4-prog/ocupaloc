import type { SupabaseClient } from "@supabase/supabase-js";

import { checkBookingEntitlement } from "@/lib/billing/entitlements";
import { entitlementMessage } from "@/lib/billing/entitlement-messages";
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

async function countClientCancellationsInWindow(
  admin: SupabaseClient,
  profesionistId: string,
  phone: string,
  cutoffIso: string
): Promise<number> {
  const { data: events } = await admin
    .from("programari_status_events")
    .select("programare_id")
    .eq("profesionist_id", profesionistId)
    .eq("status", "anulat")
    .eq("source", "client_link")
    .gte("created_at", cutoffIso);

  const bookingIds = Array.from(new Set((events ?? []).map((e) => e.programare_id).filter(Boolean)));
  if (bookingIds.length === 0) {
    return 0;
  }

  const { count } = await admin
    .from("programari")
    .select("id", { count: "exact", head: true })
    .in("id", bookingIds)
    .eq("profesionist_id", profesionistId)
    .eq("telefon_client", phone);

  return count ?? 0;
}

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

  // Entitlement check: subscription active / within trial window
  const entitlement = await checkBookingEntitlement(
    admin,
    prof.id as string,
    prof.created_at as string
  );
  if (!entitlement.allowed) {
    return { ok: false, message: entitlementMessage(entitlement.reason) };
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
      message: `Ne pare rău, sună la ${prof.telefon ?? "furnizor"} pentru programare.`
    };
  }

  const startRequest = new Date(input.slotIso);
  if (Number.isNaN(startRequest.getTime())) {
    return { ok: false, message: "Oră invalidă." };
  }

  // Always reject bookings in the past (independent of smart rules)
  if (startRequest.getTime() <= Date.now()) {
    return { ok: false, message: "Slot expirat — alege o oră viitoare." };
  }

  if (prof.smart_rules_enabled) {
    const minNotice = Number(prof.smart_min_notice_minutes ?? 0);
    if (minNotice > 0) {
      const minAllowed = new Date(Date.now() + minNotice * 60_000);
      if (startRequest.getTime() < minAllowed.getTime()) {
        return { ok: false, message: `Rezervările se fac cu minim ${minNotice} minute înainte.` };
      }
    }

    const maxFuture = Number(prof.smart_max_future_bookings ?? 0);
    if (maxFuture > 0) {
      const { count: futureCount } = await admin
        .from("programari")
        .select("id", { count: "exact", head: true })
        .eq("profesionist_id", prof.id)
        .eq("telefon_client", phone)
        .eq("status", "confirmat")
        .gte("data_start", new Date().toISOString());
      if ((futureCount ?? 0) >= maxFuture) {
        return { ok: false, message: "Ai atins limita de programări active pentru această locație." };
      }
    }

    const cancelThreshold = Number(prof.smart_client_cancel_threshold ?? 0);
    const windowDays = Number(prof.smart_cancel_window_days ?? 60);
    if (cancelThreshold > 0) {
      const cutoff = new Date(Date.now() - Math.max(7, windowDays) * 24 * 60 * 60 * 1000).toISOString();
      const cancellations = await countClientCancellationsInWindow(admin, prof.id, phone, cutoff);
      if (cancellations >= cancelThreshold) {
        return { ok: false, message: `Momentan nu poți rezerva online. Te rugăm să contactezi direct ${prof.telefon ?? "business-ul"}.` };
      }
    }
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

  const dataStart = startRequest;
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
      tenant_id: prof.id,
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
    const code = (ins as { code?: string } | null)?.code;
    if (code === "23P01") {
      return { ok: false, message: "Slotul nu mai e disponibil. Alege altă oră." };
    }
    return { ok: false, message: "Nu am putut crea programarea acum. Te rugăm să încerci din nou." };
  }

  return { ok: true, programareId: inserted.id };
}
