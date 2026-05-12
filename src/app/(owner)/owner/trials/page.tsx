import { redirect } from "next/navigation";
import { requireOwnerAdmin, logOwnerAction } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerTrialsPage() {
  try {
    await requireOwnerAdmin();
    await logOwnerAction("view_section", "trials");
  } catch {
    redirect("/owner/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: trials } = await supabase
    .from("subscriptions")
    .select(
      "id, profesionist_id, status, current_period_end, stripe_subscription_id, profesionisti(nume_business, email_contact)"
    )
    .eq("status", "trialing")
    .order("current_period_end", { ascending: true });

  const now = Date.now();

  const grouped = {
    in3: (trials ?? []).filter((t) => {
      if (!t.current_period_end) return false;
      const diffDays = (new Date(t.current_period_end).getTime() - now) / (24 * 60 * 60 * 1000);
      return diffDays >= 0 && diffDays <= 3;
    }),
    in7: (trials ?? []).filter((t) => {
      if (!t.current_period_end) return false;
      const diffDays = (new Date(t.current_period_end).getTime() - now) / (24 * 60 * 60 * 1000);
      return diffDays > 3 && diffDays <= 7;
    }),
    expired: (trials ?? []).filter((t) => {
      if (!t.current_period_end) return false;
      return new Date(t.current_period_end).getTime() < now;
    })
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Trial Accounts</h1>
        <p className="text-slate-400 mt-1">Monitor expiring trials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-red-700/30 bg-red-900/20 p-4">
          <p className="text-xs uppercase text-red-200">Expiring in 3 days</p>
          <p className="text-2xl text-red-100 font-bold mt-2">{grouped.in3.length}</p>
        </div>
        <div className="rounded-lg border border-orange-700/30 bg-orange-900/20 p-4">
          <p className="text-xs uppercase text-orange-200">Expiring in 7 days</p>
          <p className="text-2xl text-orange-100 font-bold mt-2">{grouped.in7.length}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <p className="text-xs uppercase text-slate-300">Expired (needs follow-up)</p>
          <p className="text-2xl text-slate-100 font-bold mt-2">{grouped.expired.length}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wide">
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Trial Ends</th>
                <th className="px-4 py-3">Stripe Sub</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {(trials ?? []).map((trial) => {
                const profObj = trial.profesionisti as unknown as Record<string, unknown>;
                return (
                  <tr key={trial.id} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3 text-slate-100">{String(profObj?.nume_business ?? "-")}</td>
                    <td className="px-4 py-3 text-slate-300">{String(profObj?.email_contact ?? "-")}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {trial.current_period_end
                        ? new Date(trial.current_period_end).toLocaleDateString("ro-RO")
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{trial.stripe_subscription_id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
