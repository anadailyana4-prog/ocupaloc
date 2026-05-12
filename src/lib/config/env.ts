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
  | "CRON_SECRET"
  | "RESEND_API_KEY"
  | "RESEND_FROM"
  | "REMINDERS_CRON_SECRET"
  | "STRIPE_PRICE_ID"
  | "NEXT_PUBLIC_SITE_URL"
  | "BILLING_ENABLED"
  | "OUTREACH_CRON_SECRET"
  | "OUTREACH_SIGNING_SECRET"
  | "OUTREACH_SMTP_HOST"
  | "OUTREACH_SMTP_PORT"
  | "OUTREACH_SMTP_USER"
  | "OUTREACH_SMTP_PASSWORD"
  | "OUTREACH_SMTP_SECURE"
  | "OUTREACH_IMAP_HOST"
  | "OUTREACH_IMAP_PORT"
  | "OUTREACH_IMAP_USER"
  | "OUTREACH_IMAP_PASSWORD"
  | "OUTREACH_IMAP_TLS"
  | "OUTREACH_IMAP_SENT_MAILBOX"
  | "OUTREACH_SEND_LIMIT_PER_HOUR"
  | "OUTREACH_SEND_LIMIT_PER_DAY"
  | "OUTREACH_FOLLOW_UP_DELAY_DAYS"
  | "OUTREACH_FOLLOW_UP_STEP2_DELAY_DAYS"
  | "OUTREACH_FOLLOW_UP_STEP3_DELAY_DAYS"
  | "OUTREACH_FOLLOW_UP_JITTER_DAYS"
  | "OUTREACH_MAX_DAILY_BREAKUP_MESSAGES"
  | "OUTREACH_BREAKUP_MIN_COMMERCIAL_SCORE"
  | "OUTREACH_BATCH_SIZE"
  | "OUTREACH_SENDER_NAME"
  | "APIFY_WEBHOOK_SECRET"
  | "APIFY_TOKEN"
  | "TELEGRAM_BOT_TOKEN"
  | "TELEGRAM_WEBHOOK_SECRET"
  | "TELEGRAM_OWNER_IDS"
  | "TELEGRAM_ADMIN_IDS"
  | "TELEGRAM_OPERATOR_IDS";

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