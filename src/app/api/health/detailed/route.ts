import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { validateCronSecret } from "@/lib/cron-auth";

function getHealthSecret(): string | undefined {
  const fromDedicated = process.env.HEALTHCHECK_SECRET?.trim();
  if (fromDedicated) {
    return fromDedicated;
  }

  const fromCron = process.env.REMINDERS_CRON_SECRET?.trim();
  return fromCron || undefined;
}

export async function GET(req: NextRequest) {
  if (!validateCronSecret(req.headers, getHealthSecret())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseServiceClient();
  const startedAt = Date.now();
  const [dbResult, bookingsResult] = await Promise.all([
    admin.from("profesionisti").select("id").limit(1),
    admin.from("programari").select("id").limit(1)
  ]);

  const checks = {
    db: !dbResult.error,
    bookings: !bookingsResult.error,
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    remindersSecretConfigured: Boolean(process.env.REMINDERS_CRON_SECRET?.trim()),
    bookingConfirmationSecretConfigured: Boolean(process.env.BOOKING_CONFIRMATION_SECRET?.trim()),
    stripeSecretConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    stripeWebhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    billingEnabled: process.env.BILLING_ENABLED === "true"
  };

  return NextResponse.json(
    {
      ok: Object.values(checks).every(Boolean),
      checks,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      dbError: dbResult.error?.message ?? null,
      bookingsError: bookingsResult.error?.message ?? null
    },
    { status: Object.values(checks).every(Boolean) ? 200 : 503 }
  );
}
