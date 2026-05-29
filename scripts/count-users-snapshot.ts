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

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase env.");
    process.exit(1);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const [{ count: profTotal }, { count: bookings }, { count: subsCount }, { count: demos }] = await Promise.all([
    admin.from("profesionisti").select("id", { count: "exact", head: true }),
    admin.from("programari").select("id", { count: "exact", head: true }),
    admin.from("subscriptions").select("id", { count: "exact", head: true }),
    admin.from("demos").select("id", { count: "exact", head: true })
  ]);

  const auth = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (auth.error) {
    console.error(auth.error.message);
    process.exit(1);
  }

  const { data: profs } = await admin
    .from("profesionisti")
    .select("id, nume_business, slug, created_at, onboarding_pas, onboarding_completed_at, user_id")
    .order("created_at", { ascending: false });

  const { data: subs } = await admin.from("subscriptions").select("profesionist_id, status, current_period_end");

  console.log("--- OcupaLoc user snapshot ---");
  console.log(`Auth accounts (Supabase): ${auth.data.users.length}`);
  console.log(`Profesionisti (business profiles): ${profTotal ?? 0}`);
  console.log(`Programari: ${bookings ?? 0}`);
  console.log(`Subscriptions rows: ${subsCount ?? 0}`);
  console.log(`Demos create: ${demos ?? 0}`);
  console.log("");

  if (profs?.length) {
    console.log("Profesionisti:");
    for (const p of profs) {
      const sub = subs?.find((s) => s.profesionist_id === p.id);
      console.log(
        `  - ${p.nume_business} | slug: ${p.slug} | onboarding pas ${p.onboarding_pas ?? "?"} | done: ${p.onboarding_completed_at ? "da" : "nu"} | sub: ${sub?.status ?? "none"} | created ${String(p.created_at).slice(0, 10)}`
      );
    }
  }

  if (auth.data.users.length) {
    console.log("");
    console.log("Auth users (email only):");
    for (const u of auth.data.users) {
      console.log(`  - ${u.email ?? "(no email)"} | confirmed: ${u.email_confirmed_at ? "da" : "nu"} | created ${u.created_at?.slice(0, 10)}`);
    }
  }
}

void main();
