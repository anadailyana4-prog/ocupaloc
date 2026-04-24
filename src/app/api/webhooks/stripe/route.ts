import { handleStripeWebhookRequest } from "@/lib/billing/stripe-webhook-handler";

export async function POST(req: Request) {
  return handleStripeWebhookRequest(req);
}
