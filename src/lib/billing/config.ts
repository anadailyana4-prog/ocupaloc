export const BILLING_PRICE_RON = 59.99;
export const BILLING_TRIAL_DAYS = 14;

export function isBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED?.trim().toLowerCase() === "true";
}

export const billingEnabled = isBillingEnabled();

export function getStripePriceId(): string {
  const value = process.env.STRIPE_PRICE_ID?.trim();
  if (!value) {
    throw new Error("Missing STRIPE_PRICE_ID");
  }
  return value;
}

export function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL");
  }
  return siteUrl.replace(/\/$/, "");
}
