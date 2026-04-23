import { NextRequest, NextResponse } from "next/server";

import { getRequestId, type OperationalEventInput, recordOperationalEvent } from "@/lib/ops-events";

type AllowedEvent = {
  eventType: string;
  flow: OperationalEventInput["flow"];
  outcome: OperationalEventInput["outcome"];
};

const ALLOWED_EVENTS: Record<string, AllowedEvent> = {
  booking_public_page_view: { eventType: "booking_public_page_view", flow: "booking", outcome: "success" },
  booking_service_selected: { eventType: "booking_service_selected", flow: "booking", outcome: "success" },
  booking_day_selected: { eventType: "booking_day_selected", flow: "booking", outcome: "success" },
  booking_slot_selected: { eventType: "booking_slot_selected", flow: "booking", outcome: "success" },
  booking_form_started: { eventType: "booking_form_started", flow: "booking", outcome: "success" },
  booking_submit_started: { eventType: "booking_submit_started", flow: "booking", outcome: "success" },
  booking_submit_success: { eventType: "booking_submit_success", flow: "booking", outcome: "success" },
  booking_submit_failed: { eventType: "booking_submit_failed", flow: "booking", outcome: "failure" },
  onboarding_signup_view: { eventType: "onboarding_signup_view", flow: "onboarding", outcome: "success" },
  onboarding_step_completed: { eventType: "onboarding_step_completed", flow: "onboarding", outcome: "success" },
  onboarding_profile_completed: { eventType: "onboarding_profile_completed", flow: "onboarding", outcome: "success" },
  onboarding_activation: { eventType: "onboarding_activation", flow: "onboarding", outcome: "success" },
  referral_attributed_visit: { eventType: "referral_attributed_visit", flow: "growth", outcome: "success" }
};

function pickMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const allowed = [
    "page",
    "slug",
    "service_id",
    "slot",
    "mode",
    "reason",
    "step",
    "variant",
    "experiment_id",
    "referral_source",
    "referral_code",
    "anon_id"
  ];
  const metadata: Record<string, unknown> = {};
  for (const key of allowed) {
    const value = source[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      metadata[key] = value.slice(0, 180);
      continue;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      metadata[key] = value;
    }
  }
  return metadata;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const body = (await req.json().catch(() => ({}))) as { eventName?: string; payload?: unknown };
  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  const allowed = ALLOWED_EVENTS[eventName];

  if (!allowed) {
    return NextResponse.json({ ok: false, requestId, error: "Unsupported event type." }, { status: 400 });
  }

  const metadata = pickMetadata(body.payload);

  await recordOperationalEvent({
    eventType: allowed.eventType,
    flow: allowed.flow,
    outcome: allowed.outcome,
    requestId,
    statusCode: 202,
    metadata: {
      source: "client_analytics",
      ...metadata
    }
  });

  return NextResponse.json({ ok: true, requestId });
}
