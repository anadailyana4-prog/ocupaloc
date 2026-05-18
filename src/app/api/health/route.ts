import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createSupabaseServiceClient();
  const startedAt = Date.now();

  const { error } = await admin.from("profesionisti").select("id").limit(1);
  const ok = !error;
  const status = ok ? 200 : 503;

  return NextResponse.json(
    {
      ok,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}
