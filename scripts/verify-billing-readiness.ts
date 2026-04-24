import { createClient } from "@supabase/supabase-js";

type CheckResult = {
  name: string;
  ok: boolean;
  details?: string;
};

const REQUIRED_COLUMNS = [
  "id",
  "profesionist_id",
  "stripe_subscription_id",
  "stripe_customer_id",
  "status",
  "current_period_end",
  "cancel_at_period_end",
  "updated_at"
] as const;

function logResult(result: CheckResult) {
  const icon = result.ok ? "OK" : "FAIL";
  const extra = result.details ? ` - ${result.details}` : "";
  console.log(`${icon} ${result.name}${extra}`);
}

async function run(): Promise<number> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logResult({
      name: "Environment variables",
      ok: false,
      details: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    });
    return 1;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const results: CheckResult[] = [];

  try {
    const { data: tables, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "subscriptions")
      .eq("table_type", "BASE TABLE");

    if (tableError) {
      results.push({ name: "subscriptions table exists", ok: false, details: tableError.message });
    } else {
      results.push({
        name: "subscriptions table exists",
        ok: Boolean(tables && tables.length > 0)
      });
    }

    const { data: columns, error: columnError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "subscriptions");

    if (columnError) {
      results.push({ name: "subscriptions required columns", ok: false, details: columnError.message });
    } else {
      const present = new Set((columns ?? []).map((row) => String((row as { column_name: string }).column_name)));
      const missing = REQUIRED_COLUMNS.filter((c) => !present.has(c));
      results.push({
        name: "subscriptions required columns",
        ok: missing.length === 0,
        details: missing.length ? `Missing: ${missing.join(", ")}` : undefined
      });
    }

    const { data: indexes, error: indexError } = await supabase
      .from("pg_catalog.pg_indexes")
      .select("indexname")
      .eq("schemaname", "public")
      .eq("tablename", "subscriptions");

    if (indexError) {
      results.push({ name: "subscriptions key indexes", ok: false, details: indexError.message });
    } else {
      const indexNames = new Set((indexes ?? []).map((row) => String((row as { indexname: string }).indexname)));
      const requiredIndexes = [
        "subscriptions_profesionist_id_idx",
        "subscriptions_stripe_customer_id_idx",
        "subscriptions_status_idx"
      ];
      const missingIndexes = requiredIndexes.filter((idx) => !indexNames.has(idx));
      results.push({
        name: "subscriptions key indexes",
        ok: missingIndexes.length === 0,
        details: missingIndexes.length ? `Missing: ${missingIndexes.join(", ")}` : undefined
      });
    }

    const { data: rlsRows, error: rlsError } = await supabase
      .from("pg_catalog.pg_class")
      .select("relname, relrowsecurity")
      .eq("relname", "subscriptions")
      .limit(1);

    if (rlsError) {
      results.push({ name: "subscriptions RLS enabled", ok: false, details: rlsError.message });
    } else {
      const row = (rlsRows?.[0] as { relrowsecurity?: boolean } | undefined) ?? undefined;
      results.push({ name: "subscriptions RLS enabled", ok: Boolean(row?.relrowsecurity) });
    }

    // Migration mapping check (old numbering 023/024 -> current 017/018)
    const { data: migrationRows, error: migrationError } = await supabase
      .from("supabase_migrations.schema_migrations")
      .select("version")
      .in("version", ["017", "018"]);

    if (migrationError) {
      results.push({
        name: "billing migration versions recorded",
        ok: false,
        details: migrationError.message
      });
    } else {
      const versions = new Set((migrationRows ?? []).map((row) => String((row as { version: string }).version)));
      const missingVersions = ["017", "018"].filter((v) => !versions.has(v));
      results.push({
        name: "billing migration versions recorded",
        ok: missingVersions.length === 0,
        details: missingVersions.length ? `Missing versions: ${missingVersions.join(", ")}` : undefined
      });
    }
  } catch (error) {
    results.push({
      name: "unexpected runtime error",
      ok: false,
      details: error instanceof Error ? error.message : String(error)
    });
  }

  results.forEach(logResult);
  return results.every((r) => r.ok) ? 0 : 1;
}

run()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    console.error("FAIL verify-billing-readiness crashed", error);
    process.exit(1);
  });
