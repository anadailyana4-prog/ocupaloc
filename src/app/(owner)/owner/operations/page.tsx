import { redirect } from "next/navigation";
import { BILLING_RECONCILIATION_SIGNAL_TYPES } from "@/lib/ops-event-taxonomy";
import { formatOperationalEventType } from "@/lib/ops-event-labels";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerOperationsPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "operations");
  } catch {
    redirect("/owner/login");
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: cronRuns }, { data: synthetic }, { data: billing }, { data: emails }] = await Promise.all([
    supabase.from("cron_job_runs").select("job_name, status, run_at, duration_ms, error_message").order("run_at", { ascending: false }).limit(40),
    supabase
      .from("operational_events")
      .select("event_type, outcome, created_at")
      .eq("flow", "synthetic")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("operational_events")
      .select("event_type, outcome, created_at, metadata")
      .eq("flow", "billing")
      .in("event_type", [...BILLING_RECONCILIATION_SIGNAL_TYPES])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("email_queue").select("status, created_at").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  ]);

  const emailStats = {
    queued: (emails ?? []).filter((e) => e.status === "queued").length,
    failed: (emails ?? []).filter((e) => e.status === "failed").length,
    sent: (emails ?? []).filter((e) => e.status === "sent").length
  };

  const latestSynthetic = synthetic?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Operations</h1>
        <p className="text-slate-400 mt-1">Cron jobs and system health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs text-slate-400 uppercase">Synthetic monitor</p>
          <p className="text-slate-100 mt-2">{latestSynthetic ? latestSynthetic.outcome : "not instrumented yet"}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs text-slate-400 uppercase">Email queue (24h)</p>
          <p className="text-slate-100 mt-2">sent {emailStats.sent} • failed {emailStats.failed} • queued {emailStats.queued}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs text-slate-400 uppercase">Deployment status</p>
          <p className="text-slate-100 mt-2">Vercel – auto-deploy on push</p>
          <p className="text-xs text-slate-500 mt-1">CI: GitHub Actions ci.yml</p>
        </div>
      </div>

      <section className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Recent Cron Runs</h2>
        <div className="space-y-2">
          {(cronRuns ?? []).map((job) => (
            <div key={`${job.job_name}-${job.run_at}`} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 flex justify-between">
              <div>
                <p className="text-slate-100 font-medium">{job.job_name}</p>
                <p className="text-xs text-slate-400">{job.error_message || "no error"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-300">{job.status}</p>
                <p className="text-xs text-slate-500">{new Date(job.run_at).toLocaleString("ro-RO")}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Billing Reconciliation Signals</h2>
        <div className="space-y-2">
          {(billing ?? []).length === 0 ? (
            <p className="text-slate-400">not instrumented yet</p>
          ) : (
            (billing ?? []).map((event) => (
              <div key={`${event.event_type}-${event.created_at}`} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 flex justify-between">
                <div>
                  <p className="text-slate-100">{formatOperationalEventType(event.event_type)}</p>
                  <p className="text-[11px] text-slate-500">raw: {event.event_type}</p>
                </div>
                <p className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString("ro-RO")}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
