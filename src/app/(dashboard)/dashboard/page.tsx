import { subDays } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import Link from "next/link";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

import { AddManualBookingDialog, type ServiciuOption } from "./add-manual-booking-dialog";
import { CancelSubscriptionButton } from "./cancel-subscription-button";
import { CopyPublicLinkButton } from "./copy-public-link";
import { ProgramariTable, type ProgramareRow } from "./programari-table";
import { OnboardingChecklist } from "@/components/onboarding/Checklist";
import { type PlanStatus } from "@/components/billing/PlanStatusBanner";
import { SignupDraftBootstrap } from "@/components/onboarding/SignupDraftBootstrap";
import { getPlanStatus } from "@/lib/billing/entitlement";
import { extractProgramPauza, getProgramSlotConfig, parseProgramJson, ziKeyFromDate } from "@/lib/program";
import { computeFreeSlots } from "@/lib/slots";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
    filter?: string;
    info?: string;
    activated?: string;
    canceled?: string;
    status?: string;
    serviciu?: string;
    q?: string;
  }>;
};

export const dynamic = "force-dynamic";

type ProgRow = {
  id: string;
  serviciu_id: string;
  data_start: string;
  data_final: string;
  status: string;
  nume_client: string;
  telefon_client: string;
  observatii: string | null;
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

  const { data: prof, error: profErr } = await selectWithTelefonFallback<DashboardProfile>(
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

  // Production self-heal for multi-tenant rollout: ensure tenant + owner membership exist.
  if (prof.slug?.trim()) {
    const admin = createSupabaseServiceClient();
    await admin.from("tenants").upsert(
      {
        id: prof.id,
        slug: prof.slug.trim(),
        name: (prof.nume_business ?? prof.slug).trim()
      },
      { onConflict: "id" }
    );

    const { data: ownerMembership } = await admin
      .from("memberships")
      .select("id")
      .eq("tenant_id", prof.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!ownerMembership?.id) {
      await admin.from("memberships").insert({
        id: randomUUID(),
        tenant_id: prof.id,
        user_id: user.id,
        role: "owner",
        onboarding_state: "NEW"
      });
    }
  }

  // --- Plan status for billing banner ---
  const planStatus: PlanStatus = await getPlanStatus(prof.id, {
    profesionistCreatedAt: prof.created_at ?? null
  });
  // ---

  const sp = searchParams ? await searchParams : {};
  const isPostCancelState = sp.canceled === "1";
  const filter = sp.filter === "azi" || sp.filter === "toate" ? sp.filter : "viitoare";
  const statusFilter = ["all", "confirmat", "in_asteptare", "anulat", "finalizat", "noaparit"].includes(sp.status ?? "")
    ? (sp.status as "all" | "confirmat" | "in_asteptare" | "anulat" | "finalizat" | "noaparit")
    : "all";
  const serviceFilter = typeof sp.serviciu === "string" ? sp.serviciu : "all";
  const queryFilter = (sp.q ?? "").trim().toLowerCase();

  const { count: serviciiCount } = await supabase
    .from("servicii")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id);

  const { count: programariTotal } = await supabase
    .from("programari")
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
  const todayLocal = formatInTimeZone(new Date(), "Europe/Bucharest", "yyyy-MM-dd");
  const dayStartIso = toDate(`${todayLocal}T00:00:00`, { timeZone: "Europe/Bucharest" }).toISOString();
  const dayEndIso = toDate(`${todayLocal}T23:59:59`, { timeZone: "Europe/Bucharest" }).toISOString();
  const sevenDaysAgoIso = subDays(new Date(), 7).toISOString();

  let progQuery = supabase
    .from("programari")
    .select("id, serviciu_id, data_start, data_final, status, nume_client, telefon_client, observatii")
    .eq("profesionist_id", prof.id)
    .order("data_start", { ascending: filter !== "toate" })
    .limit(100);

  if (statusFilter !== "all") {
    progQuery = progQuery.eq("status", statusFilter);
  }

  if (serviceFilter !== "all") {
    progQuery = progQuery.eq("serviciu_id", serviceFilter);
  }

  if (filter === "azi") {
    progQuery = progQuery.gte("data_start", dayStartIso).lte("data_start", dayEndIso);
  } else if (filter === "viitoare") {
    progQuery = progQuery.gte("data_start", new Date().toISOString());
  } else {
    // toate — show last 30 days + future
    progQuery = progQuery.gte("data_start", subDays(new Date(), 30).toISOString());
  }

  const { data: rawProg } = await progQuery;

  // --- Semafor vizual pentru ziua de azi ---
  type SemaforStatus = "closed" | "free" | "full";
  let semaforStatus: SemaforStatus = "free";
  let semaforBookingsToday = 0;

  const todayInBucharest = toDate(`${todayLocal}T12:00:00`, { timeZone: "Europe/Bucharest" });
  const parsedProgram = parseProgramJson(programRaw);
  const pauzaProgram = extractProgramPauza(programRaw);
  const slotConfig = getProgramSlotConfig(programRaw);
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

    const freeSlots = computeFreeSlots(todayLocal, parsedProgram, minDuration, pauzaIntre, timpPreg, ocupate, pauzaProgram, slotConfig);
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

  const { count: upcomingConfirmedTotalCount } = await supabase
    .from("programari")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "confirmat")
    .gte("data_start", new Date().toISOString());

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

  // Build service lookup map from already-fetched options
  const serviceMap = new Map(serviciiOptions.map(s => [s.id, s.name]));

  const programari: ProgramareRow[] =
    rawProg
      ? (rawProg as ProgRow[]).map((p) => {
          const start = new Date(p.data_start);
          return {
            id: p.id,
            dataStr: formatInTimeZone(start, "Europe/Bucharest", "dd.MM.yyyy"),
            oraStr: formatInTimeZone(start, "Europe/Bucharest", "HH:mm"),
            clientName: p.nume_client ?? "—",
            clientPhone: p.telefon_client ?? "",
            serviceName: serviceMap.get(p.serviciu_id) ?? "—",
            status: p.status,
            notes: p.observatii ?? "",
            priorVisits: p.telefon_client ? (phoneVisitCount.get(p.telefon_client) ?? 0) : 0,
            repeatNoShows: p.telefon_client ? (phoneNoShowCount.get(p.telefon_client) ?? 0) : 0
          };
        })
      : [];

  const filteredProgramari = queryFilter
    ? programari.filter((row) => {
        const haystack = `${row.clientName} ${row.clientPhone} ${row.serviceName} ${row.notes ?? ""}`.toLowerCase();
        return haystack.includes(queryFilter);
      })
    : programari;

  // Derive today's upcoming confirmed bookings from already-fetched data
  const todayUpcomingRows = programari.filter(
    (p) => p.dataStr === todayFormatted && p.status === "confirmat" && new Date(`${todayFormatted.split(".").reverse().join("-")}T${p.oraStr}`) >= new Date()
  );

  // Retention signal: fully-set-up salon with zero upcoming confirmed bookings
  const fullySetUp = programSetat && (serviciiCount ?? 0) > 0 && Boolean(prof.slug);
  const showNoBookingsNudge = fullySetUp && (upcomingConfirmedTotalCount ?? 0) === 0 && filter !== "azi";

  // Dedicated query for pending confirmations panel (independent of main filter/pagination)
  const { data: pendingBookings } = await supabase
    .from("programari")
    .select("id, data_start, nume_client, telefon_client, servicii(nume)")
    .eq("profesionist_id", prof.id)
    .eq("status", "in_asteptare")
    .gte("data_start", new Date().toISOString())
    .order("data_start", { ascending: true })
    .limit(20);

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
        message: `Ai ${pendingNext7dCount} programări în așteptare neconfirmate — confirmă-le sau contactează clienții.`,
        href: "/dashboard?filter=toate&status=in_asteptare",
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

  const canCancelSubscription = planStatus.kind === "active" || planStatus.kind === "trialing_stripe" || planStatus.kind === "past_due";

  const activationSlugOk = Boolean(prof.slug?.trim());
  const activationServiciiOk = (serviciiCount ?? 0) > 0;
  const activationProgramOk = programSetat;
  const activationHasBookingRequest = (programariTotal ?? 0) > 0;
  const activationPaidPlan = planStatus.kind === "active";

  const onboardingSteps = [
    {
      title: "Slug și pagină publică",
      description: "Alege un link scurt ușor de trimis clienților.",
      done: activationSlugOk,
      href: "/dashboard/pagina",
      linkLabel: "Editează pagina publică →"
    },
    {
      title: "Servicii active",
      description: "Adaugă cel puțin un serviciu cu durată și preț.",
      done: activationServiciiOk,
      href: "/dashboard/servicii",
      linkLabel: "Gestionează serviciile →"
    },
    {
      title: "Program de lucru",
      description: "Setează intervalele când poți primi rezervări.",
      done: activationProgramOk,
      href: "/dashboard/program",
      linkLabel: "Setează programul →"
    },
    {
      title: "Prima rezervare primită",
      description: "Trimite linkul public; apare bifat automat la prima cerere.",
      done: activationHasBookingRequest,
      href: "/dashboard/preview",
      linkLabel: "Previzualizare & link →",
      action: prof.slug?.trim() ? <CopyPublicLinkButton slug={prof.slug.trim()} /> : undefined
    },
    {
      title: "Abonament activ",
      description: "După trial, păstrează planul ca rezervările să rămână activate.",
      done: activationPaidPlan,
      href: "/dashboard/billing",
      linkLabel: "Facturare și plan →"
    }
  ];

  // No active subscription: send user to activation step instead of showing a dead-end lock screen.
  // Exception: if user just returned from Stripe checkout (?activated=1), don't redirect — the
  // subscription is being synced and the webhook / billing/succes upsert may still be in flight.
  if (planStatus.kind === "none" && sp.activated !== "1" && !isPostCancelState) {
    const slug = prof.slug?.trim();
    if (slug) {
      redirect(`/onboarding/bun-venit?slug=${encodeURIComponent(slug)}`);
    }
    redirect("/onboarding");
  }

  return (
    <div className="space-y-12 section-reveal">
      <SignupDraftBootstrap showToastOnApply />
      {sp.info ? (
        <div className="mx-4 mt-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          ℹ️ {decodeURIComponent(sp.info)}
        </div>
      ) : null}

      {sp.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Datele publice au fost salvate.
        </div>
      ) : null}
      {sp.error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">{decodeURIComponent(sp.error)}</div>
      ) : null}

      {isPostCancelState ? (
        <div className="rounded-2xl border oc-border bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold oc-text">Ne pare rău că ai ales să pleci.</p>
          <p className="mt-1 text-xs oc-secondary-text">
            Abonamentul este anulat și nu se vor mai retrage bani. Dacă vrei să revii, poți reactiva planul din dashboard, iar o nouă perioadă gratuită se acordă doar dacă business-ul este eligibil conform politicii de trial.
          </p>
          <form method="get" action="/api/billing/create-checkout" className="mt-3">
            <button
              type="submit"
              className="inline-flex items-center rounded-full border border-oc-amber/40 bg-oc-amber-soft px-4 py-1.5 text-xs font-medium text-oc-warning transition hover:bg-oc-amber-soft/80"
            >
              Reactivează abonamentul
            </button>
          </form>
        </div>
      ) : null}

      {!isPostCancelState ? (
        <OnboardingChecklist
          title="Pașii următori până la plată"
          subtitle="Progresul tău: publică, promovează, primește rezervări, convertește la abonament."
          steps={onboardingSteps}
        />
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wide oc-accent">Rezumat operațional</h2>
          <p className="text-sm text-muted-foreground">KPI operaționali pentru ultimele 7 zile.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lux-card p-5 flex items-start gap-3">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${semaforConfig[semaforStatus].dot} shadow-[0_0_6px_2px] ${semaforStatus === "free" ? "shadow-emerald-500/40" : semaforStatus === "full" ? "shadow-red-500/40" : "shadow-zinc-500/30"}`} />
            <div>
              <p className="text-sm font-medium oc-text">{semaforConfig[semaforStatus].label}</p>
              <p className="mt-0.5 text-xs oc-secondary-text">{semaforConfig[semaforStatus].sub}</p>
            </div>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm oc-secondary-text">Programări (7 zile)</p>
            <p className="mt-2 text-3xl font-bold oc-text">{upcomingNext7dCount ?? 0}</p>
            <p className="mt-1 text-xs oc-secondary-text">confirmate viitoare</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm oc-secondary-text">În așteptare (7z)</p>
            <p className={`mt-2 text-3xl font-bold ${(pendingNext7dCount ?? 0) > 0 ? "text-orange-600" : "oc-text"}`}>
              {pendingNext7dCount ?? 0}
            </p>
            <p className="mt-1 text-xs oc-secondary-text">neconfirmate — risc no-show</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm oc-secondary-text">Reminder-e trimise azi</p>
            <p className="mt-2 text-3xl font-bold oc-text">{remindersSentToday ?? 0}</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm oc-secondary-text">Rată confirmare client (7z)</p>
            <p className="mt-2 text-3xl font-bold oc-text">{confirmationRate7d === null ? "—" : `${confirmationRate7d}%`}</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm oc-secondary-text">Anulări client (7z)</p>
            <p className={`mt-2 text-3xl font-bold ${(cancelledByClient ?? 0) > 2 ? "text-red-600" : "oc-text"}`}>
              {cancelledByClient ?? 0}
            </p>
            <p className="mt-1 text-xs oc-secondary-text">anulate de clienți</p>
          </div>
          {utilizationPct !== null ? (
            <div className="lux-card p-5">
              <p className="text-sm oc-secondary-text">Utilizare săptămână</p>
              <p className={`mt-2 text-3xl font-bold ${utilizationPct >= 80 ? "text-oc-teal" : utilizationPct >= 40 ? "oc-text" : "oc-secondary-text"}`}>
                {utilizationPct}%
              </p>
              <p className="mt-1 text-xs oc-secondary-text">din capacitate ocupat (7z)</p>
            </div>
          ) : null}
          {(overdueCount ?? 0) > 0 ? (
            <a href="?filter=toate" className="lux-card block border-orange-200 p-5 transition hover:border-orange-300">
              <p className="text-sm text-orange-700">Neînchise (expirate)</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{overdueCount}</p>
              <p className="mt-1 text-xs text-orange-600/80">confirmate expirate — apasă pentru a le vedea</p>
            </a>
          ) : null}
        </div>

        {/* Next-best-action: single prioritized operator hint */}
        {nextBestAction ? (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${nextBestAction.urgent ? "border-oc-rose/30 bg-oc-rose-soft" : "border-oc-teal/20 bg-oc-teal-soft"}`}
          >
            <span className="shrink-0 text-base leading-6">{nextBestAction.icon}</span>
            <div className="min-w-0">
              <p className={`text-sm ${nextBestAction.urgent ? "text-orange-900" : "oc-text"}`}>{nextBestAction.message}</p>
              {nextBestAction.href ? (
                <a
                  href={nextBestAction.href}
                  className={`mt-1 inline-block text-xs font-medium underline ${nextBestAction.urgent ? "text-orange-700" : "oc-accent"}`}
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
              <div className="flex items-center gap-2 rounded-xl border oc-border bg-white px-4 py-2 text-xs shadow-sm">
                <span className="oc-secondary-text">Cea mai aglomerată zi:</span>
                <span className="font-semibold oc-text">{busiestDay.label}</span>
                <span className="oc-secondary-text">({busiestDay.count} prog.)</span>
              </div>
            ) : null}
            {nextEmptyDay ? (
              <div className="flex items-center gap-2 rounded-xl border border-oc-teal/20 bg-oc-teal-soft px-4 py-2 text-xs">
                <span className="oc-secondary-text">Zi liberă următoare:</span>
                <span className="font-semibold oc-accent">{nextEmptyDay}</span>
                <span className="oc-secondary-text">— bun moment să trimiți linkul</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Week-at-a-glance grid: today + 6 days */}
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest oc-secondary-text">Săptămâna în curs</p>
          <div className="grid grid-cols-7 gap-1.5">
            {weekGrid.map((day) => (
              <div
                key={day.dayLabel}
                className={`dash-week-tile transition ${
                  day.isToday
                    ? "dash-week-tile-today"
                    : day.count > 0
                      ? "dash-week-tile-busy"
                      : !day.isOpen
                        ? "dash-week-tile-muted"
                        : ""
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${day.isToday ? "text-oc-amber" : "oc-secondary-text"}`}
                >
                  {day.dayShort}
                </span>
                <span className={`mt-0.5 text-[10px] ${day.isToday ? "text-oc-teal" : "oc-secondary-text"}`}>
                  {day.dayLabel}
                </span>
                <span
                  className={`mt-1.5 text-base font-bold leading-none ${
                    day.isOpen ? "oc-text" : "oc-secondary-text"
                  }`}
                >
                  {day.isOpen ? day.count : "—"}
                </span>
                {day.count > 0 ? <span className="mt-0.5 text-[9px] oc-secondary-text">prog.</span> : null}
                {day.pendingCount > 0 ? (
                  <span className="mt-0.5 text-[9px] font-semibold text-orange-600">{day.pendingCount} aș.</span>
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
            <h2 className="text-sm font-semibold uppercase tracking-widest text-orange-700">Neconfirmate — necesită atenție</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-orange-200 bg-orange-50">
            <div className="divide-y divide-orange-100">
              {(pendingBookings ?? []).map((p) => {
                const start = new Date(p.data_start);
                const svc = Array.isArray(p.servicii) ? p.servicii[0] : p.servicii;
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium text-orange-900">{p.nume_client ?? "—"}</span>
                      <span className="mx-2 oc-secondary-text">·</span>
                      <span className="oc-secondary-text">{(svc as { nume?: string } | null)?.nume ?? "—"}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-xs text-orange-800/80">
                        {formatInTimeZone(start, "Europe/Bucharest", "dd.MM.yyyy")} {formatInTimeZone(start, "Europe/Bucharest", "HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(pendingBookings ?? []).length >= 20 ? (
                <div className="px-4 py-2 text-xs oc-secondary-text">
                  Se afișează primele 20 — schimbă filtrul la &quot;Toate&quot; pentru a le vedea pe toate
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* Today's upcoming appointments quick strip */}
      {filter !== "azi" && todayUpcomingRows.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest oc-secondary-text">Astăzi</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {todayUpcomingRows.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-oc-teal/20 bg-oc-teal-soft px-4 py-3 text-sm"
              >
                <span className="font-mono font-semibold oc-accent">{r.oraStr}</span>
                <span className="font-medium oc-text">{r.clientName}</span>
                <span className="oc-secondary-text">{r.serviceName}</span>
              </div>
            ))}
            {todayUpcomingRows.length > 5 ? (
              <div className="flex items-center rounded-xl border oc-border bg-white px-4 py-3 text-sm oc-secondary-text shadow-sm">
                +{todayUpcomingRows.length - 5} mai multe azi
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* No upcoming bookings retention nudge */}
      {showNoBookingsNudge ? (
        <div className="rounded-2xl border border-oc-teal/20 bg-oc-teal-soft px-5 py-4">
          <p className="text-sm font-semibold oc-accent">Nicio programare viitoare confirmată</p>
          <p className="mt-1 text-xs oc-secondary-text">
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
                className="dash-chip"
              >
                {f === "azi" ? "Azi" : f === "viitoare" ? "Viitoare" : "Toate"}
              </Link>
            ))}
            <a
              href="/api/dashboard/export-programari"
              download
              className="dash-chip"
            >
              ↓ Export CSV
            </a>
          </div>
        </div>

        <form className="dash-panel grid gap-2 sm:grid-cols-4" method="get" action="/dashboard">
          <input type="hidden" name="filter" value={filter} />
          <div className="sm:col-span-2">
            <label htmlFor="q" className="mb-1 block text-xs oc-secondary-text">
              Caută client / telefon / serviciu
            </label>
            <input
              id="q"
              name="q"
              defaultValue={queryFilter}
              placeholder="ex: Maria, 07..., Tuns"
              className="dash-input"
            />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-xs oc-secondary-text">
              Status
            </label>
            <select id="status" name="status" defaultValue={statusFilter} className="dash-input">
              <option value="all">Toate</option>
              <option value="confirmat">Confirmate</option>
              <option value="in_asteptare">În așteptare</option>
              <option value="anulat">Anulate</option>
              <option value="finalizat">Finalizate</option>
              <option value="noaparit">Neprezent</option>
            </select>
          </div>
          <div>
            <label htmlFor="serviciu" className="mb-1 block text-xs oc-secondary-text">
              Serviciu
            </label>
            <select id="serviciu" name="serviciu" defaultValue={serviceFilter} className="dash-input">
              <option value="all">Toate serviciile</option>
              {serviciiOptions.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4 flex items-center justify-end gap-2">
            <Link
              href={`/dashboard?filter=${filter}`}
              className="dash-chip"
            >
              Resetează filtrele
            </Link>
            <button
              type="submit"
              className="rounded-full bg-oc-amber px-4 py-1.5 text-sm font-medium text-white transition hover:bg-oc-amber-light"
            >
              Aplică filtrele
            </button>
          </div>
        </form>
        <ProgramariTable rows={filteredProgramari} />
      </section>

      {/* Top repeat-clients panel — only shown when there are repeat clients */}
      {topClients.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight oc-text">Clienți fideli</h2>
            <p className="text-xs oc-secondary-text">Clienți cu cel puțin 2 vizite finalizate</p>
          </div>
          <div className="lux-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b oc-border bg-oc-teal-soft">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium oc-secondary-text">Client</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium oc-secondary-text">Telefon</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium oc-secondary-text">Vizite</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium oc-secondary-text">Ultima vizită</th>
                </tr>
              </thead>
              <tbody className="divide-y oc-border">
                {topClients.map((c, i) => (
                  <tr key={c.phone} className="hover:bg-oc-teal-soft/50">
                    <td className="px-4 py-2.5 font-medium oc-text">
                      <div className="flex items-center gap-2">
                        {i === 0 ? <span className="text-oc-amber-light">★</span> : null}
                        {c.name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs oc-secondary-text">
                      <a href={`tel:${c.phone}`} className="hover:underline oc-accent">
                        {c.phone}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                        {c.count}×
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs oc-secondary-text">
                      {c.lastVisit ? formatInTimeZone(new Date(c.lastVisit), "Europe/Bucharest", "dd.MM.yyyy") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {canCancelSubscription ? (
        <section className="space-y-2 border-t oc-border pt-6">
          <h3 className="text-sm font-semibold tracking-wide oc-text">Abonament</h3>
          <p className="text-xs oc-secondary-text">
            Dacă anulezi, plata recurentă este oprită imediat, iar abonamentul este scos din evidența locală.
          </p>
          <CancelSubscriptionButton />
        </section>
      ) : null}
    </div>
  );
}
