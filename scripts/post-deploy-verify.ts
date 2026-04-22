/**
 * post-deploy-verify.ts
 *
 * Post-deploy verification for migrations 025 + 026 (enterprise multi-tenant alignment).
 * Runs SQL checks via Supabase service role + HTTP checks against the live/staging app.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   VERIFY_BASE_URL=https://www.ocupaloc.ro \
 *   VERIFY_PUBLIC_SLUG=<slug> \
 *   tsx scripts/post-deploy-verify.ts
 *
 * Optional:
 *   VERIFY_SKIP_HTTP=1   — skip HTTP checks (SQL only)
 *   VERIFY_SKIP_SQL=1    — skip SQL checks (HTTP only)
 *   VERIFY_PHASE=025     — only run 025 checks (before 026 is applied)
 *   VERIFY_PHASE=026     — only run 026 checks
 *   VERIFY_PHASE=all     — run all checks (default)
 *   VERIFY_PUBLIC_SERVICE_ID=<uuid> — enables strict /api/public/slots check
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckResult = {
  name: string;
  phase: "025" | "026" | "http";
  ok: boolean;
  details?: string;
};

type PolicyRow = { tablename: string; policyname: string; cmd: string };
type NullCountRow = { tbl: string; nulls: number; total: number };
type DriftRow = { tbl: string; drift: number };
type FkRow = { tbl: string; orphans: number };
type ProcRow = { proname: string; pronargs: number };
type RoleRow = { invalid_roles: number };
type MemberlessRow = { tenants_without_members: number };
type ColumnRow = { column_name: string };

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = (process.env.VERIFY_BASE_URL ?? "https://www.ocupaloc.ro").replace(/\/$/, "");
const PUBLIC_SLUG = process.env.VERIFY_PUBLIC_SLUG ?? "";
const PUBLIC_SERVICE_ID = process.env.VERIFY_PUBLIC_SERVICE_ID ?? "";
const SKIP_HTTP = process.env.VERIFY_SKIP_HTTP === "1";
const SKIP_SQL = process.env.VERIFY_SKIP_SQL === "1";
const PHASE = (process.env.VERIFY_PHASE ?? "all") as "025" | "026" | "all";

const BUSINESS_TABLES = [
  "servicii",
  "programari",
  "clienti_bocati",
  "programari_reminders",
  "programari_status_events",
] as const;

// ─── Output helpers ───────────────────────────────────────────────────────────

const results: CheckResult[] = [];

function pass(phase: CheckResult["phase"], name: string, details?: string): void {
  results.push({ phase, name, ok: true, details });
  const suffix = details ? ` (${details})` : "";
  console.log(`  ✅ [${phase}] ${name}${suffix}`);
}

function fail(phase: CheckResult["phase"], name: string, details: string): void {
  results.push({ phase, name, ok: false, details });
  console.error(`  ❌ [${phase}] ${name} — ${details}`);
}

function section(title: string): void {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
}

// ─── SQL helpers ──────────────────────────────────────────────────────────────

/**
 * Run a raw SQL query via the Supabase PostgREST /rpc endpoint.
 * Requires a helper function `exec_sql(query text)` to exist in the DB,
 * OR falls back to querying system catalog views directly via .from().
 *
 * For this script we use .from() on system views and information_schema
 * since Supabase service role can access them directly.
 */
async function querySystemView<T>(
  supabase: SupabaseClient,
  view: string,
  columns: string,
  filter?: (q: any) => any
): Promise<{ data: T[] | null; error: Error | null }> {
  let q: any = supabase.from(view).select(columns);
  if (filter) q = filter(q) as typeof q;
  const { data, error } = await q;
  return { data: data as T[] | null, error: error ? new Error(error.message) : null };
}

// ─── SQL Checks: Phase 025 ────────────────────────────────────────────────────

