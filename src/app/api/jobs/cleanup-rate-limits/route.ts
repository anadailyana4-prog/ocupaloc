import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { validateCronSecret } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  const configured = (process.env.RATE_LIMITS_CRON_SECRET || process.env.REMINDERS_CRON_SECRET || "").trim() || undefined;
  if (!validateCronSecret(req.headers, configured)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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
