import { NextRequest, NextResponse } from "next/server";

import { parseProgramJson } from "@/lib/program";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { computeFreeSlots } from "@/lib/slots";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import type { ProgramareRow } from "@/types/db";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("org") ?? "unknown").trim().toLowerCase();
  const admin = createSupabaseServiceClient();
  const rateLimit = await checkApiRateLimit(admin, `api:availability:${slug}:${ip}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ slots: [], error: "Too many requests" }, { status: 429 });
  }

  const slugParam = searchParams.get("org");
  const serviceId = searchParams.get("service");
  const date = searchParams.get("date");

  if (!slugParam || !serviceId || !date) {
    return NextResponse.json({ slots: [], error: "Parametri lipsă: org, service, date." }, { status: 400 });
  }

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRe.test(date)) {
    return NextResponse.json({ slots: [], error: "Format dată invalid (YYYY-MM-DD)." }, { status: 400 });
  }

  const { data: prof, error: profErr } = await admin.from("profesionisti").select("*").eq("slug", slugParam).maybeSingle();
  if (profErr || !prof) {
    return NextResponse.json({ slots: [], error: "Pagina nu există." }, { status: 404 });
  }

  const { data: srv, error: srvErr } = await admin
    .from("servicii")
    .select("*")
    .eq("id", serviceId)
    .eq("profesionist_id", prof.id)
    .eq("activ", true)
    .maybeSingle();
  if (srvErr || !srv) {
    return NextResponse.json({ slots: [], error: "Serviciu invalid." }, { status: 400 });
  }

  const startDay = `${date}T00:00:00.000Z`;
  const endDay = `${date}T23:59:59.999Z`;
  const { data: progs, error } = await admin
    .from("programari")
    .select("data_start,data_final")
    .eq("profesionist_id", prof.id)
    .neq("status", "anulat")
    .lt("data_start", endDay)
    .gt("data_final", startDay);
  if (error) {
    return NextResponse.json({ slots: [], error: error.message }, { status: 500 });
  }

  const ocupate = (progs ?? []).map((p: Pick<ProgramareRow, "data_start" | "data_final">) => ({
    start: new Date(p.data_start),
    end: new Date(p.data_final)
  }));
  const slots = computeFreeSlots(
    date,
    parseProgramJson(prof.program),
    srv.durata_minute,
    prof.pauza_intre_clienti,
    prof.lucreaza_acasa ? prof.timp_pregatire : 0,
    ocupate
  );

  return NextResponse.json({
    slots: slots.map((slot) => ({
      staff_id: prof.user_id,
      start_time: slot.toISOString(),
      end_time: new Date(slot.getTime() + srv.durata_minute * 60_000).toISOString()
    })),
    error: null
  });
}
