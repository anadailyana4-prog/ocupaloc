const CRITICAL_SERVER_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "REMINDERS_CRON_SECRET"
] as const;

export type EnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "RESEND_API_KEY"
  | "RESEND_FROM"
  | "REMINDERS_CRON_SECRET"
  | "STRIPE_PRICE_ID"
  | "NEXT_PUBLIC_SITE_URL"
  | "BILLING_ENABLED";

function readRaw(key: string): string | undefined {
  const value = process.env[key];
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getEnv(key: EnvKey): string {
  const value = readRaw(key);
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: EnvKey): string | undefined {
  return readRaw(key);
}

export function assertCriticalServerEnv(): void {
  for (const key of CRITICAL_SERVER_KEYS) {
    getEnv(key);
  }
}

export const env = {
  get: getEnv,
  optional: getOptionalEnv,
  assertCriticalServerEnv
};