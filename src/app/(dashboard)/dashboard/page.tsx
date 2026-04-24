import { subDays } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivationWidgets } from "./activation-widgets";
import { AddManualBookingDialog, type ServiciuOption } from "./add-manual-booking-dialog";
import { CopyPublicLinkButton } from "./copy-public-link";
import { ProgramariTable, type ProgramareRow } from "./programari-table";
import { Button } from "@/components/ui/button";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { parseProgramJson, ziKeyFromDate } from "@/lib/program";
import { computeFreeSlots } from "@/lib/slots";
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{ saved?: string; error?: string; filter?: string; info?: string }>;
};

export const dynamic = "force-dynamic";

function relOne<T>(x: T | T[] | null | undefined): T | null {
  if (x == null) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}

type ProgRow = {
  id: string;
  data_start: string;
  data_final: string;
  status: string;
  nume_client: string;
  telefon_client: string;
  servicii: { nume: string } | { nume: string }[] | null;
};

type DashboardProfile = {
  id?: string;
  created_at?: string | null;
  slug?: string | null;
  telefon?: string | null;
  description?: string | null;
  nume_business?: string | null;
  onboarding_pas?: number | null;
  program?: Record<string, unknown> | null;
  pauza_intre_clienti?: number | null;
  timp_pregatire?: number | null;
  lucreaza_acasa?: boolean | null;
};

