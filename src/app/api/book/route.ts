import { formatInTimeZone } from "date-fns-tz";
import { NextResponse } from "next/server";
import { z } from "zod";

import { insertProgramareForProfSlug } from "@/lib/booking/insert-programare";
import { notifyProfesionistDespreProgramare } from "@/lib/email/programare-notify";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const TZ = "Europe/Bucharest";
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

const bodySchema = z.object({
  orgSlug: z.string().min(1).max(64),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  startTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "startTime invalid."),
  clientName: z.string().min(2, "Numele e prea scurt."),
  clientPhone: z.string().min(8, "Introdu un număr de telefon valid.")
});

/**
 * Rezervare JSON (ex. BookingCard tenant): slug = profesionist.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body JSON invalid." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { orgSlug, serviceId, startTime, clientName, clientPhone } = parsed.data;
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ success: false, error: "startTime invalid." }, { status: 400 });
  }

  const dateStr = formatInTimeZone(start, TZ, "yyyy-MM-dd");

  try {
    const admin = createSupabaseServiceClient();
    const res = await insertProgramareForProfSlug(admin, {
      slug: orgSlug.trim().toLowerCase(),
      serviciuId: serviceId,
      dateStr,
      slotIso: start.toISOString(),
      numeClient: clientName.trim(),
      telefonClient: clientPhone.trim(),
      emailClient: null
    });

    if (!res.ok) {
      const isBlock = res.message.includes("Ne pare rău");
      return NextResponse.json(
        { success: false, error: res.message },
        { status: isBlock ? 403 : res.message.includes("disponibil") ? 409 : 400 }
      );
    }

    const notifyRes = await notifyProfesionistDespreProgramare(res.programareId);
    void notifyRes;

    return NextResponse.json({ success: true, error: null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare server.";
    console.error("[api/book]", e);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