async function check025TenantIdColumns(supabase: SupabaseClient): Promise<void> {
  section("025 — tenant_id column presence");

  for (const tbl of BUSINESS_TABLES) {
    const { data, error } = await querySystemView<ColumnRow>(
      supabase,
      "information_schema.columns",
      "column_name",
      (q) => q.eq("table_schema", "public").eq("table_name", tbl).eq("column_name", "tenant_id")
    );
    if (error) {
      fail("025", `tenant_id column on ${tbl}`, error.message);
    } else if (!data || data.length === 0) {
      fail("025", `tenant_id column on ${tbl}`, "column not found — migration 025 not applied");
    } else {
      pass("025", `tenant_id column on ${tbl}`);
    }
  }
}

async function check025NullCounts(supabase: SupabaseClient): Promise<void> {
  section("025 — NULL counts on tenant_id");

  for (const tbl of BUSINESS_TABLES) {
    // Query the table directly: count rows where tenant_id IS NULL
    const { data, error } = await supabase
      .from(tbl)
      .select("id", { count: "exact", head: true })
      .is("tenant_id", null);

    if (error) {
      // If error mentions "column does not exist", migration 025 wasn't applied
      if (error.message.includes("does not exist")) {
        fail("025", `null tenant_id on ${tbl}`, "column tenant_id missing — 025 not applied");
      } else {
        fail("025", `null tenant_id on ${tbl}`, error.message);
      }
    } else {
      const nullCount = (data as unknown as { count?: number } | null)?.count ?? 0;
      // Supabase returns count in the response header; use count option above
      // Re-query with count
      const { count, error: e2 } = await supabase
        .from(tbl)
        .select("*", { count: "exact", head: true })
        .is("tenant_id", null);
      if (e2) {
        fail("025", `null tenant_id on ${tbl}`, e2.message);
      } else if ((count ?? 0) > 0) {
        fail("025", `null tenant_id on ${tbl}`, `${count} rows with NULL — backfill incomplete`);
      } else {
        pass("025", `null tenant_id on ${tbl}`, "0 NULLs");
      }
    }
  }
}

async function check025Drift(supabase: SupabaseClient): Promise<void> {
  section("025 — Drift check (tenant_id == profesionist_id)");

  for (const tbl of BUSINESS_TABLES) {
    // We can't do != comparison directly via Supabase client for two columns,
    // so we check via the sync constraint existence in pg_constraint.
    const { data, error } = await querySystemView<{ constraint_name: string }>(
      supabase,
      "information_schema.table_constraints",
      "constraint_name",
      (q) =>
        q
          .eq("table_schema", "public")
          .eq("table_name", tbl)
          .like("constraint_name", `%_tenant_profesionist_sync_chk`)
    );
    if (error) {
      fail("025", `sync constraint on ${tbl}`, error.message);
    } else if (!data || data.length === 0) {
      fail(
        "025",
        `sync constraint on ${tbl}`,
        "constraint not found — either 025 not applied or constraint was dropped"
      );
    } else {
      pass("025", `sync constraint on ${tbl}`, data[0].constraint_name);
    }
  }
}

async function check025FKs(supabase: SupabaseClient): Promise<void> {
  section("025 — FK constraints to tenants(id)");

  const expectedFKs = BUSINESS_TABLES.map((t) => `${t}_tenant_id_fkey`);
  for (const fkName of expectedFKs) {
    const tbl = fkName.replace("_tenant_id_fkey", "");
    const { data, error } = await querySystemView<{ constraint_name: string }>(
      supabase,
      "information_schema.table_constraints",
      "constraint_name",
      (q) =>
        q
          .eq("table_schema", "public")
          .eq("table_name", tbl)
          .eq("constraint_name", fkName)
          .eq("constraint_type", "FOREIGN KEY")
    );
    if (error) {
      fail("025", `FK ${fkName}`, error.message);
    } else if (!data || data.length === 0) {
      fail("025", `FK ${fkName}`, "FK not found — migration 025 not complete");
    } else {
      pass("025", `FK ${fkName}`);
    }
  }
}

// ─── SQL Checks: Phase 026 ────────────────────────────────────────────────────

