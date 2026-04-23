import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createSupabaseServiceClient();
  const startedAt = Date.now();

  const [dbResult, bookingsResult] = await Promise.all([
    admin.from("profesionisti").select("id").limit(1),
    admin.from("programari").select("id").limit(1)
  ]);

  const dbOk = !dbResult.error;
  const bookingsOk = !bookingsResult.error;

  const checks = {
    db: dbOk,
    bookings: bookingsOk,
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    remindersSecretConfigured: Boolean(process.env.REMINDERS_CRON_SECRET?.trim()),
    bookingConfirmationSecretConfigured: Boolean(process.env.BOOKING_CONFIRMATION_SECRET?.trim())
  };

  const ok = Object.values(checks).every(Boolean);
  const status = ok ? 200 : 503;

  return NextResponse.json(
    {
      ok,
      checks,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      dbError: dbResult.error?.message ?? null
    },
    { status }
  );
}
