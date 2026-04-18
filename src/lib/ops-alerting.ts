type OpsAlertPayload = {
  flow: "booking" | "email" | "cron" | "auth" | "billing";
  event: string;
  context: Record<string, unknown>;
  error: Record<string, unknown>;
  timestamp: string;
};

let lastSentAt = 0;

export async function sendOpsAlert(payload: OpsAlertPayload): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  if (!url) {
    return;
  }

  const cooldownMs = Number(process.env.ALERT_COOLDOWN_MS ?? "300000");
  if (Number.isFinite(cooldownMs) && cooldownMs > 0) {
    const now = Date.now();
    if (now - lastSentAt < cooldownMs) {
      return;
    }
    lastSentAt = now;
  }

  const bearer = process.env.ALERT_WEBHOOK_BEARER_TOKEN?.trim();

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
    },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Best-effort alerting only.
  });
}
