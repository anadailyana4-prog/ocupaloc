import { subDays } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivationWidgets } from "./activation-widgets";
import { CopyPublicLinkButton } from "./copy-public-link";
import { ProgramariTable, type ProgramareRow } from "./programari-table";
import { updatePublicSalonFields, updateSmartRules } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{ saved?: string; error?: string }>;
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

export default async function DashboardHomePage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  let greetName = user.email?.split("@")[0] ?? "acolo";
  const { data: profile } = await supabase.from("profiles").select("full_name, phone, role").eq("id", user.id).maybeSingle();
  if (!profile?.full_name?.trim() || !profile?.phone?.trim() || !profile?.role?.trim()) {
    redirect("/onboarding");
  }
  if (profile?.full_name?.trim()) {
    greetName = profile.full_name.trim();
  }

  const { data: prof, error: profErr } = await supabase
    .from("profesionisti")
    .select(
      "id, slug, telefon, description, nume_business, onboarding_pas, program, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profErr || !prof?.id) {
    redirect("/onboarding");
  }

  if ((prof.onboarding_pas ?? 0) < 4) {
    redirect("/onboarding");
  }

  const sp = searchParams ? await searchParams : {};
  const since = subDays(new Date(), 1).toISOString();
  const { count: serviciiCount } = await supabase
    .from("servicii")
    .select("*", { count: "exact", head: true })
    .eq("profesionist_id", prof.id);

  const programRaw = prof.program as Record<string, unknown> | null;
  const programSetat = Boolean(
    programRaw &&
      Object.values(programRaw).some((value) => Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string")
  );
  const profileDone = Boolean(prof.nume_business?.trim() && prof.telefon?.trim());

  const { data: rawProg, error: progErr } = await supabase
    .from("programari")
    .select("id, data_start, data_final, status, nume_client, telefon_client, servicii(nume)")
    .eq("profesionist_id", prof.id)
    .gte("data_start", since)
    .order("data_start", { ascending: true })
    .limit(50);

  const todayLocal = formatInTimeZone(new Date(), "Europe/Bucharest", "yyyy-MM-dd");
  const dayStartIso = toDate(`${todayLocal}T00:00:00`, { timeZone: "Europe/Bucharest" }).toISOString();
  const dayEndIso = toDate(`${todayLocal}T23:59:59`, { timeZone: "Europe/Bucharest" }).toISOString();
  const sevenDaysAgoIso = subDays(new Date(), 7).toISOString();

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
          <CopyPublicLinkButton slug={prof.slug} />
          <Button asChild variant="secondary" className="rounded-full">
            <Link href={`/${prof.slug}`} target="_blank" rel="noreferrer">
              Deschide pagina publică
            </Link>
          </Button>
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
        <div className="grid gap-4 md:grid-cols-3">
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

      <section className="lux-card space-y-4 p-6">
        <h2 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Reguli smart pentru programări</h2>
        <p className="text-sm text-muted-foreground">
          Aceste reguli sunt opționale și se aplică doar dacă le activezi. Tu alegi cum îți protejezi agenda.
        </p>
        <form action={updateSmartRules} className="max-w-2xl space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              name="smart_rules_enabled"
              type="checkbox"
              defaultChecked={Boolean(prof.smart_rules_enabled)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900"
            />
            Activează reguli smart
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smart_max_future_bookings">Maxim programări viitoare per client</Label>
              <Input
                id="smart_max_future_bookings"
                name="smart_max_future_bookings"
                type="number"
                min={0}
                max={10}
                defaultValue={prof.smart_max_future_bookings ?? 0}
                className="border-zinc-700 bg-zinc-900"
              />
              <p className="text-xs text-muted-foreground">0 = fără limită</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smart_min_notice_minutes">Minim minute înainte de programare</Label>
              <Input
                id="smart_min_notice_minutes"
                name="smart_min_notice_minutes"
                type="number"
                min={0}
                max={1440}
                defaultValue={prof.smart_min_notice_minutes ?? 0}
                className="border-zinc-700 bg-zinc-900"
              />
              <p className="text-xs text-muted-foreground">0 = permit inclusiv rezervări imediate</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smart_client_cancel_threshold">Blocare după anulări client</Label>
              <Input
                id="smart_client_cancel_threshold"
                name="smart_client_cancel_threshold"
                type="number"
                min={0}
                max={10}
                defaultValue={prof.smart_client_cancel_threshold ?? 0}
                className="border-zinc-700 bg-zinc-900"
              />
              <p className="text-xs text-muted-foreground">0 = dezactivat</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smart_cancel_window_days">Fereastră analiză anulări (zile)</Label>
              <Input
                id="smart_cancel_window_days"
                name="smart_cancel_window_days"
                type="number"
                min={7}
                max={365}
                defaultValue={prof.smart_cancel_window_days ?? 60}
                className="border-zinc-700 bg-zinc-900"
              />
            </div>
          </div>

          <Button type="submit" className="rounded-full border-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 text-slate-900 hover:brightness-105">
            Salvează reguli smart
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Programări</h2>
          <p className="text-sm text-muted-foreground">De ieri în viitor, primele 50.</p>
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