async function check026Function(supabase: SupabaseClient): Promise<void> {
  section("026 — has_tenant_role() function");

  const { data, error } = await querySystemView<{ routine_name: string }>(
    supabase,
    "information_schema.routines",
    "routine_name",
    (q) =>
      q
        .eq("routine_schema", "public")
        .eq("routine_name", "has_tenant_role")
        .eq("routine_type", "FUNCTION")
  );
  if (error) {
    fail("026", "has_tenant_role function", error.message);
  } else if (!data || data.length === 0) {
    fail("026", "has_tenant_role function", "function not found — migration 026 not applied");
  } else {
    pass("026", "has_tenant_role function", "exists");
  }
}

async function check026Policies(supabase: SupabaseClient): Promise<void> {
  section("026 — Membership-first RLS policies");

  const expectedPolicies: Array<{ tablename: string; policyname: string }> = [
    { tablename: "servicii", policyname: "servicii_select_member" },
    { tablename: "servicii", policyname: "servicii_insert_member" },
    { tablename: "servicii", policyname: "servicii_update_member" },
    { tablename: "servicii", policyname: "servicii_delete_member" },
    { tablename: "programari", policyname: "programari_select_member" },
    { tablename: "programari", policyname: "programari_update_member" },
    { tablename: "programari", policyname: "programari_delete_member" },
    { tablename: "programari", policyname: "programari_insert_public" },
    { tablename: "clienti_bocati", policyname: "clienti_bocati_select_owner_manager" },
    { tablename: "clienti_bocati", policyname: "clienti_bocati_insert_owner_manager" },
    { tablename: "clienti_bocati", policyname: "clienti_bocati_delete_owner_manager" },
    { tablename: "profesionisti", policyname: "profesionisti_update_owner_manager" },
  ];

  const { data: allPolicies, error } = await querySystemView<PolicyRow>(
    supabase,
    "pg_policies",
    "tablename,policyname,cmd",
    (q) =>
      q.in(
        "tablename",
        Array.from(new Set(expectedPolicies.map((p) => p.tablename)))
      )
  );

  if (error) {
    fail("026", "fetch pg_policies", error.message);
    return;
  }

  const policySet = new Set((allPolicies ?? []).map((p) => `${p.tablename}::${p.policyname}`));

  for (const { tablename, policyname } of expectedPolicies) {
    const key = `${tablename}::${policyname}`;
    if (policySet.has(key)) {
      pass("026", `policy ${policyname} on ${tablename}`);
    } else {
      fail("026", `policy ${policyname} on ${tablename}`, "policy not found — 026 not applied");
    }
  }
}

async function check026OldPoliciesDropped(supabase: SupabaseClient): Promise<void> {
  section("026 — Old owner-centric policies removed");

  const droppedPolicies = [
    "servicii_select_owner",
    "servicii_insert_owner",
    "servicii_update_owner",
    "servicii_delete_owner",
    "programari_select_owner",
    "programari_update_owner",
    "programari_delete_owner",
    "profesionisti_update_owner",
  ];

  const { data, error } = await querySystemView<PolicyRow>(
    supabase,
    "pg_policies",
    "tablename,policyname",
    (q) => q.in("policyname", droppedPolicies)
  );

  if (error) {
    fail("026", "check old policies absent", error.message);
    return;
  }

  const remaining = (data ?? []).map((p) => `${p.tablename}.${p.policyname}`);
  if (remaining.length > 0) {
    fail(
      "026",
      "old owner-centric policies removed",
      `still present: ${remaining.join(", ")}`
    );
  } else {
    pass("026", "old owner-centric policies removed", "none found");
  }
}

