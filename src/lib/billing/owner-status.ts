import { isBillingEnabled } from "@/lib/billing/config";

export type OwnerBillingStatus = {
  connected: boolean;
  billingEnabled: boolean;
  mode: "live" | "test" | "unknown";
  issues: string[];
};

function hasValue(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function getOwnerBillingStatus(): OwnerBillingStatus {
  const billingEnabled = isBillingEnabled();

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

  const issues: string[] = [];
  if (!billingEnabled) issues.push("BILLING_ENABLED este false");
  if (!hasValue(secretKey)) issues.push("Lipsește STRIPE_SECRET_KEY");
  if (!hasValue(webhookSecret)) issues.push("Lipsește STRIPE_WEBHOOK_SECRET");
  if (!hasValue(priceId)) issues.push("Lipsește STRIPE_PRICE_ID");
  if (!hasValue(publishableKey)) issues.push("Lipsește NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

  const mode: OwnerBillingStatus["mode"] = secretKey?.startsWith("sk_live_")
    ? "live"
    : secretKey?.startsWith("sk_test_")
      ? "test"
      : "unknown";

  return {
    connected: issues.length === 0,
    billingEnabled,
    mode,
    issues
  };
}
