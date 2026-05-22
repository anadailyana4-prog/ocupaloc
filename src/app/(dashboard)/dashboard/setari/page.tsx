import { redirect } from "next/navigation";
import Link from "next/link";

import { SmartRulesForm } from "../smart-rules-form";
import { updateCommunicationSettings, updatePublicBusinessFields, updatePauzeSettings } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";
import { extractProgramPauza } from "@/lib/program";

type PageProps = {
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

export const dynamic = "force-dynamic";

type SettingsProfile = {
  id?: string;
  slug?: string | null;
  telefon?: string | null;
  description?: string | null;
  smart_rules_enabled?: boolean | null;
  smart_max_future_bookings?: number | null;
  smart_client_cancel_threshold?: number | null;
  smart_cancel_window_days?: number | null;
  smart_min_notice_minutes?: number | null;
  pauza_intre_clienti?: number | null;
  email_reminders_enabled?: boolean | null;
  google_review_url?: string | null;
  program?: unknown;
  bio?: unknown;
};

export default async function DashboardSetariPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: prof, error: profErr } = await selectWithTelefonFallback<SettingsProfile>(
    async (columns) => await supabase.from("profesionisti").select(columns).eq("user_id", user.id).maybeSingle(),
    "id, slug, telefon, description, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes, pauza_intre_clienti, email_reminders_enabled, google_review_url, program, bio",
    "id, slug, description, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes, pauza_intre_clienti, email_reminders_enabled, google_review_url, program, bio"
  );

  if (profErr || !prof?.id) {
    redirect("/dashboard");
  }

  const sp = searchParams ? await searchParams : {};
  const pauzaProgram = extractProgramPauza(prof.program ?? null);

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="dash-page-title">Setări business</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configurează informațiile publice și regulile de rezervare.</p>
        </div>
        <Button asChild variant="secondary" className="rounded-full text-sm">
          <Link href="/dashboard">← Meniu</Link>
        </Button>
      </div>

      {sp.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Setările au fost salvate.
        </div>
      ) : null}
      {sp.error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 flex items-center justify-between">
          <span>Eroare la salvare. Încearcă din nou.</span>
          <Link href="/dashboard/setari" className="text-xs underline">
            Ascunde
          </Link>
        </div>
      ) : null}

      {/* Pause settings — first so it's visible without scrolling */}
      <section className="lux-card space-y-4 p-6">
        <div>
          <h2 className="dash-section-title">Pauze</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configurează pauza dintre programări și pauza zilnică de prânz.
          </p>
        </div>
        <form action={updatePauzeSettings} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pauza_intre_clienti">Timp între programări (minute)</Label>
            <Input
              id="pauza_intre_clienti"
              name="pauza_intre_clienti"
              type="number"
              min={0}
              max={120}
              step={5}
              defaultValue={prof.pauza_intre_clienti ?? ""}
              className="dash-input"
              placeholder="ex. 10"
            />
            <p className="text-xs text-muted-foreground">Pauza adăugată automat după fiecare programare (0 = fără pauză).</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pauza_start">Pauză zilnică — ora de start</Label>
              <Input
                id="pauza_start"
                name="pauza_start"
                type="time"
                defaultValue={pauzaProgram?.start ?? ""}
                className="dash-input"
                placeholder="ex. 13:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pauza_durata">Pauză zilnică — durată (minute)</Label>
              <Input
                id="pauza_durata"
                name="pauza_durata"
                type="number"
                min={15}
                max={240}
                step={15}
                defaultValue={pauzaProgram?.durationMinutes ?? ""}
                className="dash-input"
                placeholder="ex. 60"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Lasă ora și durata goale dacă nu ai pauză zilnică.</p>
          <Button
            type="submit"
            className="rounded-full border-0 bg-gradient-to-r from-oc-amber-light to-oc-amber text-white hover:brightness-105"
          >
            Salvează pauzele
          </Button>
        </form>
      </section>

      {/* Public profile fields */}
      <section className="lux-card space-y-4 p-6">
        <div>
          <h2 className="dash-section-title">Date publice</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Telefonul și descrierea apar pe pagina publică a business-ului tău.
            {prof.slug ? (
              <>
                {" "}
                <a
                  href={`/${prof.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-oc-amber hover:underline"
                >
                  Deschide pagina publică →
                </a>
              </>
            ) : null}
          </p>
        </div>
        <form action={updatePublicBusinessFields} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              maxLength={50}
              defaultValue={prof.telefon ?? ""}
              className="dash-input"
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
              className="resize-y dash-input"
            />
          </div>
          <Button
            type="submit"
            className="rounded-full border-0 bg-gradient-to-r from-oc-amber-light to-oc-amber text-white hover:brightness-105"
          >
            Salvează datele publice
          </Button>
        </form>
      </section>

      {/* Smart booking rules */}
      <SmartRulesForm
        enabled={Boolean(prof.smart_rules_enabled)}
        maxFutureBookings={prof.smart_max_future_bookings ?? 0}
        minNoticeMinutes={prof.smart_min_notice_minutes ?? 0}
        clientCancelThreshold={prof.smart_client_cancel_threshold ?? 0}
        cancelWindowDays={prof.smart_cancel_window_days ?? 60}
      />

      <section className="lux-card space-y-4 p-6">
        <div>
          <h2 className="dash-section-title">Reminder-e email & review</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configurează reminder-ele pe email și link-ul Google review trimis după finalizarea programării.</p>
        </div>

        <form action={updateCommunicationSettings} className="space-y-4">
          <div className="flex items-center gap-3 dash-panel p-3">
            <input
              id="email_reminders_enabled"
              name="email_reminders_enabled"
              type="checkbox"
              defaultChecked={prof.email_reminders_enabled !== false}
              className="h-4 w-4 rounded oc-border bg-white"
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="email_reminders_enabled" className="cursor-pointer">Activează reminder-ele pe email pentru clienți</Label>
              <span
                title="Trimitem 3 tipuri de reminder pe email: 24h (cu linkuri securizate pentru confirmare, reprogramare, anulare), 2h (reconfirmare apropiată), morning (în dimineața programării pentru ziua curentă)."
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border oc-border text-[11px] font-semibold oc-secondary-text cursor-help"
                aria-label="Detalii reminder-e email"
              >
                i
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_review_url">Link Google review (post-programare)</Label>
            <Input
              id="google_review_url"
              name="google_review_url"
              type="url"
              defaultValue={prof.google_review_url ?? ""}
              className="dash-input"
              placeholder="https://g.page/r/.../review"
            />
          </div>

          <Button
            type="submit"
            className="rounded-full border-0 bg-gradient-to-r from-oc-amber-light to-oc-amber text-white hover:brightness-105"
          >
            Salvează reminder-ele email & review
          </Button>
        </form>
      </section>
    </div>
  );
}
