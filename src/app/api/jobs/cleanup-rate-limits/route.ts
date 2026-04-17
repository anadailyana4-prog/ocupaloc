import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

export async function GET(req: NextRequest) {
  const configured = (process.env.RATE_LIMITS_CRON_SECRET || process.env.REMINDERS_CRON_SECRET || "").trim();

  if (!configured && process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "RATE_LIMITS_CRON_SECRET is not configured" }, { status: 500 });
  }

  if (configured) {
    const customHeaderToken = req.headers.get("x-cron-secret")?.trim();
    const bearerToken = extractBearerToken(req.headers.get("authorization"));
    const token = customHeaderToken || bearerToken;
    if (!token || token !== configured) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createSupabaseServiceClient();
  const { data, error } = await admin.rpc("cleanup_api_rate_limits", {
    p_keep_for_seconds: 3600
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: Number(data ?? 0),
    ranAt: new Date().toISOString()
  });
}
