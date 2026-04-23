export {};

const baseUrl = (process.env.SLO_BASE_URL ?? "https://ocupaloc.ro").replace(/\/$/, "");
const secret = process.env.SLO_READ_SECRET ?? process.env.REMINDERS_CRON_SECRET;
const windowMinutes = Number(process.env.SLO_WINDOW_MINUTES ?? "60");

if (!secret) {
  console.error("SLO_READ_SECRET or REMINDERS_CRON_SECRET is required");
  process.exit(1);
}

async function main() {
  const response = await fetch(`${baseUrl}/api/ops/slo?windowMinutes=${windowMinutes}`, {
    headers: {
      Authorization: `Bearer ${secret}`
    }
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    releaseGate?: "GO" | "NO-GO";
    snapshot?: {
      bookingSuccessRate: number;
      loginSuccessRate: number;
      apiAvailabilityRate: number;
      p95CriticalLatencyMs: number;
      status: Record<string, string>;
    };
    error?: string;
  };

  if (!response.ok || !payload.ok || !payload.snapshot) {
    console.error("SLO endpoint failed", { status: response.status, payload });
    process.exit(1);
  }

  console.log("SLO Snapshot", {
    gate: payload.releaseGate,
    bookingSuccessRate: payload.snapshot.bookingSuccessRate,
    loginSuccessRate: payload.snapshot.loginSuccessRate,
    apiAvailabilityRate: payload.snapshot.apiAvailabilityRate,
    p95CriticalLatencyMs: payload.snapshot.p95CriticalLatencyMs,
    status: payload.snapshot.status
  });

  if (payload.releaseGate === "NO-GO") {
    console.error("Release gate blocked by SLO policy");
    process.exit(2);
  }
}

main().catch((error) => {
  console.error("SLO release gate script failed", error);
  process.exit(1);
});
