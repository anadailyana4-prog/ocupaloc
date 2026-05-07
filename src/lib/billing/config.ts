import { env } from "@/lib/config/env";

export const BILLING_PRICE_RON = 59.99;
export const BILLING_TRIAL_DAYS = 14;

export function isBillingEnabled(): boolean {
  return env.optional("BILLING_ENABLED")?.toLowerCase() === "true";
}

export const billingEnabled = isBillingEnabled();

export function getStripePriceId(): string {
  return env.get("STRIPE_PRICE_ID");
}

export function getSiteUrl(): string {
  const siteUrl = env.get("NEXT_PUBLIC_SITE_URL");
  return siteUrl.replace(/\/$/, "");
}
