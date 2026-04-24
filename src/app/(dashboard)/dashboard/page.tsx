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
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{ saved?: string; error?: string; filter?: string }>;
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
    "id, slug, telefon, description, nume_business, onboarding_pas, program, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes",
    "id, slug, description, nume_business, onboarding_pas, program, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes"
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
    const [startH, startM] = todayInterval[0].split(":").map(Number);
    const [endH, endM] = todayInterval[1].split(":").map(Number);
    const workMinutes = ((endH ?? 0) * 60 + (endM ?? 0)) - ((startH ?? 0) * 60 + (startM ?? 0));

    const { data: todayBookings } = await supabase
      .from("programari")
      .select("servicii(durata_minute)")
      .eq("profesionist_id", prof.id)
      .in("status", ["confirmat", "in_asteptare"])
      .gte("data_start", dayStartIso)
      .lte("data_start", dayEndIso);

    type TodayRow = { servicii: { durata_minute: number } | { durata_minute: number }[] | null };
    const bookedMinutes = (todayBookings as TodayRow[] | null ?? []).reduce((sum, row) => {
      const svc = Array.isArray(row.servicii) ? row.servicii[0] : row.servicii;
      return sum + (svc?.durata_minute ?? 0);
    }, 0);

    semaforBookingsToday = (todayBookings ?? []).length;
    semaforStatus = bookedMinutes >= workMinutes ? "full" : "free";
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
      {sp.error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{decodeURIComponent(sp.error)}</div>
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
