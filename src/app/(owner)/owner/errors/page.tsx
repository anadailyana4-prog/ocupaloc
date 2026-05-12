import { redirect } from "next/navigation";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { getFailedCronJobs } from "@/lib/owner/stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerErrorsPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "errors");
  } catch {
    redirect("/owner/login");
  }

  const failedJobs = await getFailedCronJobs(50);
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: opFailures }, { data: emailFailures }] = await Promise.all([
    supabase
      .from("operational_events")
      .select("id, event_type, flow, entity_id, created_at, metadata")
      .eq("outcome", "failure")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("email_queue")
      .select("id, to_email, subject, last_error, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(100)
  ]);

  const repeatedProblemAccounts = new Map<string, number>();
  for (const item of opFailures ?? []) {
    const entityId = item.entity_id;
    if (!entityId) continue;
    repeatedProblemAccounts.set(entityId, (repeatedProblemAccounts.get(entityId) ?? 0) + 1);
  }

  const repeated = Array.from(repeatedProblemAccounts.entries())
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Errors & Incidents</h1>
        <p className="text-slate-400 mt-1">Monitor system issues</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Failed Cron Jobs
        </h2>
        {failedJobs.length === 0 ? (
          <p className="text-slate-400">No failed jobs</p>
        ) : (
          <div className="space-y-2">
            {failedJobs.map(job => (
              <div
                key={job.id}
                className="rounded-lg border border-red-700/30 bg-red-900/20 p-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-red-100">{job.job_name}</p>
                    <p className="text-xs text-red-300 mt-1">
                      {job.error_message}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(job.run_at).toLocaleString("ro-RO")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Critical Operational Failures (7d)</h2>
        {(opFailures ?? []).length === 0 ? (
          <p className="text-slate-400">No critical failures in the last 7 days.</p>
        ) : (
          <div className="space-y-2">
            {(opFailures ?? []).map((event) => (
              <div key={event.id} className="rounded-lg border border-red-700/30 bg-red-900/10 p-3 flex justify-between">
                <div>
                  <p className="text-red-100 font-medium">{event.flow}: {event.event_type}</p>
                  <p className="text-xs text-red-300">entity: {event.entity_id ?? "n/a"}</p>
                </div>
                <p className="text-xs text-slate-400">{new Date(event.created_at).toLocaleString("ro-RO")}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Email Failures</h2>
        {(emailFailures ?? []).length === 0 ? (
          <p className="text-slate-400">No email failures detected.</p>
        ) : (
          <div className="space-y-2">
            {(emailFailures ?? []).map((email) => (
              <div key={email.id} className="rounded-lg border border-orange-700/30 bg-orange-900/10 p-3">
                <p className="text-orange-100 font-medium">{email.to_email}</p>
                <p className="text-xs text-orange-300">{email.subject}</p>
                <p className="text-xs text-slate-400 mt-1">{email.last_error || "no error message"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Repeated Problem Accounts</h2>
        {repeated.length === 0 ? (
          <p className="text-slate-400">No repeated-problem accounts identified.</p>
        ) : (
          <div className="space-y-2">
            {repeated.map(([entityId, count]) => (
              <div key={entityId} className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 flex justify-between">
                <p className="text-slate-200">{entityId}</p>
                <p className="text-slate-400 text-sm">{count} failures</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
