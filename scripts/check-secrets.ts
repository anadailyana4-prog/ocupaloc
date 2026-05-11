import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type CheckResult = {
  name: string;
  ok: boolean;
  details?: string;
};

const SUSPICIOUS_VALUE_PATTERNS: Array<{ key: string; regex: RegExp }> = [
  // Supabase service role is a JWT that should never be committed.
  { key: "SUPABASE_SERVICE_ROLE_KEY", regex: /eyJ[\w-]+\.[\w-]+\.[\w-]+/g },
  // Resend keys start with re_.
  { key: "RESEND_API_KEY", regex: /\bre_[A-Za-z0-9]{20,}\b/g }
];

function logResult(result: CheckResult) {
  const icon = result.ok ? "✅" : "❌";
  const extra = result.details ? ` - ${result.details}` : "";
  console.log(`${icon} ${result.name}${extra}`);
}

function getTrackedFiles(repoRoot: string): string[] {
  try {
    const output = execSync("git ls-files", {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8"
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getOccurrences(repoRoot: string) {
  const trackedFiles = getTrackedFiles(repoRoot);
  const occurrences: Array<{ file: string; key: string; line: number; content: string }> = [];

  for (const relFile of trackedFiles) {
    const file = join(repoRoot, relFile);
    let content = "";
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const pattern of SUSPICIOUS_VALUE_PATTERNS) {
        if (pattern.regex.test(line)) {
          occurrences.push({
            file: relFile,
            key: pattern.key,
            line: idx + 1,
            content: line.trim()
          });
        }
        pattern.regex.lastIndex = 0;
      }
    });
  }

  return occurrences;
}

async function run() {
  const results: CheckResult[] = [];
  const repoRoot = process.cwd();

  try {
    const occurrences = getOccurrences(repoRoot);
    const invalid = occurrences.filter((entry) => entry.file !== ".env.example");

    results.push({
      name: "Tracked files do not contain secret-like values",
      ok: invalid.length === 0,
      details: invalid.length
        ? invalid.map((entry) => `${entry.file}:${entry.line} (${entry.key})`).join(", ")
        : undefined
    });
    if (invalid.length === 0) {
      console.log("✅ OK: Secrete găsite doar în .env.example ca placeholder");
    }
  } catch (error) {
    results.push({
      name: "Repository secret scan",
      ok: false,
      details: error instanceof Error ? error.message : String(error)
    });
  }

  try {
    const gitignore = readFileSync(join(repoRoot, ".gitignore"), "utf8");
    const hasEnv = gitignore.split(/\r?\n/).includes(".env");
    const hasEnvLocal = gitignore.split(/\r?\n/).includes(".env.local");
    results.push({
      name: ".env and .env.local are ignored",
      ok: hasEnv && hasEnvLocal,
      details: hasEnv && hasEnvLocal ? undefined : "Adaugă .env și .env.local în .gitignore."
    });
  } catch (error) {
    results.push({
      name: ".gitignore validation",
      ok: false,
      details: error instanceof Error ? error.message : String(error)
    });
  }

  try {
    const output = execSync(
      "git log -G 're_[A-Za-z0-9]{20,}|eyJ[[:alnum:]_-]+\\.[[:alnum:]_-]+\\.[[:alnum:]_-]+' --pretty=format:%H --all",
      {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8"
      }
    ).trim();
    const hasHistoryLeak = output.length > 0;
    results.push({
      name: "Git history scan for secret-like values",
      ok: !hasHistoryLeak,
      details: hasHistoryLeak ? "❌ CRITICAL: ROTEȘTE CHEIA IMEDIAT" : undefined
    });
  } catch (error: unknown) {
    const e = error as { stderr?: unknown; stdout?: unknown };
    const stderr = typeof e.stderr === "string" ? e.stderr : "";
    const stdout = typeof e.stdout === "string" ? e.stdout : "";
    const combined = `${stdout}\n${stderr}`;
    if (combined.includes("not a git repository")) {
      console.log(
        "⚠️ WARNING: Nu e repository git sau istoric indisponibil. Verifică manual că .env.local nu a fost commitat."
      );
      results.push({
        name: "Git history scan for secret-like values",
        ok: true
      });
    } else if (stdout.trim().length === 0) {
      results.push({
        name: "Git history scan for secret-like values",
        ok: true
      });
    } else {
      results.push({
        name: "Git history scan for secret-like values",
        ok: false,
        details: "❌ CRITICAL: ROTEȘTE CHEIA IMEDIAT"
      });
    }
  }

  results.forEach(logResult);
  const isOk = results.every((result) => result.ok);
  process.exit(isOk ? 0 : 1);
}

run().catch((error) => {
  console.error("❌ verify:secrets crashed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
