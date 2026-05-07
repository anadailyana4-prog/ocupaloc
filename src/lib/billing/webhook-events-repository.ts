import type { SupabaseClient } from "@supabase/supabase-js";

export type WebhookEventStatus = "pending" | "processed" | "failed";

export type WebhookEventRecord = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: WebhookEventStatus;
  payload: Record<string, unknown>;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
};

export async function findWebhookEventByStripeId(
  admin: SupabaseClient,
  stripeEventId: string
): Promise<WebhookEventRecord | null> {
  const { data, error } = await admin
    .from("webhook_events")
    .select("id, stripe_event_id, event_type, status, payload, error_message, received_at, processed_at")
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  if (error) {
    throw new Error(`webhook_events lookup failed: ${error.message}`);
  }

  return (data as WebhookEventRecord | null) ?? null;
}

export async function insertPendingWebhookEvent(
  admin: SupabaseClient,
  input: {
    stripeEventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }
): Promise<WebhookEventRecord> {
  const { data, error } = await admin
    .from("webhook_events")
    .insert({
      stripe_event_id: input.stripeEventId,
      event_type: input.eventType,
      status: "pending",
      payload: input.payload
    })
    .select("id, stripe_event_id, event_type, status, payload, error_message, received_at, processed_at")
    .single();

  if (error) {
    throw new Error(`webhook_events insert failed: ${error.message}`);
  }

  return data as WebhookEventRecord;
}

export async function markWebhookEventProcessed(
  admin: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await admin
    .from("webhook_events")
    .update({
      status: "processed",
      error_message: null,
      processed_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    throw new Error(`webhook_events mark processed failed: ${error.message}`);
  }
}

export async function markWebhookEventFailed(
  admin: SupabaseClient,
  id: string,
  errorMessage: string
): Promise<void> {
  const { error } = await admin
    .from("webhook_events")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 1000),
      processed_at: null
    })
    .eq("id", id);

  if (error) {
    throw new Error(`webhook_events mark failed failed: ${error.message}`);
  }
}

export async function resetWebhookEventToPending(
  admin: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await admin
    .from("webhook_events")
    .update({
      status: "pending",
      error_message: null,
      processed_at: null
    })
    .eq("id", id);

  if (error) {
    throw new Error(`webhook_events reset to pending failed: ${error.message}`);
  }
}
