import { redirect } from "next/navigation";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";

export default async function OwnerSettingsPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "settings");
  } catch {
    redirect("/owner/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">Owner portal configuration</p>
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Owner Admin Users
        </h2>
        <p className="text-slate-400">Admin user management coming soon</p>
      </div>
    </div>
  );
}
