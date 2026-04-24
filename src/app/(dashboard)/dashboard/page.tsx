import { subDays } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivationWidgets } from "./activation-widgets";
import { AddManualBookingDialog, type ServiciuOption } from "./add-manual-booking-dialog";
import { CopyPublicLinkButton } from "./copy-public-link";
import { ProgramariTable, type ProgramareRow } from "./programari-table";
import { SmartRulesForm } from "./smart-rules-form";
import { updatePublicSalonFields } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseProgramJson, ziKeyFromDate } from "@/lib/program";
import { computeFreeSlots } from "@/lib/slots";
import { isBillingEnabled, BILLING_TRIAL_DAYS } from "@/lib/billing/config";
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

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
  slug?: string | null;
  telefon?: string | null;
  description?: string | null;
  nume_business?: string | null;
  onboarding_pas?: number | null;
  program?: Record<string, unknown> | null;
  smart_rules_enabled?: boolean | null;
  smart_max_future_bookings?: number | null;
  smart_client_cancel_threshold?: number | null;
  smart_cancel_window_days?: number | null;
  smart_min_notice_minutes?: number | null;
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
    "id, slug, telefon, description, nume_business, onboarding_pas, program, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes, pauza_intre_clienti, timp_pregatire, lucreaza_acasa",
    "id, slug, description, nume_business, onboarding_pas, program, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes, pauza_intre_clienti, timp_pregatire, lucreaza_acasa"
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
  const filter = sp.filter === "azi" || sp.filter === "toate" ? sp.filter : "viitoare";  const { count: serviciiCount } = await supabase
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

  const { count: cancelledBySalon } = await supabase
    .from("programari_status_events")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id)
    .eq("status", "anulat")
    .eq("source", "salon_dashboard")
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

  // --- Subscription status for billing banner ---
  type SubRow = {
    status: string;
    current_period_end: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean | null;
  };
  let subRow: SubRow | null = null;
  if (isBillingEnabled()) {
    const admin = createSupabaseServiceClient();
    const { data } = await admin
      .from("subscriptions")
      .select("status, current_period_end, trial_end, cancel_at_period_end")
      .eq("profesionist_id", String(prof.id))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subRow = data as SubRow | null;
  }

  // Compute billing banner props from subRow
  type BillingBanner = { label: string; sub: string; dot: string; cta?: { label: string; href: string } } | null;
  let billingBanner: BillingBanner = null;
  if (isBillingEnabled()) {
    const now = Date.now();
    if (!subRow) {
      // No subscription at all — check legacy trial
      const createdAt = new Date(prof.id ? 0 : 0); // we don't have created_at here, fall through
      billingBanner = {
        label: "Fără abonament activ",
        sub: "Activează un abonament pentru a permite rezervări.",
        dot: "bg-zinc-500",
        cta: { label: "Activează abonamentul", href: "/preturi" }
      };
    } else if (subRow.status === "trialing") {
      const trialEndMs = subRow.trial_end ? new Date(subRow.trial_end).getTime() : 0;
      const daysLeft = Math.max(0, Math.ceil((trialEndMs - now) / (24 * 60 * 60 * 1000)));
      billingBanner = {
        label: daysLeft > 0 ? `Trial — ${daysLeft} zi${daysLeft === 1 ? "" : "le"} rămase` : "Trial expirat",
        sub: daysLeft > 0 ? "Abonează-te înainte să expire." : "Abonează-te acum pentru a continua.",
        dot: daysLeft > 3 ? "bg-blue-400" : "bg-amber-400",
        cta: { label: "Activează abonamentul", href: "/preturi" }
      };
    } else if (subRow.status === "active") {
      const endMs = subRow.current_period_end ? new Date(subRow.current_period_end).getTime() : Infinity;
      const endLabel = subRow.current_period_end
        ? new Date(subRow.current_period_end).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—";
      billingBanner = {
        label: subRow.cancel_at_period_end ? `Activ — se anulează pe ${endLabel}` : `Activ până pe ${endLabel}`,
        sub: subRow.cancel_at_period_end ? "Reactivează pentru a nu pierde accesul." : "Totul funcționează normal.",
        dot: subRow.cancel_at_period_end ? "bg-amber-400" : "bg-emerald-500",
        cta: subRow.cancel_at_period_end ? { label: "Reactivează", href: "/api/billing/portal" } : undefined
      };
    } else if (subRow.status === "past_due") {
      billingBanner = {
        label: "Problemă cu plata",
        sub: "Actualizează datele de plată — grace period activ.",
        dot: "bg-amber-500",
        cta: { label: "Actualizează plata", href: "/api/billing/portal" }
      };
    } else if (subRow.status === "canceled") {
      billingBanner = {
        label: "Abonament anulat",
        sub: "Reabonează-te pentru a primi programări online.",
        dot: "bg-red-500",
        cta: { label: "Abonează-te din nou", href: "/preturi" }
      };
    } else if (subRow.status === "incomplete") {
      billingBanner = {
        label: "Plată nefinalizată",
        sub: "Finalizează plata pentru a activa accesul.",
        dot: "bg-amber-500",
        cta: { label: "Finalizează plata", href: "/preturi" }
      };
    } else if (subRow.status === "paused") {
      billingBanner = {
        label: "Abonament pausat",
        sub: "Reactivează din panoul de abonamente.",
        dot: "bg-zinc-400",
        cta: { label: "Administrează abonamentul", href: "/api/billing/portal" }
      };
    } else if (subRow.status === "unpaid" || subRow.status === "incomplete_expired") {
      billingBanner = {
        label: "Acces suspendat",
        sub: "Plăți restante. Actualizează sau pornește un abonament nou.",
        dot: "bg-red-500",
        cta: { label: "Actualizează plata", href: "/api/billing/portal" }
      };
    }
  }
  // ---

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
            status: p.status
          };
        })
      : [];

  return (
    <div className="space-y-12 section-reveal">
      <ActivationWidgets slug={prof.slug ?? null} profileDone={profileDone} serviciiCount={serviciiCount ?? 0} programSetat={programSetat} />

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
      {sp.info ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-950/40 px-4 py-3 text-sm text-blue-200">{decodeURIComponent(sp.info)}</div>
      ) : null}
      {sp.error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{decodeURIComponent(sp.error)}</div>
      ) : null}

      {billingBanner ? (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
          billingBanner.dot === "bg-emerald-500"
            ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-200"
            : billingBanner.dot === "bg-red-500"
            ? "border-red-500/30 bg-red-950/40 text-red-200"
            : billingBanner.dot === "bg-amber-400" || billingBanner.dot === "bg-amber-500"
            ? "border-amber-500/30 bg-amber-950/40 text-amber-200"
            : "border-zinc-700/50 bg-zinc-900/60 text-zinc-300"
        }`}>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${billingBanner.dot}`} />
          <div className="flex-1">
            <span className="font-medium">{billingBanner.label}</span>
            {billingBanner.sub ? <span className="ml-2 opacity-70">{billingBanner.sub}</span> : null}
          </div>
          {billingBanner.cta ? (
            <a
              href={billingBanner.cta.href}
              className="shrink-0 rounded-full border border-current/30 px-3 py-1 text-xs font-medium opacity-90 hover:opacity-100"
            >
              {billingBanner.cta.label}
            </a>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Pulse business</h2>
          <p className="text-sm text-muted-foreground">KPI operaționali pentru ultimele 7 zile.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="lux-card p-5 flex items-start gap-3">
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${semaforConfig[semaforStatus].dot} shadow-[0_0_6px_2px] ${semaforStatus === "free" ? "shadow-emerald-500/40" : semaforStatus === "full" ? "shadow-red-500/40" : "shadow-zinc-500/30"}`} />
            <div>
              <p className="text-sm font-medium text-amber-100/90">{semaforConfig[semaforStatus].label}</p>
              <p className="mt-0.5 text-xs text-amber-100/50">{semaforConfig[semaforStatus].sub}</p>
            </div>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">Reminder-e trimise azi</p>
            <p className="mt-2 text-3xl font-bold text-amber-50">{remindersSentToday ?? 0}</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">Anulări client vs salon (7z)</p>
            <p className="mt-2 text-3xl font-bold text-amber-50">
              {cancelledByClient ?? 0} <span className="text-amber-200/40">/</span> {cancelledBySalon ?? 0}
            </p>
            <p className="mt-1 text-xs text-amber-100/50">client / salon</p>
          </div>
          <div className="lux-card p-5">
            <p className="text-sm text-amber-100/75">Rată confirmare client (7z)</p>
            <p className="mt-2 text-3xl font-bold text-amber-50">{confirmationRate7d === null ? "—" : `${confirmationRate7d}%`}</p>
          </div>
        </div>
      </section>

      <section className="lux-card space-y-4 p-6">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Date publice</h2>
        <p className="text-sm text-muted-foreground">Telefonul și descrierea apar pe pagina publică a business-ului tău.</p>
        <form action={updatePublicSalonFields} className="max-w-xl space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              maxLength={50}
              defaultValue={prof.telefon ?? ""}
              className="border-zinc-700 bg-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descriere</Label>
            <Textarea
              id="description"
              name="description"
              maxLength={2000}
              rows={4}
              defaultValue={prof.description ?? ""}
              className="resize-y border-zinc-700 bg-zinc-900"
            />
          </div>
          <Button type="submit" className="rounded-full border-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 text-slate-900 hover:brightness-105">
            Salvează datele publice
          </Button>
        </form>
      </section>

      <SmartRulesForm
        enabled={Boolean(prof.smart_rules_enabled)}
        maxFutureBookings={prof.smart_max_future_bookings ?? 0}
        minNoticeMinutes={prof.smart_min_notice_minutes ?? 0}
        clientCancelThreshold={prof.smart_client_cancel_threshold ?? 0}
        cancelWindowDays={prof.smart_cancel_window_days ?? 60}
      />

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
          </div>
        </div>
        {progErr ? (
          <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">{progErr.message}</div>
        ) : (
          <ProgramariTable rows={programari} />
        )}
      </section>
    </div>
  );
}
