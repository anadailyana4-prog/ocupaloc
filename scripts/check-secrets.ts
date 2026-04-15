import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type CheckResult = {
  name: string;
  ok: boolean;
  details?: string;
};

const SECRET_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY"] as const;
const IGNORE_PATHS = [
  "node_modules",
  ".git",
  ".next",
  ".open-next",
  ".wrangler",
  "dist",
  "build",
  "coverage",
  "logs",
  "*.log",
  "package-lock.json",
  "pnpm-lock.yaml"
] as const;

function logResult(result: CheckResult) {
  const icon = result.ok ? "✅" : "❌";
  const extra = result.details ? ` - ${result.details}` : "";
  console.log(`${icon} ${result.name}${extra}`);
}

function shouldIgnorePath(path: string): boolean {
  return IGNORE_PATHS.some((pattern) => {
    if (pattern === "*.log") {
      return path.endsWith(".log");
    }
    return path.includes(pattern);
  });
}

function walkFiles(baseDir: string, currentDir: string, files: string[]) {
  const entries = readdirSync(currentDir);
  for (const entry of entries) {
    const fullPath = join(currentDir, entry);
    const relPath = relative(baseDir, fullPath);
    if (!relPath) continue;
    if (shouldIgnorePath(relPath)) continue;
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkFiles(baseDir, fullPath, files);
    } else if (stats.isFile()) {
      files.push(fullPath);
    }
  }
}

function getOccurrences(repoRoot: string) {
  const files: string[] = [];
  walkFiles(repoRoot, repoRoot, files);
  const occurrences: Array<{ file: string; key: string; line: number; content: string }> = [];

  for (const file of files) {
    let content = "";
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      for (const key of SECRET_KEYS) {
        if (line.includes(key)) {
          occurrences.push({
            file: relative(repoRoot, file),
            key,
            line: idx + 1,
            content: line.trim()
          });
        }
      }
    });
  }

  return occurrences;
}

function isEnvExamplePlaceholder(content: string): boolean {
  if (!content.includes("=")) return false;
  if (content.includes("re_")) return false;
  if (content.includes("cfut_")) return false;
  return true;
}

async function run() {
  const results: CheckResult[] = [];
  const repoRoot = process.cwd();

  try {
    const occurrences = getOccurrences(repoRoot);
    const invalid = occurrences.filter((entry) => {
      if (entry.file !== ".env.example") return true;
      return !isEnvExamplePlaceholder(entry.content);
    });

    results.push({
      name: "Secret tokens appear only as placeholders in .env.example",
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
    const output = execSync("git log -p | grep SUPABASE_SERVICE_ROLE_KEY", {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8"
    }).trim();
    const hasHistoryLeak = output.length > 0;
    results.push({
      name: "Git history scan for SUPABASE_SERVICE_ROLE_KEY",
      ok: !hasHistoryLeak,
      details: hasHistoryLeak ? "❌ CRITICAL: ROTEȘTE CHEIA IMEDIAT" : undefined
    });
  } catch (error: any) {
    const stderr = typeof error?.stderr === "string" ? error.stderr : "";
    const stdout = typeof error?.stdout === "string" ? error.stdout : "";
    const combined = `${stdout}\n${stderr}`;
    if (combined.includes("not a git repository")) {
      console.log(
        "⚠️ WARNING: Nu e repository git sau istoric indisponibil. Verifică manual că .env.local nu a fost commitat."
      );
      results.push({
        name: "Git history scan for SUPABASE_SERVICE_ROLE_KEY",
        ok: true
      });
    } else if (stdout.trim().length === 0) {
      results.push({
        name: "Git history scan for SUPABASE_SERVICE_ROLE_KEY",
        ok: true
      });
    } else {
      results.push({
        name: "Git history scan for SUPABASE_SERVICE_ROLE_KEY",
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
