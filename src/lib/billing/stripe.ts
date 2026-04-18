import Stripe from "stripe";
import { billingEnabled } from "@/lib/billing/config";

let cachedStripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (cachedStripe) {
    return cachedStripe;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  cachedStripe = new Stripe(apiKey, {
    apiVersion: "2024-09-30.acacia",
    typescript: true
  });

  return cachedStripe;
}

// Backward-compatible singleton export for existing imports.
export const stripe = billingEnabled && process.env.STRIPE_SECRET_KEY ? getStripeClient() : null;