async function check026RoleConstraint(supabase: SupabaseClient): Promise<void> {
  section("026 — memberships role constraint");

  const { data, error } = await querySystemView<{ constraint_name: string }>(
    supabase,
    "information_schema.table_constraints",
    "constraint_name",
    (q) =>
      q
        .eq("table_schema", "public")
        .eq("table_name", "memberships")
        .eq("constraint_name", "memberships_role_allowed_chk")
  );
  if (error) {
    fail("026", "memberships_role_allowed_chk constraint", error.message);
  } else if (!data || data.length === 0) {
    fail("026", "memberships_role_allowed_chk constraint", "not found — 026 not applied");
  } else {
    pass("026", "memberships_role_allowed_chk constraint");
  }

  // Also verify no invalid role values exist
  const { count, error: e2 } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .not("role", "in", '("owner","manager","staff")');
  if (e2) {
    fail("026", "memberships invalid role values", e2.message);
  } else if ((count ?? 0) > 0) {
    fail("026", "memberships invalid role values", `${count} rows with invalid role`);
  } else {
    pass("026", "memberships invalid role values", "0 invalid roles");
  }
}

async function check026MemberlessTenants(supabase: SupabaseClient): Promise<void> {
  section("026 — No memberless tenants");

  // Get all tenant IDs
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, slug");
  if (tenantsError) {
    fail("026", "tenants reachable", tenantsError.message);
    return;
  }
  if (!tenants || tenants.length === 0) {
    fail("026", "tenants exist", "no rows in tenants table — DB may be empty");
    return;
  }
  pass("026", "tenants table reachable", `${tenants.length} tenants`);

  // Check each tenant has at least one membership
  const tenantIds = tenants.map((t) => t.id as string);
  const { data: memberships, error: memError } = await supabase
    .from("memberships")
    .select("tenant_id, role")
    .in("tenant_id", tenantIds);
  if (memError) {
    fail("026", "memberships reachable", memError.message);
    return;
  }

  const coveredTenants = new Set((memberships ?? []).map((m) => m.tenant_id as string));
  const memberless = tenants.filter((t) => !coveredTenants.has(t.id as string));
  if (memberless.length > 0) {
    fail(
      "026",
      "no memberless tenants",
      `tenants without membership: ${memberless.map((t) => t.slug).join(", ")}`
    );
  } else {
    pass("026", "no memberless tenants", `all ${tenants.length} tenants have membership`);
  }
}

// ─── HTTP Checks ──────────────────────────────────────────────────────────────

