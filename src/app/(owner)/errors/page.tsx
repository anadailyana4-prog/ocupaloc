import { redirect } from "next/navigation";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { getFailedCronJobs } from "@/lib/owner/stats";

export default async function OwnerErrorsPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "errors");
  } catch {
    redirect("/owner/login");
  }

  const failedJobs = await getFailedCronJobs(50);

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
    </div>
  );
}
