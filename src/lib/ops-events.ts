import { randomUUID } from "crypto";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

export type OperationalEventInput = {
  eventType: string;
  flow: "booking" | "auth" | "api" | "cron" | "synthetic" | "onboarding" | "growth";
  outcome: "success" | "failure";
  requestId?: string;
  entityId?: string;
  statusCode?: number;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
};

export function getRequestId(headers: Headers): string {
  return (
    headers.get("x-request-id")?.trim() ||
    headers.get("x-correlation-id")?.trim() ||
    randomUUID()
  );
}

export async function recordOperationalEvent(event: OperationalEventInput): Promise<void> {
  try {
    const admin = createSupabaseServiceClient();
    const { error } = await admin.from("operational_events").insert({
      event_type: event.eventType,
      flow: event.flow,
      outcome: event.outcome,
      request_id: event.requestId ?? null,
      entity_id: event.entityId ?? null,
      status_code: event.statusCode ?? null,
      latency_ms: event.latencyMs ?? null,
      metadata: event.metadata ?? {}
    });

    if (error) {
      console.error("[ops-events] insert failed", error.message);
    }
  } catch (error) {
    console.error("[ops-events] unexpected failure", error);
  }
}