async function httpGet(url: string, description: string): Promise<void> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (res.ok) {
      pass("http", description, `${res.status} ${res.url !== url ? `→ ${res.url}` : ""}`);
    } else {
      fail("http", description, `HTTP ${res.status} for ${url}`);
    }
  } catch (e) {
    fail("http", description, `fetch error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function httpPost(
  url: string,
  body: Record<string, unknown>,
  description: string,
  expectedStatus: number
): Promise<void> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    if (res.status === expectedStatus) {
      pass("http", description, `HTTP ${res.status}`);
    } else {
      // Read body for useful error detail
      const text = await res.text().catch(() => "");
      const snippet = text.slice(0, 200).replace(/\n/g, " ");
      fail("http", description, `expected ${expectedStatus}, got ${res.status} — ${snippet}`);
    }
  } catch (e) {
    fail("http", description, `fetch error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function httpGetPublicSlots(url: string, description: string): Promise<void> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    if (res.status !== 200) {
      const text = await res.text().catch(() => "");
      const snippet = text.slice(0, 200).replace(/\n/g, " ");
      fail("http", description, `expected 200, got ${res.status} — ${snippet}`);
      return;
    }

    const payload = (await res.json().catch(() => null)) as { slots?: unknown } | null;
    const slots = payload?.slots;
    const isValidSlots = Array.isArray(slots) && slots.every((s) => typeof s === "string");
    if (!isValidSlots) {
      fail("http", description, "invalid JSON shape — expected { slots: string[] }");
      return;
    }

    pass("http", description, `HTTP 200 with ${slots.length} slots`);
  } catch (e) {
    fail("http", description, `fetch error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function runHttpChecks(): Promise<void> {
  section("HTTP — Public routes");

  if (!PUBLIC_SLUG) {
    console.warn("  ⚠️  VERIFY_PUBLIC_SLUG not set — skipping slug-specific checks");
  }

  // 1. Login page (sanity — must return 200)
  await httpGet(`${BASE_URL}/login`, "GET /login");

  // 2. Public profile page
  if (PUBLIC_SLUG) {
    await httpGet(`${BASE_URL}/s/${PUBLIC_SLUG}`, `GET /s/${PUBLIC_SLUG}`);
  }

  // 3. Public slots API
  if (PUBLIC_SLUG) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    if (PUBLIC_SERVICE_ID) {
      await httpGetPublicSlots(
        `${BASE_URL}/api/public/slots?slug=${encodeURIComponent(PUBLIC_SLUG)}&serviciuId=${encodeURIComponent(PUBLIC_SERVICE_ID)}&date=${dateStr}`,
        `GET /api/public/slots?slug=${PUBLIC_SLUG}&serviciuId=${PUBLIC_SERVICE_ID}&date=${dateStr}`
      );
    } else {
      console.warn(
        "  ⚠️  VERIFY_PUBLIC_SERVICE_ID not set — skipping strict /api/public/slots check (endpoint requires serviciuId)."
      );
    }
  }

  // 4. POST /api/book — minimal payload; expect 400 (missing required fields)
  //    so we know the endpoint is alive and RLS isn't blocking the route itself.
  //    A 400 with validation error is correct; 500 would indicate a server/RLS failure.
  await httpPost(
    `${BASE_URL}/api/book`,
    { _probe: true },
    "POST /api/book (probe — expect 400 not 500)",
    400
  );

  // 5. Tenant dashboard redirect (unauthenticated → login redirect, expect 200 or 3xx handled)
  //    We check that /t/* doesn't throw a 500.
  if (PUBLIC_SLUG) {
    try {
      const res = await fetch(`${BASE_URL}/t/${PUBLIC_SLUG}/dashboard`, {
        method: "GET",
        redirect: "manual", // don't follow, just check it's not 500
      });
      if (res.status >= 500) {
        fail("http", `GET /t/${PUBLIC_SLUG}/dashboard (unauthenticated)`, `HTTP ${res.status} — server error`);
      } else {
        pass(
          "http",
          `GET /t/${PUBLIC_SLUG}/dashboard (unauthenticated)`,
          `HTTP ${res.status} (redirect to login expected)`
        );
      }
    } catch (e) {
      fail(
        "http",
        `GET /t/${PUBLIC_SLUG}/dashboard (unauthenticated)`,
        `fetch error: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run(): Promise<number> {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  post-deploy-verify — enterprise multi-tenant alignment");
  console.log(`  phase: ${PHASE} | base: ${BASE_URL} | slug: ${PUBLIC_SLUG || "(not set)"}`);
  console.log("═══════════════════════════════════════════════════════════════");

  // ── Env guard ────────────────────────────────────────────────────────────
  if (!SKIP_SQL) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error(
        "❌ SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set."
      );
      console.error(
        "   Export them or prefix the command:\n" +
          "   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... tsx scripts/post-deploy-verify.ts"
      );
      return 1;
    }
  }

  // ── SQL checks ───────────────────────────────────────────────────────────
  if (!SKIP_SQL) {
    const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (PHASE === "025" || PHASE === "all") {
      await check025TenantIdColumns(supabase);
      await check025NullCounts(supabase);
      await check025FKs(supabase);
      await check025Drift(supabase);
    }

    if (PHASE === "026" || PHASE === "all") {
      await check026Function(supabase);
      await check026Policies(supabase);
      await check026OldPoliciesDropped(supabase);
      await check026RoleConstraint(supabase);
      await check026MemberlessTenants(supabase);
    }
  }

  // ── HTTP checks ──────────────────────────────────────────────────────────
  if (!SKIP_HTTP) {
    await runHttpChecks();
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`  Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.log("\n  Failed checks:");
    results
      .filter((r) => !r.ok)
      .forEach((r) => console.error(`    ❌ [${r.phase}] ${r.name}: ${r.details ?? ""}`));
    console.log("═══════════════════════════════════════════════════════════════\n");
    return 1;
  }

  console.log("  All checks passed ✅");
  console.log("═══════════════════════════════════════════════════════════════\n");
  return 0;
}

run()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("❌ post-deploy-verify crashed:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
