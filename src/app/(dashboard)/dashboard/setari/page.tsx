import { redirect } from "next/navigation";
import Link from "next/link";

import { SmartRulesForm } from "../smart-rules-form";
import { updatePublicBusinessFields } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

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
};

export default async function DashboardSetariPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: prof, error: profErr } = await selectWithTelefonFallback<SettingsProfile>(
    async (columns) => await supabase.from("profesionisti").select(columns).eq("user_id", user.id).maybeSingle(),
    "id, slug, telefon, description, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes",
    "id, slug, description, smart_rules_enabled, smart_max_future_bookings, smart_client_cancel_threshold, smart_cancel_window_days, smart_min_notice_minutes"
  );

  if (profErr || !prof?.id) {
    redirect("/dashboard");
  }

  const sp = searchParams ? await searchParams : {};

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-wide text-amber-100">Setări business</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configurează informațiile publice și regulile de rezervare.</p>
        </div>
        <Button asChild variant="secondary" className="rounded-full text-sm">
          <Link href="/dashboard">← Meniu</Link>
        </Button>
      </div>

      {sp.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
          Setările au fost salvate.
        </div>
      ) : null}
      {sp.error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {decodeURIComponent(sp.error)}
        </div>
      ) : null}

      {/* Public profile fields */}
      <section className="lux-card space-y-4 p-6">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-wide text-amber-100">Date publice</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Telefonul și descrierea apar pe pagina publică a business-ului tău.
            {prof.slug ? (
              <>
                {" "}
                <a
                  href={`/${prof.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 hover:underline"
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
          <Button
            type="submit"
            className="rounded-full border-0 bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 text-slate-900 hover:brightness-105"
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
    </div>
  );
}
