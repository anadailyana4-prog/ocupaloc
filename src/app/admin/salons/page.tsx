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

  // Fetch last booking date and this-week count per salon
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: bookingStats } = await admin
    .from("programari")
    .select("profesionist_id, data_start")
    .in("profesionist_id", profIds)
    .order("data_start", { ascending: false })
    .limit(5000);

  const lastBookingMap = new Map<string, string>();
  const weekCountMap = new Map<string, number>();
  for (const b of bookingStats ?? []) {
    if (!lastBookingMap.has(b.profesionist_id)) {
      lastBookingMap.set(b.profesionist_id, b.data_start);
    }
    if (b.data_start >= weekAgo) {
      weekCountMap.set(b.profesionist_id, (weekCountMap.get(b.profesionist_id) ?? 0) + 1);
    }
  }

  const rows = (salons ?? []).map((s) => ({
    id: s.id,
    slug: s.slug ?? "—",
    email: s.email_contact ?? "—",
    business: s.nume_business?.trim() || "—",
    createdAt: s.created_at ? formatInTimeZone(new Date(s.created_at), TZ, "dd.MM.yyyy") : "—",
    onboardingDone: (s.onboarding_pas ?? 0) >= 4,
    subStatus: subMap.get(s.id)?.status ?? "trial",
    subEnd: subMap.get(s.id)?.current_period_end
      ? formatInTimeZone(new Date(subMap.get(s.id)!.current_period_end!), TZ, "dd.MM.yyyy")
      : "—",
    lastBooking: lastBookingMap.has(s.id)
      ? formatInTimeZone(new Date(lastBookingMap.get(s.id)!), TZ, "dd.MM.yyyy")
      : "nicio programare",
    bookingsThisWeek: weekCountMap.get(s.id) ?? 0
  }));

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
              <th className="px-4 py-3">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className="bg-zinc-950 hover:bg-zinc-900/60">
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
