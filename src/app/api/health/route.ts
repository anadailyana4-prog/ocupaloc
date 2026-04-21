import { NextResponse } from "next/server";

import { buildPublicHealthPayload } from "@/lib/health/public-health";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const startedAt = Date.now();
  try {
    const admin = createSupabaseServiceClient();
    const { error } = await admin.from("profesionisti").select("id").limit(1);
    const ok = !error;
    return NextResponse.json(buildPublicHealthPayload(ok), { status: ok ? 200 : 503 });
  } catch {
    return NextResponse.json(buildPublicHealthPayload(false), { status: 503 });
  } finally {
    void startedAt;
  }
}
