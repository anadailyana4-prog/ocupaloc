import * as Sentry from "@sentry/nextjs";

import { env } from "@/lib/config/env";

export const onRequestError = Sentry.captureRequestError;

export async function register() {
  if (process.env.NODE_ENV !== "test") {
    env.assertCriticalServerEnv();
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
