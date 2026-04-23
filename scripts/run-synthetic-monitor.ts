export {};

const baseUrl = (process.env.SYNTHETIC_BASE_URL ?? "https://ocupaloc.ro").replace(/\/$/, "");
const secret = process.env.SYNTHETIC_MONITOR_SECRET ?? process.env.REMINDERS_CRON_SECRET;

if (!secret) {
  console.error("SYNTHETIC_MONITOR_SECRET or REMINDERS_CRON_SECRET is required");
  process.exit(1);
}

async function main() {
  const response = await fetch(`${baseUrl}/api/jobs/synthetic-monitor`, {
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    failedChecks?: string[];
    checks?: Array<{ name: string; ok: boolean; statusCode?: number; latencyMs?: number }>;
  };

  console.log("Synthetic monitor result", {
    status: response.status,
    ok: payload.ok,
    failedChecks: payload.failedChecks,
    checks: payload.checks
  });

  if (!response.ok || !payload.ok) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Synthetic monitor script failed", error);
  process.exit(1);
});
