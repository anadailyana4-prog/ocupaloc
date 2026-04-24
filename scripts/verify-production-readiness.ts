import { createClient } from "@supabase/supabase-js";

type CheckResult = {
  name: string;
  ok: boolean;
  details?: string;
};

type ConstraintRow = { constraint_name: string };
type RlsRow = { relname: string; relrowsecurity: boolean };

const REQUIRED_TABLES = ["profesionisti", "servicii", "programari", "profiles", "clienti_blocati", "subscriptions"] as const;
const DEPRECATED_TABLES = ["organizations", "appointments", "availability_rules", "blocked_slots"] as const;
const REQUIRED_PROFILE_COLUMNS = ["id", "full_name", "phone", "role"] as const;
const REQUIRED_RLS_TABLES = ["profesionisti", "servicii", "programari", "subscriptions"] as const;

function logResult(result: CheckResult) {
  const icon = result.ok ? "✅" : "❌";
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
      details: "Lipsesc SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY."
    });
    return 1;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const results: CheckResult[] = [];

  try {
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_type", "BASE TABLE");

    if (tablesError) {
      results.push({
        name: "Fetch public tables",
        ok: false,
        details: tablesError.message
      });
      results.forEach(logResult);
      return 1;
    }

    const tableNames = new Set((tables ?? []).map((row) => String(row.table_name)));
    const missingRequired = REQUIRED_TABLES.filter((name) => !tableNames.has(name));
    const existingDeprecated = DEPRECATED_TABLES.filter((name) => tableNames.has(name));
    const extras = [...tableNames].filter(
      (table) => !REQUIRED_TABLES.includes(table as (typeof REQUIRED_TABLES)[number])
    );

    results.push({
      name: "Required public tables exist",
      ok: missingRequired.length === 0,
      details: missingRequired.length ? `Lipsesc: ${missingRequired.join(", ")}` : undefined
    });
    results.push({
      name: "Deprecated tables absent",
      ok: existingDeprecated.length === 0,
      details: existingDeprecated.length ? `Găsite: ${existingDeprecated.join(", ")}` : undefined
    });
    results.push({
      name: "Only expected public tables exist",
      ok: extras.length === 0,
      details: extras.length ? `Tabele extra: ${extras.sort().join(", ")}` : undefined
    });

    const { data: profileColumns, error: profileError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "profiles");
    if (profileError) {
      results.push({
        name: "profiles required columns",
        ok: false,
        details: profileError.message
      });
    } else {
      const profileColumnNames = new Set((profileColumns ?? []).map((row) => String(row.column_name)));
      const missingColumns = REQUIRED_PROFILE_COLUMNS.filter((name) => !profileColumnNames.has(name));
      results.push({
        name: "profiles has id/full_name/phone/role",
        ok: missingColumns.length === 0,
        details: missingColumns.length ? `Lipsesc: ${missingColumns.join(", ")}` : undefined
      });
    }

    const [{ data: fkColumns, error: fkColumnsError }, { data: fkRefs, error: fkRefsError }] = await Promise.all([
      supabase
        .from("information_schema.key_column_usage")
        .select("constraint_name, table_name, column_name, table_schema")
        .eq("table_schema", "public")
        .eq("table_name", "programari")
        .eq("column_name", "profesionist_id"),
      supabase
        .from("information_schema.constraint_column_usage")
        .select("constraint_name, table_name, column_name, table_schema")
        .eq("table_schema", "public")
        .eq("table_name", "profesionisti")
        .eq("column_name", "id")
    ]);

    if (fkColumnsError || fkRefsError) {
      results.push({
        name: "programari FK to profesionisti",
        ok: false,
        details: fkColumnsError?.message ?? fkRefsError?.message
      });
    } else {
      const left = new Set((fkColumns as ConstraintRow[] | null | undefined ?? []).map((row) => String(row.constraint_name)));
      const right = new Set((fkRefs as ConstraintRow[] | null | undefined ?? []).map((row) => String(row.constraint_name)));
      const hasProfFk = [...left].some((constraintName) => right.has(constraintName));
      results.push({
        name: "programari FK points to profesionisti",
        ok: hasProfFk
      });
    }

    const { data: rlsRows, error: rlsError } = await supabase
      .from("pg_catalog.pg_class")
      .select("relname, relrowsecurity")
      .in("relname", [...REQUIRED_RLS_TABLES]);

    if (rlsError) {
      results.push({
        name: "RLS enabled on required tables",
        ok: false,
        details: rlsError.message
      });
    } else {
      const rlsMap = new Map<string, boolean>(
        (rlsRows as RlsRow[] | null | undefined ?? []).map((row) => [String(row.relname), Boolean(row.relrowsecurity)])
      );
      const missingRls = REQUIRED_RLS_TABLES.filter((table) => !rlsMap.get(table));
      results.push({
        name: "RLS enabled on profesionisti/servicii/programari/subscriptions",
        ok: missingRls.length === 0,
        details: missingRls.length ? `Fără RLS: ${missingRls.join(", ")}` : undefined
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      name: "Unexpected runtime error",
      ok: false,
      details: message
    });
  }

  results.forEach(logResult);
  return results.every((result) => result.ok) ? 0 : 1;
}

run()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ verify:db crashed:", message);
    process.exit(1);
  });
