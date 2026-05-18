import { redirect } from "next/navigation";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { getOwnerBillingStatus } from "@/lib/billing/owner-status";
import { formatOperationalEventType } from "@/lib/ops-event-labels";
import { logOwnerAction, requireOwnerAdmin } from "@/lib/owner/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerSettingsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const banner = typeof params.banner === "string" ? params.banner : null;

  const ownerAdmin = await requireOwnerAdmin().catch(() => null);
  if (!ownerAdmin) {
    redirect("/owner/login");
  }

  await logOwnerAction("view_section", "settings");

  async function inviteAdmin(formData: FormData) {
    "use server";

    const actor = await requireOwnerAdmin();
    if (actor.role !== "owner") {
      return;
    }

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return;

    const service = createSupabaseServiceClient();
    const usersResult = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = usersResult.data?.users?.find((user) => user.email?.toLowerCase() === email);

    if (!target) {
      redirect("/owner/settings?banner=user_not_found");
    }

    await service
      .from("owner_admin_users")
      .upsert({
        user_id: target.id,
        role: "admin",
        is_active: true
      }, { onConflict: "user_id" });

    await logOwnerAction("owner_admin_invite_or_promote", "owner_admin_users", target.id, {
      invitedEmail: email
    });

    redirect("/owner/settings?banner=invited");
  }

  async function savePreferences(formData: FormData) {
    "use server";

    const actor = await requireOwnerAdmin();
    const trialDays = Number.parseInt(String(formData.get("trialDays") ?? "7"), 10);
    const churnDays = Number.parseInt(String(formData.get("churnDays") ?? "14"), 10);
    const compactWidgets = String(formData.get("compactWidgets") ?? "") === "on";

    const supabase = await createSupabaseServerClient();
    await supabase
      .from("owner_settings")
      .upsert({
        user_id: actor.user_id,
        trial_expiring_alert_days: Number.isFinite(trialDays) ? trialDays : 7,
        churn_risk_inactive_days: Number.isFinite(churnDays) ? churnDays : 14,
        widget_preferences: {
          compactWidgets
        },
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    await logOwnerAction("owner_settings_update", "owner_settings", actor.user_id, {
      trialDays,
      churnDays,
      compactWidgets
    });

    redirect("/owner/settings?banner=saved");
  }

  const supabase = await createSupabaseServerClient();
  const service = createSupabaseServiceClient();

  const [{ data: admins }, { data: ownerSettings }, usersResult, latestWebhookResult, latestBillingEventResult] = await Promise.all([
    supabase
      .from("owner_admin_users")
      .select("id, user_id, role, is_active, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("owner_settings")
      .select("trial_expiring_alert_days, churn_risk_inactive_days, widget_preferences")
      .eq("user_id", ownerAdmin.user_id)
      .maybeSingle(),
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase
      .from("webhook_events")
      .select("stripe_event_id, event_type, status, received_at, processed_at, error_message")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("operational_events")
      .select("event_type, outcome, created_at")
      .eq("flow", "billing")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);
  const billingStatus = getOwnerBillingStatus();
  const latestWebhook = latestWebhookResult.data;
  const latestBillingEvent = latestBillingEventResult.data;

  const emailByUserId = new Map<string, string>();
  for (const user of usersResult.data?.users ?? []) {
    if (user.email) {
      emailByUserId.set(user.id, user.email);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 mt-1">Owner access management and owner preferences</p>
      </div>

      {banner === "invited" && (
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-900/20 px-4 py-3 text-emerald-100 text-sm">
          ✓ Admin promoted/invited successfully.
        </div>
      )}
      {banner === "user_not_found" && (
        <div className="rounded-lg border border-red-600/40 bg-red-900/20 px-4 py-3 text-red-100 text-sm">
          ✗ No user found with that email address. The user must already have an account.
        </div>
      )}
      {banner === "saved" && (
        <div className="rounded-lg border border-emerald-600/40 bg-emerald-900/20 px-4 py-3 text-emerald-100 text-sm">
          ✓ Preferences saved.
        </div>
      )}

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Admins List</h2>
        <div className="space-y-2">
          {(admins ?? []).map((admin) => (
            <div key={admin.id} className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 flex justify-between items-center">
              <div>
                <p className="text-slate-100">{emailByUserId.get(admin.user_id) ?? admin.user_id}</p>
                <p className="text-xs text-slate-500">created {new Date(admin.created_at).toLocaleDateString("ro-RO")}</p>
              </div>
              <div className="text-sm text-slate-300">
                {admin.role} • {admin.is_active ? "active" : "inactive"}
              </div>
            </div>
          ))}
        </div>

        <form action={inviteAdmin} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            name="email"
            type="email"
            placeholder="existing user email"
            className="md:col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
          />
          <button
            type="submit"
            disabled={ownerAdmin.role !== "owner"}
            className="px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/20 text-amber-100 disabled:opacity-50"
          >
            Invite/Promote Admin
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Enter an existing user email to add them as admin. They must already have an account on the platform.
        </p>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Thresholds & Widget Preferences</h2>
        <form action={savePreferences} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            name="trialDays"
            type="number"
            min={1}
            max={30}
            defaultValue={ownerSettings?.trial_expiring_alert_days ?? 7}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
            placeholder="trial expiring alert days"
          />
          <input
            name="churnDays"
            type="number"
            min={1}
            max={90}
            defaultValue={ownerSettings?.churn_risk_inactive_days ?? 14}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
            placeholder="churn risk inactive days"
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-300 rounded-lg border border-slate-700 px-3 py-2 bg-slate-900">
            <input
              type="checkbox"
              name="compactWidgets"
              defaultChecked={Boolean((ownerSettings?.widget_preferences as Record<string, unknown> | undefined)?.compactWidgets)}
            />
            Compact widgets
          </label>
          <button type="submit" className="md:col-span-3 w-full md:w-auto px-3 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-100">
            Save preferences
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-2">Billing & Stripe</h2>
        <p className="text-sm text-slate-400 mb-4">Status vizibil pentru configurarea curentă de billing.</p>

        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${billingStatus.connected ? "bg-emerald-400" : "bg-rose-400"}`}
          />
          <p className="text-slate-100 font-medium">
            {billingStatus.connected ? "Connected" : "Not configured"}
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-1">Mode: {billingStatus.mode}</p>

        {billingStatus.issues.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-rose-300">
            {billingStatus.issues.map((issue) => (
              <li key={issue}>- {issue}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-emerald-300">Toate variabilele Stripe necesare sunt prezente.</p>
        )}

        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300">
          <p className="font-medium text-slate-100">Diagnostic endpoint</p>
          <p className="mt-1 text-slate-400">GET /api/owner/billing/diagnostic (owner/admin only)</p>
          {latestWebhook ? (
            <p className="mt-2">
              Ultimul webhook: {latestWebhook.event_type} ({latestWebhook.status}) la {new Date(latestWebhook.received_at).toLocaleString("ro-RO")}
            </p>
          ) : (
            <p className="mt-2 text-slate-400">Nu există încă evenimente în webhook_events.</p>
          )}
          {latestBillingEvent ? (
            <p className="mt-1">
              Ultimul billing operational event: {formatOperationalEventType(latestBillingEvent.event_type)} ({latestBillingEvent.outcome}) la {new Date(latestBillingEvent.created_at).toLocaleString("ro-RO")}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
