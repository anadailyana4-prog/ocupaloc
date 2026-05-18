import { NextResponse } from "next/server";

import { getOwnerBillingStatus } from "@/lib/billing/owner-status";
import { formatOperationalEventType } from "@/lib/ops-event-labels";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const supabase = await createSupabaseServerClient();

    const [latestWebhookResult, recentBillingEventsResult] = await Promise.all([
      supabase
        .from("webhook_events")
        .select("stripe_event_id, event_type, status, error_message, received_at, processed_at")
        .order("received_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("operational_events")
        .select("event_type, outcome, created_at, metadata")
        .eq("flow", "billing")
        .order("created_at", { ascending: false })
        .limit(10)
    ]);

    const billingStatus = getOwnerBillingStatus();

    await logOwnerAction("owner_billing_diagnostic_read", "billing", undefined, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({
      ok: true,
      data: {
        status: billingStatus,
        lastWebhookEvent: latestWebhookResult.data ?? null,
        recentBillingEvents: (recentBillingEventsResult.data ?? []).map((event) => ({
          ...event,
          event_type_label: formatOperationalEventType(event.event_type)
        }))
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
