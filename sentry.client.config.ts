import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Capture 10% of transactions for performance monitoring (free tier friendly)
    tracesSampleRate: 0.1,
    // Replay 1% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.replayIntegration()],
    // Don't send PII
    sendDefaultPii: false,
    // Ignore common browser noise
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error exception captured",
      "Non-Error promise rejection captured",
      /^Network Error$/,
      /^Failed to fetch$/,
      /^Load failed$/,
    ],
  });
}
