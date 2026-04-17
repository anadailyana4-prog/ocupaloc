import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { normalizeBookingSlug } from "@/lib/booking/normalize-booking-slug";
import { parseProgramJson } from "@/lib/program";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { computeFreeSlots } from "@/lib/slots";
import type { ProgramareRow } from "@/types/db";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const slugRaw = req.nextUrl.searchParams.get("slug");
  const normalizedSlug = normalizeBookingSlug(slugRaw ?? "unknown");
  const admin = createSupabaseServiceClient();
  const rateLimit = await checkApiRateLimit(admin, `api:public-slots:${normalizedSlug}:${ip}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const slug = slugRaw ? normalizeBookingSlug(slugRaw) : null;
  const serviciuId = req.nextUrl.searchParams.get("serviciuId");
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!slug || !serviciuId || !dateStr) {
    return NextResponse.json({ error: "Parametri lipsă." }, { status: 400 });
  }

  try {
    const { data: prof, error: e1 } = await admin.from("profesionisti").select("*").eq("slug", slug).maybeSingle();
    if (e1 || !prof) {
      return NextResponse.json({ error: "Pagina nu există." }, { status: 404 });
    }

    const { data: srv, error: e2 } = await admin
      .from("servicii")
      .select("*")
      .eq("id", serviciuId)
      .eq("profesionist_id", prof.id)
      .eq("activ", true)
      .maybeSingle();
    if (e2 || !srv) {
      return NextResponse.json({ error: "Serviciu invalid." }, { status: 400 });
    }

    const program = parseProgramJson(prof.program);
    const startDay = `${dateStr}T00:00:00.000Z`;
    const endDay = `${dateStr}T23:59:59.999Z`;

    const { data: progs } = await admin
      .from("programari")
      .select("data_start,data_final,status")
      .eq("profesionist_id", prof.id)
      .neq("status", "anulat")
      .lt("data_start", endDay)
      .gt("data_final", startDay);

    const ocupate = (progs ?? []).map((p: Pick<ProgramareRow, "data_start" | "data_final">) => ({
      start: new Date(p.data_start),
      end: new Date(p.data_final)
    }));

    const slots = computeFreeSlots(
      dateStr,
      program,
      srv.durata_minute,
      prof.pauza_intre_clienti,
      prof.lucreaza_acasa ? prof.timp_pregatire : 0,
      ocupate
    );

    return NextResponse.json({
      slots: slots.map((d) => d.toISOString())
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare server.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
