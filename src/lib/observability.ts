type CriticalFlow = "booking" | "email" | "cron" | "auth" | "billing";

import { sendOpsAlert } from "@/lib/ops-alerting";

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    value: String(error)
  };
}

export function reportError(
  flow: CriticalFlow,
  event: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const payload = {
    level: "error",
    flow,
    event,
    context: context ?? {},
    error: serializeError(error),
    timestamp: new Date().toISOString()
  };

  console.error("[observability]", JSON.stringify(payload));

  void sendOpsAlert({
    flow,
    event,
    context: payload.context,
    error: payload.error,
    timestamp: payload.timestamp
  });

  // Forward to Sentry when configured (non-blocking)
  if (process.env.SENTRY_DSN) {
    void import("@sentry/nextjs")
      .then(({ withScope, captureException }) => {
        withScope((scope) => {
          scope.setTag("flow", flow);
          scope.setTag("event", event);
          scope.setExtras(context ?? {});
          captureException(error instanceof Error ? error : new Error(String(error)));
        });
      })
      .catch(() => {
        // Sentry unavailable — already logged to console above
      });
  }
}
