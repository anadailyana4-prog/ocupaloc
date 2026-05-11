import { redirect } from "next/navigation";
import { requireOwnerAdmin } from "@/lib/owner/auth";

export default async function OwnerTrialsPage() {
  try {
    await requireOwnerAdmin();
  } catch {
    redirect("/owner/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Trial Accounts</h1>
        <p className="text-slate-400 mt-1">Monitor expiring trials</p>
      </div>
      <div className="text-center py-12 text-slate-400">Coming soon</div>
    </div>
  );
}
