import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TZ = "Europe/Bucharest";

export default async function AdminSalonsPage() {
  // Auth: must be the configured admin email
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

  // Fetch all profesionisti with their sub status
  const { data: salons, error } = await admin
    .from("profesionisti")
    .select("id, slug, email_contact, nume_business, created_at, onboarding_pas")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return (
      <div className="p-8 text-red-400">
        <p className="font-mono text-sm">Eroare: {error.message}</p>
      </div>
    );
  }

  // Fetch subscription statuses for all salons
  const profIds = (salons ?? []).map((s) => s.id);

  const { data: subs } = await admin
    .from("subscriptions")
    .select("profesionist_id, status, current_period_end")
    .in("profesionist_id", profIds)
    .order("created_at", { ascending: false });

  // Build a map: profId → latest sub
  const subMap = new Map<string, { status: string; current_period_end: string | null }>();
  for (const sub of subs ?? []) {
    if (!subMap.has(sub.profesionist_id)) {
      subMap.set(sub.profesionist_id, sub);
    }
  }

  // Fetch last booking date, this-week count, and no-show stats per salon
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: bookingStats } = await admin
    .from("programari")
    .select("profesionist_id, data_start, status")
    .in("profesionist_id", profIds)
    .gte("data_start", thirtyDaysAgo)
    .order("data_start", { ascending: false })
    .limit(10000);

  const lastBookingMap = new Map<string, string>();
  const weekCountMap = new Map<string, number>();
  const noShowCountMap = new Map<string, number>();
  const completedCountMap = new Map<string, number>();

  for (const b of bookingStats ?? []) {
    // Last booking (any status for recency check)
    if (!lastBookingMap.has(b.profesionist_id)) {
      lastBookingMap.set(b.profesionist_id, b.data_start);
    }
    if (b.data_start >= weekAgo && (b.status === "confirmat" || b.status === "finalizat")) {
      weekCountMap.set(b.profesionist_id, (weekCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.status === "noaparit") {
      noShowCountMap.set(b.profesionist_id, (noShowCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
    if (b.status === "finalizat") {
      completedCountMap.set(b.profesionist_id, (completedCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
  }

  const FOURTEEN_DAYS_AGO = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const BILLING_TRIAL_DAYS = 30;

  const rows = (salons ?? []).map((s) => {
    const createdAt = s.created_at ? new Date(s.created_at) : null;
    const trialEnd = createdAt ? new Date(createdAt.getTime() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000) : null;
    const trialDaysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null;
    const subStatus = subMap.get(s.id)?.status ?? "trial";
    const lastBookingIso = lastBookingMap.get(s.id) ?? null;
    const isQuiet14d = !lastBookingIso || lastBookingIso < FOURTEEN_DAYS_AGO;
    const isActive = subStatus === "active" || subStatus === "trialing";
    const isTrialExpiringSoon = subStatus === "trial" && trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft >= 0;
    const isPastDue = subStatus === "past_due";
    // At-risk: quiet for 14d AND not actively paying
    const atRisk = isQuiet14d && !isActive;
    return {
      id: s.id,
      slug: s.slug ?? "—",
      email: s.email_contact ?? "—",
      business: s.nume_business?.trim() || "—",
      createdAt: s.created_at ? formatInTimeZone(new Date(s.created_at), TZ, "dd.MM.yyyy") : "—",
      onboardingDone: (s.onboarding_pas ?? 0) >= 4,
      subStatus,
      subEnd: subMap.get(s.id)?.current_period_end
        ? formatInTimeZone(new Date(subMap.get(s.id)!.current_period_end!), TZ, "dd.MM.yyyy")
        : "—",
      lastBooking: lastBookingMap.has(s.id)
        ? formatInTimeZone(new Date(lastBookingMap.get(s.id)!), TZ, "dd.MM.yyyy")
        : "nicio programare",
      bookingsThisWeek: weekCountMap.get(s.id) ?? 0,
      noShows30d: noShowCountMap.get(s.id) ?? 0,
      completed30d: completedCountMap.get(s.id) ?? 0,
      atRisk,
      isTrialExpiringSoon,
      isPastDue,
      trialDaysLeft
    };
  }).sort((a, b) => {
    // Bubble at-risk and past_due salons to top
    const aUrgent = a.atRisk || a.isPastDue ? 0 : a.isTrialExpiringSoon ? 1 : 2;
    const bUrgent = b.atRisk || b.isPastDue ? 0 : b.isTrialExpiringSoon ? 1 : 2;
    return aUrgent - bUrgent;
  });

  const subBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-emerald-700 text-emerald-100",
      trialing: "bg-sky-700 text-sky-100",
      trial: "bg-zinc-700 text-zinc-300",
      past_due: "bg-red-700 text-red-100",
      canceled: "bg-zinc-800 text-zinc-400",
      incomplete: "bg-orange-700 text-orange-100",
      paused: "bg-yellow-700 text-yellow-100"
    };
    return map[status] ?? "bg-zinc-700 text-zinc-300";
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-amber-50">Admin — Saloane ({rows.length})</h1>
        <p className="mt-1 text-sm text-zinc-400">Vizibil numai pentru {adminEmail}</p>
        <div className="mt-2 flex gap-3 text-xs text-zinc-500">
          <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>risc / inactiv 14z</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1"></span>trial expiră ≤5z</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1"></span>plată restantă</span>
        </div>
      </div>

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
              <th className="px-4 py-3">7 zile</th>
              <th className="px-4 py-3">No-show (30z)</th>
              <th className="px-4 py-3">Risc</th>
              <th className="px-4 py-3">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className={`hover:bg-zinc-900/60 ${r.atRisk || r.isPastDue ? "bg-red-950/20" : r.isTrialExpiringSoon ? "bg-amber-950/20" : "bg-zinc-950"}`}>
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
                <td className="px-4 py-3">
                  <span className={`font-semibold ${r.bookingsThisWeek === 0 ? "text-red-400" : r.bookingsThisWeek >= 5 ? "text-emerald-400" : "text-amber-300"}`}>
                    {r.bookingsThisWeek}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {r.noShows30d > 0 ? (
                    <span className={`font-semibold ${r.noShows30d >= 3 ? "text-red-400" : "text-orange-400"}`}>
                      {r.noShows30d} neprez.
                      {r.completed30d > 0 ? (
                        <span className="ml-1 text-zinc-500">({Math.round((r.noShows30d / (r.noShows30d + r.completed30d)) * 100)}%)</span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-zinc-600">0</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {r.atRisk ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-900/60 px-2 py-0.5 text-xs font-semibold text-red-300">
                        ● inactiv 14z
                      </span>
                    ) : null}
                    {r.isTrialExpiringSoon ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/60 px-2 py-0.5 text-xs font-semibold text-amber-300">
                        ⏳ trial {r.trialDaysLeft}z
                      </span>
                    ) : null}
                    {r.isPastDue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-900/60 px-2 py-0.5 text-xs font-semibold text-orange-300">
                        ⚠ restant
                      </span>
                    ) : null}
                    {!r.atRisk && !r.isTrialExpiringSoon && !r.isPastDue ? (
                      <span className="text-xs text-zinc-600">—</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
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