export default async function DashboardHomePage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  let greetName = user.email?.split("@")[0] ?? "acolo";

  const { data: prof, error: profErr, telefonColumnAvailable } = await selectWithTelefonFallback<DashboardProfile>(
    async (columns) => await supabase.from("profesionisti").select(columns).eq("user_id", user.id).maybeSingle(),
    "id, created_at, slug, telefon, description, nume_business, onboarding_pas, program, pauza_intre_clienti, timp_pregatire, lucreaza_acasa",
    "id, created_at, slug, description, nume_business, onboarding_pas, program, pauza_intre_clienti, timp_pregatire, lucreaza_acasa"
  );

  if (profErr || !prof?.id) {
    redirect("/onboarding");
  }

  if ((prof.onboarding_pas ?? 0) < 4) {
    redirect("/onboarding");
  }

  if (prof.nume_business?.trim()) {
    greetName = prof.nume_business.trim();
  }

  const sp = searchParams ? await searchParams : {};
  const filter = sp.filter === "azi" || sp.filter === "toate" ? sp.filter : "viitoare";

  // Fetch subscription status for banner
  let subStatus: string | null = null;
  let subPeriodEnd: Date | null = null;
  if (prof?.id) {
    const adminClient = createSupabaseServiceClient();
    const { data: subRow } = await adminClient
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("profesionist_id", String(prof.id))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subStatus = subRow?.status ?? null;
    subPeriodEnd = subRow?.current_period_end ? new Date(subRow.current_period_end) : null;
  }

  const { count: serviciiCount } = await supabase
    .from("servicii")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id);

  const { data: serviciiActve } = await supabase
    .from("servicii")
    .select("id, nume, durata_minute")
    .eq("profesionist_id", prof.id)
    .eq("activ", true)
    .order("nume", { ascending: true });

  const serviciiOptions: ServiciuOption[] = (serviciiActve ?? []).map((s) => ({
    id: s.id,
    name: s.nume,
    duration_min: s.durata_minute
  }));

  const programRaw = prof.program as Record<string, unknown> | null;
  const programSetat = Boolean(
    programRaw &&
      Object.values(programRaw).some((value) => Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string")
  );
  const profileDone = Boolean(prof.nume_business?.trim() && (!telefonColumnAvailable || prof.telefon?.trim()));

  const todayLocal = formatInTimeZone(new Date(), "Europe/Bucharest", "yyyy-MM-dd");
  const dayStartIso = toDate(`${todayLocal}T00:00:00`, { timeZone: "Europe/Bucharest" }).toISOString();
  const dayEndIso = toDate(`${todayLocal}T23:59:59`, { timeZone: "Europe/Bucharest" }).toISOString();
  const sevenDaysAgoIso = subDays(new Date(), 7).toISOString();

  let progQuery = supabase
    .from("programari")
    .select("id, data_start, data_final, status, nume_client, telefon_client, servicii(nume)")
    .eq("profesionist_id", prof.id)
    .order("data_start", { ascending: filter !== "toate" })
    .limit(100);

  if (filter === "azi") {
    progQuery = progQuery.gte("data_start", dayStartIso).lte("data_start", dayEndIso);
  } else if (filter === "viitoare") {
    progQuery = progQuery.gte("data_start", new Date().toISOString());
  } else {
    // toate — show last 30 days + future
    progQuery = progQuery.gte("data_start", subDays(new Date(), 30).toISOString());
  }

  const { data: rawProg, error: progErr } = await progQuery;

  // --- Semafor vizual pentru ziua de azi ---
  type SemaforStatus = "closed" | "free" | "full";
  let semaforStatus: SemaforStatus = "free";
  let semaforBookingsToday = 0;

  const todayInBucharest = toDate(`${todayLocal}T12:00:00`, { timeZone: "Europe/Bucharest" });
  const parsedProgram = parseProgramJson(programRaw);
  const todayDayKey = ziKeyFromDate(todayInBucharest);
  const todayInterval = parsedProgram[todayDayKey];

  if (!Array.isArray(todayInterval) || todayInterval.length !== 2) {
    semaforStatus = "closed";
  } else {
    const { data: todayBookings } = await supabase
      .from("programari")
      .select("id, data_start, data_final, servicii(durata_minute)")
      .eq("profesionist_id", prof.id)
      .in("status", ["confirmat", "in_asteptare"])
      .gte("data_start", dayStartIso)
      .lte("data_start", dayEndIso);

    semaforBookingsToday = (todayBookings ?? []).length;

    // Calculul corect: verifică dacă mai există vreun slot liber pentru cel mai scurt serviciu activ.
    const minDuration = (serviciiActve ?? []).reduce<number>((min, s) => Math.min(min, s.durata_minute ?? 60), 60);
    const pauzaIntre = Number(prof.pauza_intre_clienti ?? 0);
    const timpPreg = (prof.lucreaza_acasa ?? false) ? Number(prof.timp_pregatire ?? 0) : 0;

    const ocupate = (todayBookings ?? []).map((row) => ({
      start: new Date(row.data_start),
      end: new Date(row.data_final)
    }));

    const freeSlots = computeFreeSlots(todayLocal, parsedProgram, minDuration, pauzaIntre, timpPreg, ocupate);
    semaforStatus = freeSlots.length === 0 ? "full" : "free";
  }

  const semaforConfig = {
    closed: { dot: "bg-zinc-500", label: "Zi liberă", sub: "Nu lucrezi azi conform programului" },
    free: { dot: "bg-emerald-500", label: "Locuri disponibile", sub: `${semaforBookingsToday} programări confirmate azi` },
    full: { dot: "bg-red-500", label: "Zi plină", sub: `${semaforBookingsToday} programări — nu mai sunt locuri` },
  };
  // ---

  const { count: remindersSentToday } = await supabase
    .from("programari_reminders")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .gte("sent_at", dayStartIso)
    .lte("sent_at", dayEndIso);

  const { count: cancelledByClient } = await supabase
    .from("programari_status_events")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "anulat")
    .eq("source", "client_link")
    .gte("created_at", sevenDaysAgoIso);

  const { count: clientConfirmations } = await supabase
    .from("programari_status_events")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "confirmat")
    .eq("source", "client_link")
    .gte("created_at", sevenDaysAgoIso);

  const clientDecisions = (clientConfirmations ?? 0) + (cancelledByClient ?? 0);
  const confirmationRate7d = clientDecisions > 0 ? Math.round(((clientConfirmations ?? 0) / clientDecisions) * 100) : null;

  const sevenDaysAheadIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: upcomingNext7dCount } = await supabase
    .from("programari")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "confirmat")
    .gte("data_start", new Date().toISOString())
    .lte("data_start", sevenDaysAheadIso);

  // Overdue: past confirmed bookings not yet finalized or no-showed — operator should act on these
  const { count: overdueCount } = await supabase
    .from("programari")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "confirmat")
    .lt("data_start", new Date().toISOString());

  // Fetch confirmed bookings next 7d with dates for planning signals
  const { data: next7dBookingDates } = await supabase
    .from("programari")
    .select("data_start, data_final")
    .eq("profesionist_id", prof.id)
    .eq("status", "confirmat")
    .gte("data_start", new Date().toISOString())
    .lte("data_start", sevenDaysAheadIso);

  // Fetch pending (in_asteptare) bookings next 7d for week grid indicator
  const { data: next7dPendingDates } = await supabase
    .from("programari")
    .select("data_start")
    .eq("profesionist_id", prof.id)
    .eq("status", "in_asteptare")
    .gte("data_start", new Date().toISOString())
    .lte("data_start", sevenDaysAheadIso);

  // Compute busiest upcoming day and next empty working day
  const bookingsByDay = new Map<string, number>();
  for (const b of next7dBookingDates ?? []) {
    const day = formatInTimeZone(new Date(b.data_start), "Europe/Bucharest", "dd.MM");
    bookingsByDay.set(day, (bookingsByDay.get(day) ?? 0) + 1);
  }
  let busiestDay: { label: string; count: number } | null = null;
  for (const [day, count] of bookingsByDay) {
    if (!busiestDay || count > busiestDay.count) busiestDay = { label: day, count };
  }
  // Next working day in next 7d with 0 confirmed bookings (and business is open that day)
  let nextEmptyDay: string | null = null;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    const dayKey = ziKeyFromDate(d);
    const interval = parsedProgram[dayKey];
    if (!Array.isArray(interval) || interval.length !== 2) continue; // closed
    const dayLabel = formatInTimeZone(d, "Europe/Bucharest", "dd.MM");
    if (!bookingsByDay.has(dayLabel)) { nextEmptyDay = dayLabel; break; }
  }

  // Pending bookings by day for week grid amber indicator
  const pendingByDay = new Map<string, number>();
  for (const b of next7dPendingDates ?? []) {
    const day = formatInTimeZone(new Date(b.data_start), "Europe/Bucharest", "dd.MM");
    pendingByDay.set(day, (pendingByDay.get(day) ?? 0) + 1);
  }

  // Utilization % for the next 7 days
  // Scheduled minutes: sum of open hours for each day in weekGrid
  // Booked minutes: sum of (data_final - data_start) for confirmed bookings in next 7d
  let scheduledMinutes = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    const dayKey = ziKeyFromDate(d);
    const interval = parsedProgram[dayKey];
    if (!Array.isArray(interval) || interval.length !== 2) continue;
    const [startStr, endStr] = interval as [string, string];
    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    const dayMinutes = (eh * 60 + em) - (sh * 60 + (sm ?? 0));
    if (dayMinutes > 0) scheduledMinutes += dayMinutes;
  }
  let bookedMinutes = 0;
  for (const b of next7dBookingDates ?? []) {
    if (b.data_final) {
      const diffMs = new Date(b.data_final).getTime() - new Date(b.data_start).getTime();
      bookedMinutes += Math.max(0, Math.round(diffMs / 60000));
    }
  }
  const utilizationPct = scheduledMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / scheduledMinutes) * 100)) : null;
  const DAY_SHORT_RO = ["Du", "Lu", "Ma", "Mi", "Jo", "Vi", "Sâ"];
  const weekGrid = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    const dayLabel = formatInTimeZone(d, "Europe/Bucharest", "dd.MM");
    const dayShort = DAY_SHORT_RO[d.getDay()];
    const dayKey = ziKeyFromDate(d);
    const isOpen = Array.isArray(parsedProgram[dayKey]) && (parsedProgram[dayKey] as unknown[]).length >= 2;
    const count = bookingsByDay.get(dayLabel) ?? 0;
    const pendingCount = pendingByDay.get(dayLabel) ?? 0;
    return { dayLabel, dayShort, count, pendingCount, isOpen, isToday: i === 0 };
  });

  // Pending-confirmation count (in_asteptare) for next 7 days — no-show risk signal
  const pendingNext7dCount = (next7dPendingDates ?? []).length;

  const todayFormatted = formatInTimeZone(new Date(), "Europe/Bucharest", "dd.MM.yyyy");

  // Build repeat-client visit counts + top-clients panel data
  // Query finalized bookings with name + date for rich client intelligence
  const { data: finalisedPhones } = await supabase
    .from("programari")
    .select("telefon_client, nume_client, data_start")
    .eq("profesionist_id", prof.id)
    .eq("status", "finalizat")
    .order("data_start", { ascending: false });

  const phoneVisitCount = new Map<string, number>();
  // For top-clients: phone → {name, count, lastVisit}
  type ClientStat = { name: string; phone: string; count: number; lastVisit: string };
  const clientMap = new Map<string, ClientStat>();

  for (const row of finalisedPhones ?? []) {
    const phone = row.telefon_client as string | null;
    const name = (row.nume_client as string | null) ?? "—";
    const visitDate = (row.data_start as string | null) ?? "";
    if (phone) {
      phoneVisitCount.set(phone, (phoneVisitCount.get(phone) ?? 0) + 1);
      if (!clientMap.has(phone)) {
        clientMap.set(phone, { name, phone, count: 1, lastVisit: visitDate });
      } else {
        const existing = clientMap.get(phone)!;
        existing.count++;
        // data_start is ordered desc so first entry = most recent
        if (!existing.lastVisit || visitDate > existing.lastVisit) existing.lastVisit = visitDate;
      }
    }
  }

  // Top 5 repeat clients (≥2 visits), ranked by visit count desc
  const topClients: ClientStat[] = Array.from(clientMap.values())
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Build no-show count per phone — for repeat no-show warning badge
  const { data: noShowRows } = await supabase
    .from("programari")
    .select("telefon_client")
    .eq("profesionist_id", prof.id)
    .eq("status", "noaparit");

  const phoneNoShowCount = new Map<string, number>();
  for (const row of noShowRows ?? []) {
    const phone = row.telefon_client as string | null;
    if (phone) phoneNoShowCount.set(phone, (phoneNoShowCount.get(phone) ?? 0) + 1);
  }

  const programari: ProgramareRow[] =
    !progErr && rawProg
      ? (rawProg as ProgRow[]).map((p) => {
          const svc = relOne(p.servicii);
          const start = new Date(p.data_start);
          return {
            id: p.id,
            dataStr: formatInTimeZone(start, "Europe/Bucharest", "dd.MM.yyyy"),
            oraStr: formatInTimeZone(start, "Europe/Bucharest", "HH:mm"),
            clientName: p.nume_client ?? "—",
            clientPhone: p.telefon_client ?? "",
            serviceName: svc?.nume ?? "—",
            status: p.status,
            priorVisits: p.telefon_client ? (phoneVisitCount.get(p.telefon_client) ?? 0) : 0,
            repeatNoShows: p.telefon_client ? (phoneNoShowCount.get(p.telefon_client) ?? 0) : 0
          };
        })
      : [];

  // Derive today's upcoming confirmed bookings from already-fetched data
  const todayUpcomingRows = programari.filter(
    (p) => p.dataStr === todayFormatted && p.status === "confirmat" && new Date(`${todayFormatted.split(".").reverse().join("-")}T${p.oraStr}`) >= new Date()
  );

  // Retention signal: fully-set-up salon with zero upcoming confirmed bookings
  const fullySetUp = programSetat && (serviciiCount ?? 0) > 0 && Boolean(prof.slug);
  const upcomingConfirmedCount = programari.filter((p) => p.status === "confirmat").length;
  const showNoBookingsNudge = fullySetUp && upcomingConfirmedCount === 0 && filter !== "azi";

  // Dedicated query for pending confirmations panel (independent of main filter/pagination)
  const { data: pendingBookings } = await supabase
    .from("programari")
    .select("id, data_start, nume_client, telefon_client, servicii(nume)")
    .eq("profesionist_id", prof.id)
    .eq("status", "in_asteptare")
    .gte("data_start", new Date().toISOString())
    .order("data_start", { ascending: true })
    .limit(20);

  // For the post-activation habit panel: count future confirmed bookings only (avoids stale past bookings)
  const { count: allTimeConfirmedCount } = await supabase
    .from("programari")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "confirmat")
    .gte("data_start", new Date().toISOString());

  // Next-best-action: single prioritized hint based on current state
  const nextBestAction: { icon: string; message: string; href: string | null; urgent: boolean } | null = (() => {
    if ((overdueCount ?? 0) > 0) {
      const n = overdueCount ?? 0;
      return {
        icon: "⏰",
        message: `Ai ${n} programări trecute neînchise. Deschide filtrul "Toate" și marchează-le ca finalizate sau neprezentate.`,
        href: "?filter=toate",
        urgent: true,
      };
    }
    if (pendingNext7dCount > 2) {
      return {
        icon: "📋",
        message: `Ai ${pendingNext7dCount} programări în așteptare neconfirmate — contactează clienții sau confirmă-le manual.`,
        href: null,
        urgent: true,
      };
    }
    if (utilizationPct !== null && utilizationPct < 20 && scheduledMinutes > 0) {
      return {
        icon: "📅",
        message: `Agenda săptămânii e ${utilizationPct}% ocupată. Trimite linkul de rezervare la clienți pentru a umple locurile.`,
        href: null,
        urgent: false,
      };
    }
    if (confirmationRate7d !== null && confirmationRate7d < 60 && clientDecisions >= 5) {
      return {
        icon: "⚠️",
        message: `Rata de confirmare ultimele 7 zile: ${confirmationRate7d}%. Verifică dacă reminder-ele de confirmare ajung la clienți.`,
        href: "/dashboard/setari",
        urgent: true,
      };
    }
    return null;
  })();

  return (
    <div className="space-y-12 section-reveal">
      {/* Subscription status banner */}
      {(() => {
        const BILLING_TRIAL_DAYS_LOCAL = 30;
        const createdAt = prof?.created_at ? new Date(prof.created_at as string) : null;
        const trialEnd = createdAt
          ? new Date(createdAt.getTime() + BILLING_TRIAL_DAYS_LOCAL * 24 * 60 * 60 * 1000)
          : null;
        const trialDaysLeft = trialEnd
          ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
          : 0;

        // Render trial banner with urgency tiers
        const renderTrialBanner = (label: string) => {
          if (!trialEnd) return null;
          const isExpired = Date.now() > trialEnd.getTime();
          if (isExpired) {
            return (
              <div className="mx-4 mt-4 rounded-md border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900">
                <span className="font-bold">⛔ Perioada de trial a expirat.</span> Accesul la programări va fi restricționat.{" "}
                <Link href="/billing/checkout" className="font-bold underline">Abonează-te acum →</Link>
              </div>
            );
          }
          if (trialDaysLeft <= 1) {
            return (
              <div className="mx-4 mt-4 rounded-md border-2 border-red-400 bg-red-50 px-4 py-3 text-sm text-red-900">
                <span className="font-bold">⛔ Azi expiră trial-ul!</span> Activează abonamentul pentru a nu pierde accesul.{" "}
                <Link href="/billing/checkout" className="font-bold underline">Activează acum →</Link>
              </div>
            );
          }
          if (trialDaysLeft <= 3) {
            return (
              <div className="mx-4 mt-4 rounded-md border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                ⚠️ {label} - <strong>mai ai doar {trialDaysLeft} zile</strong>. Nu lăsa să expire.{" "}
                <Link href="/billing/checkout" className="font-semibold underline">Activează abonamentul →</Link>
              </div>
            );
          }
          if (trialDaysLeft <= 7) {
            return (
              <div className="mx-4 mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                🕐 {label} - <strong>{trialDaysLeft} zile rămase</strong>.{" "}
                <Link href="/billing/checkout" className="font-medium underline">Activează abonamentul →</Link>
              </div>
            );
          }
          return (
            <div className="mx-4 mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              🕐 {label} - <strong>{trialDaysLeft} zile rămase</strong>.{" "}
              <Link href="/billing/checkout" className="font-medium underline">Activează abonamentul →</Link>
            </div>
          );
        };

        if (!subStatus && trialEnd) {
          return renderTrialBanner("Trial gratuit activ");
        }
        if (subStatus === "trialing") {
          return renderTrialBanner("Trial Stripe activ");
        }
        if (subStatus === "active") {
          const renewalDaysLeft = subPeriodEnd
            ? Math.ceil((subPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
            : null;
          const showRenewalChip = renewalDaysLeft !== null && renewalDaysLeft <= 14 && renewalDaysLeft > 0;
          return (
            <>
              <div className="mx-4 mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                ✅ Abonament activ
                {subPeriodEnd ? ` până pe ${subPeriodEnd.toLocaleDateString("ro-RO")}` : ""}.
              </div>
              {showRenewalChip ? (
                <div className="mx-4 mt-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  🔄 Abonamentul se reînnoiește în <strong>{renewalDaysLeft} {renewalDaysLeft === 1 ? "zi" : "zile"}</strong>.{" "}
                  <Link href="/billing/portal" className="font-medium underline">Gestionează →</Link>
                </div>
              ) : null}
            </>
          );
        }
        if (subStatus === "past_due") {
          return (
            <div className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              ❌ Plată restantă! Abonamentul va fi suspendat în curând.{" "}
              <Link href="/billing/portal" className="font-medium underline">Gestionează -&gt;</Link>
            </div>
          );
        }
        if (subStatus === "canceled") {
          return (
            <div className="mx-4 mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Abonament anulat.{" "}
              <Link href="/billing/checkout" className="font-medium underline">Abonează-te din nou -&gt;</Link>
            </div>
          );
        }
        if (subStatus === "incomplete" || subStatus === "paused") {
          return (
            <div className="mx-4 mt-4 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              ⚠️ {subStatus === "incomplete" ? "Plata nu a fost finalizată." : "Abonament în pauză."}{" "}
              <Link href="/billing/portal" className="font-medium underline">
                {subStatus === "incomplete" ? "Finalizează -&gt;" : "Reactivează -&gt;"}
              </Link>
            </div>
          );
        }
        return null;
      })()}

      {sp.info ? (
        <div className="mx-4 mt-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          ℹ️ {decodeURIComponent(sp.info)}
        </div>
      ) : null}

      <ActivationWidgets
        slug={prof.slug ?? null}
        profileDone={profileDone}
        serviciiCount={serviciiCount ?? 0}
        programSetat={programSetat}
        accountCreatedAt={prof.created_at ?? null}
        confirmedBookingsCount={allTimeConfirmedCount ?? 0}
        showFirstBookingCelebration={
          (allTimeConfirmedCount ?? 0) === 1 &&
          Boolean(prof.created_at) &&
          (Date.now() - new Date(prof.created_at as string).getTime()) < 30 * 24 * 60 * 60 * 1000
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-wide text-amber-50">Bun venit, {greetName}</h1>
          <p className="text-sm text-muted-foreground">Autentificat ca {user.email ?? "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {prof.slug ? <CopyPublicLinkButton slug={prof.slug} /> : null}
          <form action="/api/billing/portal" method="post">
            <Button type="submit" variant="secondary" className="rounded-full">
              Gestionează abonamentul
            </Button>
          </form>
          {prof.slug?.trim() ? (
            <Button asChild variant="secondary" className="rounded-full">
              <a href={`/${prof.slug.trim()}`} target="_blank" rel="noreferrer">
                Deschide pagina publică
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {sp.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">Datele publice au fost salvate.</div>
      ) : null}
      {sp.error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{decodeURIComponent(sp.error)}</div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Pulse business</h2>
          <p className="text-sm text-muted-foreground">KPI operaționali pentru ultimele 7 zile.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lux-card p-5 flex items-start gap-3">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${semaforConfig[semaforStatus].dot} shadow-[0_0_6px_2px] ${semaforStatus === "free" ? "shadow-emerald-500/40" : semaforStatus === "full" ? "shadow-red-500/40" : "shadow-zinc-500/30"}`} />
            <div>
              <p className="text-sm font-medium text-amber-100/90">{semaforConfig[semaforStatus].label}</p>
              <p className="mt-0.5 text-xs text-amber-100/50">{semaforConfig[semaforStatus].sub}</p>
            </div>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">Programări (7 zile)</p>
            <p className="mt-2 text-3xl font-bold text-amber-50">{upcomingNext7dCount ?? 0}</p>
            <p className="mt-1 text-xs text-amber-100/50">confirmate viitoare</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">În așteptare (7z)</p>
            <p className={`mt-2 text-3xl font-bold ${(pendingNext7dCount ?? 0) > 0 ? "text-orange-400" : "text-amber-50"}`}>
              {pendingNext7dCount ?? 0}
            </p>
            <p className="mt-1 text-xs text-amber-100/50">neconfirmate — risc no-show</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">Reminder-e trimise azi</p>
            <p className="mt-2 text-3xl font-bold text-amber-50">{remindersSentToday ?? 0}</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">Rată confirmare client (7z)</p>
            <p className="mt-2 text-3xl font-bold text-amber-50">{confirmationRate7d === null ? "—" : `${confirmationRate7d}%`}</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">Anulări client (7z)</p>
            <p className={`mt-2 text-3xl font-bold ${(cancelledByClient ?? 0) > 2 ? "text-red-400" : "text-amber-50"}`}>
              {cancelledByClient ?? 0}
            </p>
            <p className="mt-1 text-xs text-amber-100/50">anulate de clienți</p>
          </div>
          {utilizationPct !== null ? (
            <div className="lux-card p-5">
              <p className="text-sm text-amber-100/75">Utilizare săptămână</p>
              <p className={`mt-2 text-3xl font-bold ${utilizationPct >= 80 ? "text-emerald-400" : utilizationPct >= 40 ? "text-amber-50" : "text-zinc-500"}`}>
                {utilizationPct}%
              </p>
              <p className="mt-1 text-xs text-amber-100/50">din capacitate ocupat (7z)</p>
            </div>
          ) : null}
          {(overdueCount ?? 0) > 0 ? (
            <a href="?filter=toate" className="lux-card p-5 border-orange-500/30 block hover:border-orange-400/50 transition">
              <p className="text-sm text-orange-300/80">Neînchise (expirate)</p>
              <p className="mt-2 text-3xl font-bold text-orange-400">{overdueCount}</p>
              <p className="mt-1 text-xs text-orange-300/50">confirmate expirate — apasă pentru a le vedea</p>
            </a>
          ) : null}
        </div>

        {/* Next-best-action: single prioritized operator hint */}
        {nextBestAction ? (
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${nextBestAction.urgent ? "border-orange-500/30 bg-orange-950/20" : "border-cyan-700/30 bg-cyan-950/20"}`}>
            <span className="shrink-0 text-base leading-6">{nextBestAction.icon}</span>
            <div className="min-w-0">
              <p className={`text-sm ${nextBestAction.urgent ? "text-orange-100" : "text-cyan-100"}`}>
                {nextBestAction.message}
              </p>
              {nextBestAction.href ? (
                <a
                  href={nextBestAction.href}
                  className={`mt-1 inline-block text-xs font-medium underline ${nextBestAction.urgent ? "text-orange-300" : "text-cyan-300"}`}
                >
                  Acționează →
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Planning signals strip */}
        {(busiestDay || nextEmptyDay) ? (
          <div className="flex flex-wrap gap-3 mt-2">
            {busiestDay ? (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900/50 px-4 py-2 text-xs">
                <span className="text-amber-100/50">Cea mai aglomerată zi:</span>
                <span className="font-semibold text-amber-100">{busiestDay.label}</span>
                <span className="text-amber-100/40">({busiestDay.count} prog.)</span>
              </div>
            ) : null}
            {nextEmptyDay ? (
              <div className="flex items-center gap-2 rounded-xl border border-cyan-700/40 bg-cyan-950/30 px-4 py-2 text-xs">
                <span className="text-cyan-100/50">Zi liberă următoare:</span>
                <span className="font-semibold text-cyan-200">{nextEmptyDay}</span>
                <span className="text-cyan-100/40">— bun moment să trimiți linkul</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Week-at-a-glance grid: today + 6 days */}
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-amber-100/30">Săptămâna în curs</p>
          <div className="grid grid-cols-7 gap-1.5">
            {weekGrid.map((day) => (
              <div
                key={day.dayLabel}
                className={`flex flex-col items-center rounded-xl border px-1 py-2.5 text-center transition ${
                  day.isToday
                    ? "border-amber-500/40 bg-amber-950/40"
                    : day.count > 0
                    ? "border-emerald-700/30 bg-emerald-950/20"
                    : day.isOpen
                    ? "border-zinc-700/40 bg-zinc-900/30"
                    : "border-zinc-800/30 bg-zinc-950/20 opacity-40"
                }`}
              >
                <span className={`text-[10px] font-medium uppercase tracking-wide ${day.isToday ? "text-amber-300" : "text-zinc-500"}`}>
                  {day.dayShort}
                </span>
                <span className={`mt-0.5 text-[10px] ${day.isToday ? "text-amber-200/70" : "text-zinc-600"}`}>
                  {day.dayLabel}
                </span>
                <span className={`mt-1.5 text-base font-bold leading-none ${
                  day.count >= 5 ? "text-emerald-300" :
                  day.count > 0 ? "text-amber-100" :
                  day.isOpen ? "text-zinc-600" : "text-zinc-800"
                }`}>
                  {day.isOpen ? day.count : "—"}
                </span>
                {day.count > 0 ? (
                  <span className="mt-0.5 text-[9px] text-zinc-600">prog.</span>
                ) : null}
                {day.pendingCount > 0 ? (
                  <span className="mt-0.5 text-[9px] font-semibold text-orange-400">{day.pendingCount} aș.</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pending confirmations action panel — dedicated query, independent of main filter/pagination */}
      {(pendingBookings ?? []).length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-orange-300/70">Neconfirmate — necesită atenție</h2>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 overflow-hidden">
            <div className="divide-y divide-orange-900/20">
              {(pendingBookings ?? []).map((p) => {
                const start = new Date(p.data_start);
                const svc = Array.isArray(p.servicii) ? p.servicii[0] : p.servicii;
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium text-orange-100">{p.nume_client ?? "—"}</span>
                      <span className="mx-2 text-zinc-600">·</span>
                      <span className="text-zinc-400">{(svc as { nume?: string } | null)?.nume ?? "—"}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-xs text-orange-200/70">
                        {formatInTimeZone(start, "Europe/Bucharest", "dd.MM.yyyy")} {formatInTimeZone(start, "Europe/Bucharest", "HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(pendingBookings ?? []).length >= 20 ? (
                <div className="px-4 py-2 text-xs text-zinc-500">
                  Se afișează primele 20 — schimbă filtrul la &quot;Toate&quot; pentru a le vedea pe toate
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Settings link chip — Date publice + Smart Rules are in /dashboard/setari */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-700/50 bg-zinc-900/40 px-5 py-3">
        <div>
          <p className="text-sm font-medium text-amber-100">Setări business</p>
          <p className="mt-0.5 text-xs text-zinc-500">Date publice (telefon, descriere) și reguli de rezervare</p>
        </div>
        <Button asChild variant="secondary" size="sm" className="rounded-full shrink-0">
          <Link href="/dashboard/setari">Configurează →</Link>
        </Button>
      </div>

      {/* Today's upcoming appointments quick strip */}
      {filter !== "azi" && todayUpcomingRows.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-100/50">Astăzi</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {todayUpcomingRows.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-3 text-sm"
              >
                <span className="font-mono font-semibold text-emerald-300">{r.oraStr}</span>
                <span className="font-medium text-white">{r.clientName}</span>
                <span className="text-zinc-400">{r.serviceName}</span>
              </div>
            ))}
            {todayUpcomingRows.length > 5 ? (
              <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
                +{todayUpcomingRows.length - 5} mai multe azi
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* No upcoming bookings retention nudge */}
      {showNoBookingsNudge ? (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/30 px-5 py-4">
          <p className="text-sm font-semibold text-cyan-100">Nicio programare viitoare confirmată</p>
          <p className="mt-1 text-xs text-cyan-100/70">
            Pagina ta e activă, dar nu ai programări viitoare. Trimite linkul clienților și reamintește-le că pot rezerva online.
          </p>
          {prof.slug ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Programează-te online la ${prof.nume_business ?? "noi"}: https://ocupaloc.ro/${prof.slug}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Trimite pe WhatsApp
              </a>
              <CopyPublicLinkButton slug={prof.slug} />
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Programări</h2>
            <p className="text-sm text-muted-foreground">
              {filter === "azi" ? "Programările de azi" : filter === "viitoare" ? "Programări viitoare" : "Ultimele 30 de zile + viitoare"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AddManualBookingDialog servicii={serviciiOptions} />
            {(["azi", "viitoare", "toate"] as const).map((f) => (
              <Link
                key={f}
                href={`/dashboard?filter=${f}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  filter === f
                    ? "bg-amber-300 text-slate-900"
                    : "border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {f === "azi" ? "Azi" : f === "viitoare" ? "Viitoare" : "Toate"}
              </Link>
            ))}
            <a
              href="/api/dashboard/export-programari"
              download
              className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
            >
              ↓ Export CSV
            </a>
          </div>
        </div>
        {progErr ? (
          <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">{progErr.message}</div>
        ) : (
          <ProgramariTable rows={programari} />
        )}
      </section>

      {/* Top repeat-clients panel — only shown when there are repeat clients */}
      {topClients.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-amber-100">Clienți fideli</h2>
            <p className="text-xs text-amber-100/50">Clienți cu cel puțin 2 vizite finalizate</p>
          </div>
          <div className="lux-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/60">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">Client</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">Telefon</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">Vizite</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">Ultima vizită</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {topClients.map((c, i) => (
                  <tr key={c.phone} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-2.5 font-medium text-white">
                      <div className="flex items-center gap-2">
                        {i === 0 ? <span className="text-amber-400">★</span> : null}
                        {c.name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-300">
                      <a href={`tel:${c.phone}`} className="hover:underline hover:text-cyan-300">{c.phone}</a>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-violet-900/50 px-2 py-0.5 text-xs font-semibold text-violet-200">
                        {c.count}×
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-zinc-400">
                      {c.lastVisit ? formatInTimeZone(new Date(c.lastVisit), "Europe/Bucharest", "dd.MM.yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
