import { redirect } from "next/navigation";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";

export default async function OwnerOperationsPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "operations");
  } catch {
    redirect("/owner/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Operations</h1>
        <p className="text-slate-400 mt-1">Cron jobs and system health</p>
      </div>
      <div className="text-center py-12 text-slate-400">Coming soon</div>
    </div>
  );
}
