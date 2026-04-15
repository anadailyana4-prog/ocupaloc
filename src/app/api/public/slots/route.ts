import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { parseProgramJson } from "@/lib/program";
import { computeFreeSlots } from "@/lib/slots";
import type { ProgramareRow } from "@/types/db";

const RATE_LIMIT = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = RATE_LIMIT.get(ip);

  if (!record || now > record.reset) {
    RATE_LIMIT.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) return false;

  record.count += 1;
  return true;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  const serviciuId = req.nextUrl.searchParams.get("serviciuId");
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!slug || !serviciuId || !dateStr) {
    return NextResponse.json({ error: "Parametri lipsă." }, { status: 400 });
  }

  try {
    const admin = createSupabaseServiceClient();
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
