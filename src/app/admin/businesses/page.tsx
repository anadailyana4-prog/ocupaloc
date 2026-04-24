import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TZ = "Europe/Bucharest";

type HealthBand = "critical" | "at_risk" | "watch" | "healthy";

const HEALTH_BAND_CONFIG: Record<HealthBand, { label: string; badgeClasses: string; rowBg: string }> = {
  critical: { label: "CRITIC",  badgeClasses: "bg-red-900/80 text-red-100 border border-red-700",    rowBg: "bg-red-950/25" },
  at_risk:  { label: "LA RISC", badgeClasses: "bg-orange-900/80 text-orange-200 border border-orange-700", rowBg: "bg-orange-950/20" },
  watch:    { label: "ATENȚIE", badgeClasses: "bg-amber-900/80 text-amber-200 border border-amber-700",  rowBg: "bg-amber-950/10" },
  healthy:  { label: "OK",      badgeClasses: "bg-emerald-900/80 text-emerald-200 border border-emerald-700", rowBg: "bg-zinc-950" },
};

export default async function AdminBusinessesPage() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    return (
      <div className="p-8 text-red-400">
        <p className="font-mono text-sm">ADMIN_EMAIL env var not set. Set it to enable the admin panel.</p>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  if (!user || user.email !== adminEmail) {
    redirect("/dashboard");
  }

  const admin = createSupabaseServiceClient();

  const { data: businesses, error } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, created_at, onboarding_pas")
    .order("created_at", { ascending: false })
    .limit(500);

  // Batch-fetch auth users to display last login without N+1 queries
  const lastLoginMap = new Map<string, string | null>(); // email → last_sign_in_at
  try {
    let page = 1;
    while (true) {
      const { data: authPage } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!authPage?.users?.length) break;
      for (const u of authPage.users) {
        if (u.email) lastLoginMap.set(u.email, u.last_sign_in_at ?? null);
      }
      if (authPage.users.length < 1000) break;
      page++;
    }
  } catch {
    // non-fatal — last login column will just show "—"
  }

  if (error) {
    return (
      <div className="p-8 text-red-400">
        <p className="font-mono text-sm">Eroare: {error.message}</p>
      </div>
    );
  }

  const profIds = (businesses ?? []).map((s) => s.id);

  const { data: subs } = await admin
    .from("subscriptions")
    .select("profesionist_id, status, current_period_end")
    .in("profesionist_id", profIds)
    .order("created_at", { ascending: false });

  const subMap = new Map<string, { status: string; current_period_end: string | null }>();
  for (const sub of subs ?? []) {
    if (!subMap.has(sub.profesionist_id)) {
      subMap.set(sub.profesionist_id, sub);
    }
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Booking stats: all bookings in last 30d
  const { data: bookingStats } = await admin
    .from("programari")
    .select("profesionist_id, data_start, status")
    .in("profesionist_id", profIds)
    .gte("data_start", thirtyDaysAgo)
    .order("data_start", { ascending: false })
    .limit(10000);

  // Client-initiated cancellations (30d) for confirmation rate
  const { data: clientCancelStats } = await admin
    .from("programari_status_events")
    .select("profesionist_id")
    .in("profesionist_id", profIds)
    .eq("status", "anulat")
    .eq("source", "client_link")
    .gte("created_at", thirtyDaysAgo);

  const lastBookingMap = new Map<string, string>();
  const weekCountMap = new Map<string, number>();
  const prevWeekCountMap = new Map<string, number>();
  const totalBookings30dMap = new Map<string, number>();
  const noShowCountMap = new Map<string, number>();
  const completedCountMap = new Map<string, number>();

  for (const b of bookingStats ?? []) {
    if (!lastBookingMap.has(b.profesionist_id)) {
      lastBookingMap.set(b.profesionist_id, b.data_start);
    }
    if (b.status === "confirmat" || b.status === "finalizat") {
      totalBookings30dMap.set(b.profesionist_id, (totalBookings30dMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.data_start >= weekAgo && (b.status === "confirmat" || b.status === "finalizat")) {
      weekCountMap.set(b.profesionist_id, (weekCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.data_start >= twoWeeksAgo && b.data_start < weekAgo && (b.status === "confirmat" || b.status === "finalizat")) {
      prevWeekCountMap.set(b.profesionist_id, (prevWeekCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.status === "noaparit") {
      noShowCountMap.set(b.profesionist_id, (noShowCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.status === "finalizat") {
      completedCountMap.set(b.profesionist_id, (completedCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
  }

  const clientCancelCountMap = new Map<string, number>();
  for (const e of clientCancelStats ?? []) {
    const pid = e.profesionist_id as string;
    clientCancelCountMap.set(pid, (clientCancelCountMap.get(pid) ?? 0) + 1);
  }

  const FOURTEEN_DAYS_AGO = twoWeeksAgo;
  const BILLING_TRIAL_DAYS = 30;

  const rows = (businesses ?? []).map((s) => {
    const createdAt = s.created_at ? new Date(s.created_at) : null;
    const trialEnd = createdAt ? new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000) : null;
    const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
    const subStatus = subMap.get(s.id)?.status ?? "trial";
    const lastBookingIso = lastBookingMap.get(s.id) ?? null;
    const isQuiet14d = !lastBookingIso || lastBookingIso < FOURTEEN_DAYS_AGO;
    const isActive = subStatus === "active" || subStatus === "trialing";
    const isTrialExpiringSoon = subStatus === "trial" && trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft >= 0;
    const isPastDue = subStatus === "past_due";
    const neverBooked = !lastBookingMap.has(s.id);
    // At-risk: quiet 14d + NOT on active/trialing subscription
    const atRisk = isQuiet14d && !isActive;
    // Quietly paying: has had bookings but quiet 14d + subscription IS active (churn signal)
    const isQuietPaying = isQuiet14d && isActive && !neverBooked;

    const confirmed30d = totalBookings30dMap.get(s.id) ?? 0;
    const noShows30d = noShowCountMap.get(s.id) ?? 0;
    const clientCancels30d = clientCancelCountMap.get(s.id) ?? 0;
    const qualityTotal = confirmed30d + noShows30d + clientCancels30d;
    const confirmationRate30d = qualityTotal >= 5
      ? Math.round((confirmed30d / qualityTotal) * 100)
      : null;

    const accountAgeDays = createdAt ? Math.floor((Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)) : 0;
    const onboardingDone = (s.onboarding_pas ?? 0) >= 4;
    const isTrialExpired = subStatus === "trial" && trialDaysLeft !== null && trialDaysLeft < 0;
    const lastLoginDaysVal = (() => {
      const email = s.email_contact ?? null;
      const lsi = email ? lastLoginMap.get(email) ?? null : null;
      if (!lsi) return null;
      return Math.floor((Date.now() - new Date(lsi).getTime()) / (24 * 60 * 60 * 1000));
    })();
    const healthBand: HealthBand = (() => {
      if (!onboardingDone) return "critical";
      if (subStatus === "past_due" || subStatus === "canceled") return "critical";
      if (isTrialExpired) return "critical";
      // 14d quiet threshold: accounts older than 14 days with no booking in 14d are at_risk
      if (isQuiet14d && accountAgeDays > 14) return "at_risk";
      if (confirmationRate30d !== null && confirmationRate30d < 60) return "at_risk";
      if (isTrialExpiringSoon) return "watch";
      if (confirmationRate30d !== null && confirmationRate30d < 80) return "watch";
      if ((lastLoginDaysVal ?? 0) > 30) return "watch";
      if (isQuiet14d) return "watch"; // new account (≤14d old) still quiet — watch not at_risk
      return "healthy";
    })();

    return {
      id: s.id,
      slug: s.slug ?? "—",
      email: s.email_contact ?? "—",
      business: s.nume_business?.trim() || "—",
      createdAt: s.created_at ? formatInTimeZone(new Date(s.created_at), TZ, "dd.MM.yyyy") : "—",
      onboardingDone,
      subStatus,
      subEnd: subMap.get(s.id)?.current_period_end
        ? formatInTimeZone(new Date(subMap.get(s.id)!.current_period_end!), TZ, "dd.MM.yyyy")
        : "—",
      lastBooking: lastBookingMap.has(s.id)
        ? formatInTimeZone(new Date(lastBookingMap.get(s.id)!), TZ, "dd.MM.yyyy")
        : "nicio programare",
      lastLogin: lastLoginDaysVal !== null ? `${lastLoginDaysVal}z` : "—",
      lastLoginDays: lastLoginDaysVal,
      bookingsThisWeek: weekCountMap.get(s.id) ?? 0,
      bookingsPrevWeek: prevWeekCountMap.get(s.id) ?? 0,
      totalBookings30d: totalBookings30dMap.get(s.id) ?? 0,
      noShows30d,
      clientCancels30d,
      confirmationRate30d,
      atRisk,
      neverBooked,
      isQuiet14d,
      isQuietPaying,
      isTrialExpiringSoon,
      isPastDue,
      trialDaysLeft,
      isTrialExpired,
      healthBand,
    };
  }).sort((a, b) => {
    const bandOrder: Record<string, number> = { critical: 0, at_risk: 1, watch: 2, healthy: 3 };
    return (bandOrder[a.healthBand] ?? 4) - (bandOrder[b.healthBand] ?? 4);
  });

  const subBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-700 text-emerald-100",
      trialing: "bg-sky-700 text-sky-100",
      trial: "bg-zinc-700 text-zinc-300",
      past_due: "bg-red-700 text-red-100",
      canceled: "bg-zinc-800 text-zinc-400",
      incomplete: "bg-orange-700 text-orange-100",
      paused: "bg-yellow-700 text-yellow-100",
    };
    return map[status] ?? "bg-zinc-700 text-zinc-300";
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-50">Admin — Conturi ({rows.length})</h1>
          <a
            href="/api/admin/businesses-csv"
            className="rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            ↓ CSV
          </a>
        </div>
        <p className="mt-1 text-sm text-zinc-400">Vizibil numai pentru {adminEmail}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
          <span><span className="inline-block w-2 h-2 rounded-full bg-red-700 mr-1"></span>CRITIC — setup/billing/expirat</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-orange-700 mr-1"></span>LA RISC — inactiv 14z / conf. &lt;60%</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-amber-700 mr-1"></span>ATENȚIE — conf. &lt;80% / login vechi / trial expiră</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-700 mr-1"></span>OK — fără probleme critice</span>
        </div>
      </div>

      {/* Fleet health distribution */}
      {(() => {
        const criticalCount = rows.filter((r) => r.healthBand === "critical").length;
        const atRiskCount   = rows.filter((r) => r.healthBand === "at_risk").length;
        const watchCount    = rows.filter((r) => r.healthBand === "watch").length;
        const healthyCount  = rows.filter((r) => r.healthBand === "healthy").length;
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Critic",    value: criticalCount, valueColor: criticalCount > 0 ? "text-red-400"     : "text-zinc-600", border: criticalCount > 0 ? "border-red-900/50"    : "border-zinc-800" },
              { label: "La risc",  value: atRiskCount,   valueColor: atRiskCount   > 0 ? "text-orange-400"  : "text-zinc-600", border: atRiskCount   > 0 ? "border-orange-900/50" : "border-zinc-800" },
              { label: "Atenţie",  value: watchCount,    valueColor: watchCount    > 0 ? "text-amber-400"   : "text-zinc-600", border: watchCount    > 0 ? "border-amber-900/50"  : "border-zinc-800" },
              { label: "Sănătos",  value: healthyCount,  valueColor: healthyCount  > 0 ? "text-emerald-400" : "text-zinc-600", border: "border-zinc-800" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border ${s.border} bg-zinc-900/60 px-4 py-3`}>
                <p className={`text-3xl font-bold ${s.valueColor}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Fleet operational stats */}
      {(() => {
        const totalBusinesses = rows.length;
        const onboardedCount = rows.filter((r) => r.onboardingDone).length;
        const activeSubCount = rows.filter((r) => r.subStatus === "active" || r.subStatus === "trialing").length;
        const activeThisWeek = rows.filter((r) => r.bookingsThisWeek > 0).length;
        const atRiskCount = rows.filter((r) => r.atRisk || r.isPastDue).length;
        const neverBookedCount = rows.filter((r) => r.neverBooked).length;
        const trialExpiringCount = rows.filter((r) => r.isTrialExpiringSoon).length;
        const totalBookings30d = rows.reduce((sum, r) => sum + r.totalBookings30d, 0);
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { label: "Total conturi", value: totalBusinesses, color: "text-amber-50" },
              { label: "Setup complet", value: onboardedCount, color: "text-emerald-300" },
              { label: "Abonament activ", value: activeSubCount, color: "text-sky-300" },
              { label: "Activi 7z", value: activeThisWeek, color: activeThisWeek > 0 ? "text-emerald-400" : "text-zinc-500" },
              { label: "La risc", value: atRiskCount, color: atRiskCount > 0 ? "text-red-400" : "text-zinc-500" },
              { label: "Nicio programare", value: neverBookedCount, color: neverBookedCount > 0 ? "text-violet-400" : "text-zinc-500" },
              { label: "Trial expiră", value: trialExpiringCount, color: trialExpiringCount > 0 ? "text-amber-400" : "text-zinc-500" },
              { label: "Programări (30z)", value: totalBookings30d, color: totalBookings30d > 0 ? "text-violet-300" : "text-zinc-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="overflow-x-auto rounded-xl border border-zinc-700">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-700 bg-zinc-900 text-left text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Slug / Email</th>
              <th className="px-4 py-3">Creat</th>
              <th className="px-4 py-3">Setup</th>
              <th className="px-4 py-3">Abonament</th>
              <th className="px-4 py-3">Expiră</th>
              <th className="px-4 py-3">Ultima prog.</th>
              <th className="px-4 py-3">Ultim login</th>
              <th className="px-4 py-3">7z</th>
              <th className="px-4 py-3">30z</th>
              <th className="px-4 py-3">Trend 7z</th>
              <th className="px-4 py-3">Calitate (30z)</th>
              <th className="px-4 py-3">Sănătate</th>
              <th className="px-4 py-3">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`hover:bg-zinc-900/60 ${HEALTH_BAND_CONFIG[r.healthBand].rowBg}`}
              >
                <td className="px-4 py-3 font-medium text-white">{r.business}</td>
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-zinc-300">{r.slug}</div>
                  <div className="text-xs text-zinc-500">{r.email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-400">{r.createdAt}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${r.onboardingDone ? "bg-emerald-900 text-emerald-300" : "bg-yellow-900 text-yellow-300"}`}>
                    {r.onboardingDone ? "✓ gata" : "⚠ incomplet"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${subBadge(r.subStatus)}`}>
                    {r.subStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.subEnd}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{r.lastBooking}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={r.lastLoginDays === null ? "text-zinc-600" : r.lastLoginDays > 30 ? "text-red-400" : r.lastLoginDays > 14 ? "text-amber-400" : "text-emerald-400"}>
                    {r.lastLogin}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${r.bookingsThisWeek === 0 ? "text-red-400" : r.bookingsThisWeek >= 5 ? "text-emerald-400" : "text-amber-300"}`}>
                    {r.bookingsThisWeek}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${r.totalBookings30d === 0 ? "text-red-400" : r.totalBookings30d >= 20 ? "text-emerald-400" : "text-amber-300"}`}>
                    {r.totalBookings30d}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {r.bookingsThisWeek > r.bookingsPrevWeek ? (
                    <span className="text-emerald-400 font-semibold">▲ +{r.bookingsThisWeek - r.bookingsPrevWeek}</span>
                  ) : r.bookingsThisWeek < r.bookingsPrevWeek ? (
                    <span className="text-red-400 font-semibold">▼ -{r.bookingsPrevWeek - r.bookingsThisWeek}</span>
                  ) : (
                    <span className="text-zinc-500">= {r.bookingsThisWeek}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {r.confirmationRate30d !== null ? (
                    <div>
                      <span className={`font-bold text-sm ${r.confirmationRate30d >= 80 ? "text-emerald-400" : r.confirmationRate30d >= 60 ? "text-amber-400" : "text-red-400"}`}>
                        {r.confirmationRate30d}%
                      </span>
                      <div className="text-zinc-500 mt-0.5">
                        {r.noShows30d > 0 ? `${r.noShows30d} no-show` : ""}
                        {r.noShows30d > 0 && r.clientCancels30d > 0 ? " · " : ""}
                        {r.clientCancels30d > 0 ? `${r.clientCancels30d} anulat` : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-600">
                      {r.noShows30d > 0 ? (
                        <span className={r.noShows30d >= 3 ? "text-orange-400" : "text-zinc-400"}>{r.noShows30d} no-show</span>
                      ) : "—"}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${HEALTH_BAND_CONFIG[r.healthBand].badgeClasses}`}>
                    {HEALTH_BAND_CONFIG[r.healthBand].label}
                  </span>
                  {(() => {
                    let reason = "";
                    if (!r.onboardingDone)                                               reason = "setup incomplet";
                    else if (r.isPastDue)                                                reason = "plată restantă";
                    else if (r.isTrialExpired)                                           reason = "trial expirat";
                    else if (r.neverBooked)                                              reason = "fără prog. 30z";
                    else if (r.isQuiet14d)                                               reason = "inactiv 14z";
                    else if (r.isTrialExpiringSoon)                                      reason = `trial ${r.trialDaysLeft}z`;
                    else if (r.confirmationRate30d !== null && r.confirmationRate30d < 80) reason = `conf. ${r.confirmationRate30d}%`;
                    else if ((r.lastLoginDays ?? 0) > 30)                               reason = "login >30z";
                    return reason ? <div className="mt-1 text-xs text-zinc-400">{reason}</div> : null;
                  })()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    {r.slug !== "—" ? (
                      <a
                        href={`/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-sky-400 hover:underline"
                      >
                        Pagina
                      </a>
                    ) : null}
                    {r.email !== "—" ? (
                      <a
                        href={`mailto:${r.email}`}
                        className="text-xs text-zinc-400 hover:text-amber-300 hover:underline"
                      >
                        Email
                      </a>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600">Pagina se reîncarcă la fiecare request. Nu se cacheează.</p>
    </div>
  );
}
