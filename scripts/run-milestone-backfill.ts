/**
 * Applies milestone backfill (same as 050_professional_milestones_backfill.sql) via service role.
 * Usage: tsx scripts/run-milestone-backfill.ts
 */
import { readFileSync } from "node:fs";

for (const envFile of [".env.local", ".env"]) {
  try {
    const lines = readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* skip */
  }
}

import { createClient } from "@supabase/supabase-js";

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: onboardingRows, error: onboardingSelectError } = await admin
    .from("profesionisti")
    .select("id, created_at")
    .gte("onboarding_pas", 4)
    .is("onboarding_completed_at", null);

  if (onboardingSelectError) {
    console.error("Select onboarding backfill failed:", onboardingSelectError.message);
    process.exit(1);
  }

  let onboardingUpdated = 0;
  for (const row of onboardingRows ?? []) {
    const completedAt = row.created_at ?? new Date().toISOString();
    const { error } = await admin
      .from("profesionisti")
      .update({
        onboarding_completed_at: completedAt,
        last_activity_at: completedAt
      })
      .eq("id", row.id)
      .is("onboarding_completed_at", null);

    if (!error) onboardingUpdated += 1;
    else console.warn(`Skip prof ${row.id}:`, error.message);
  }

  const { data: bookings, error: bookingsError } = await admin
    .from("programari")
    .select("profesionist_id, created_at")
    .eq("status", "confirmat")
    .order("created_at", { ascending: true });

  if (bookingsError) {
    console.error("Select bookings failed:", bookingsError.message);
    process.exit(1);
  }

  const firstByProf = new Map<string, string>();
  for (const row of bookings ?? []) {
    const profId = String(row.profesionist_id ?? "").trim();
    if (!profId || firstByProf.has(profId)) continue;
    firstByProf.set(profId, row.created_at);
  }

  let firstBookingUpdated = 0;
  for (const [profId, firstAt] of firstByProf) {
    const { data: existing } = await admin
      .from("profesionisti")
      .select("first_booking_at, last_activity_at")
      .eq("id", profId)
      .maybeSingle();

    if (existing?.first_booking_at) continue;

    const lastActivity =
      existing?.last_activity_at && new Date(existing.last_activity_at) > new Date(firstAt)
        ? existing.last_activity_at
        : firstAt;

    const { error } = await admin
      .from("profesionisti")
      .update({
        first_booking_at: firstAt,
        last_activity_at: lastActivity
      })
      .eq("id", profId)
      .is("first_booking_at", null);

    if (!error) firstBookingUpdated += 1;
    else console.warn(`Skip first_booking prof ${profId}:`, error.message);
  }

  const { count: profTotal } = await admin.from("profesionisti").select("id", { count: "exact", head: true });
  const { count: profOnboarded } = await admin
    .from("profesionisti")
    .select("id", { count: "exact", head: true })
    .not("onboarding_completed_at", "is", null);
  const { count: profFirstBooking } = await admin
    .from("profesionisti")
    .select("id", { count: "exact", head: true })
    .not("first_booking_at", "is", null);

  console.log("Milestone backfill complete.");
  console.log(`- onboarding_completed_at updated this run: ${onboardingUpdated}`);
  console.log(`- first_booking_at updated this run: ${firstBookingUpdated}`);
  console.log(`- profesionisti total: ${profTotal ?? 0}`);
  console.log(`- with onboarding_completed_at: ${profOnboarded ?? 0}`);
  console.log(`- with first_booking_at: ${profFirstBooking ?? 0}`);
}

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});
