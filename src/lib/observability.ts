type CriticalFlow = "booking" | "email" | "cron" | "auth";

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
}
