import { NextResponse } from "next/server";

import { formatOperationalEventType } from "@/lib/ops-event-labels";
import { BILLING_RECONCILIATION_SIGNAL_TYPES } from "@/lib/ops-event-taxonomy";
import { logOwnerAction, requireOwnerAdminFromRequest } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const auth = await requireOwnerAdminFromRequest(request);
    const supabase = await createSupabaseServerClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ data: cron }, { data: synthetic }, { data: emailQueue }, { data: billingRecon }] = await Promise.all([
      supabase.from("cron_job_runs").select("job_name, status, run_at, duration_ms, error_message").order("run_at", { ascending: false }).limit(50),
      supabase
        .from("operational_events")
        .select("event_type, outcome, created_at, metadata")
        .eq("flow", "synthetic")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("email_queue").select("status, created_at").gte("created_at", since),
      supabase
        .from("operational_events")
        .select("event_type, outcome, created_at, metadata")
        .eq("flow", "billing")
        .in("event_type", [...BILLING_RECONCILIATION_SIGNAL_TYPES])
        .order("created_at", { ascending: false })
        .limit(20)
    ]);

    const emailQueued = (emailQueue ?? []).filter((row) => row.status === "queued").length;
    const emailProcessing = (emailQueue ?? []).filter((row) => row.status === "processing").length;
    const emailFailed = (emailQueue ?? []).filter((row) => row.status === "failed").length;

    await logOwnerAction("owner_operations_read", "operations", undefined, undefined, {
      ipAddress: auth.ipAddress,
      userAgent: auth.userAgent
    });

    return NextResponse.json({
      ok: true,
      data: {
        cronJobs: cron ?? [],
        synthetic: (synthetic ?? []).map((event) => ({
          ...event,
          event_type_label: formatOperationalEventType(event.event_type)
        })),
        billingReconciliation: (billingRecon ?? []).map((event) => ({
          ...event,
          event_type_label: formatOperationalEventType(event.event_type)
        })),
        emailQueueStats: {
          queued: emailQueued,
          processing: emailProcessing,
          failed: emailFailed
        },
        deploymentStatus: "not_instrumented_yet"
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
}
