import { redirect } from "next/navigation";

import { saveOnboardingProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractProgramPauza } from "@/lib/program";
import { selectWithTelefonFallback } from "@/lib/supabase/profesionisti-fallback";
import { getUser, createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

type OnboardingProfile = {
  nume_business?: string | null;
  telefon?: string | null;
  whatsapp?: string | null;
  tip_activitate?: string | null;
  program?: unknown;
  pauza_intre_clienti?: number | null;
  onboarding_pas?: number | null;
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile, telefonColumnAvailable } = await selectWithTelefonFallback<OnboardingProfile>(
    async (columns) => await supabase.from("profesionisti").select(columns).eq("user_id", user.id).maybeSingle(),
    "nume_business, telefon, whatsapp, tip_activitate, program, pauza_intre_clienti, onboarding_pas",
    "nume_business, tip_activitate, program, pauza_intre_clienti, onboarding_pas"
  );

  if (
    profile?.nume_business?.trim() &&
    profile?.tip_activitate?.trim() &&
    (!telefonColumnAvailable || profile?.telefon?.trim()) &&
    (profile?.onboarding_pas ?? 0) >= 4
  ) {
    redirect("/dashboard");
  }

  const sp = searchParams ? await searchParams : {};
  const pauzaProgram = extractProgramPauza(profile?.program ?? null);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-background p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Finalizează profilul</h1>
        <p className="text-sm text-muted-foreground">Completează datele de bază ca să accesezi meniul.</p>
      </div>

      {sp.error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-200">
          {decodeURIComponent(sp.error)}
        </div>
      ) : null}

      <form action={saveOnboardingProfile} className="mt-8 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <div className="space-y-2">
          <Label htmlFor="nume_business">Nume business</Label>
          <Input
            id="nume_business"
            name="nume_business"
            required
            maxLength={120}
            defaultValue={profile?.nume_business ?? ""}
            placeholder="ex: Cabinet Dr. Ionescu"
            className="border-zinc-700 bg-zinc-900"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefon</Label>
            <Input
              id="telefon"
              name="telefon"
              type="tel"
              required
              maxLength={40}
              defaultValue={profile?.telefon ?? ""}
              placeholder="07xx xxx xxx"
              className="border-zinc-700 bg-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (Opțional)</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              maxLength={40}
              defaultValue={profile?.whatsapp ?? ""}
              placeholder="07xx xxx xxx"
              className="border-zinc-700 bg-zinc-900"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tip_activitate">Tip activitate</Label>
          <Input
            id="tip_activitate"
            name="tip_activitate"
            required
            maxLength={80}
            defaultValue={profile?.tip_activitate ?? ""}
            placeholder="ex: cabinet medical, salon, studio foto, etc."
            className="border-zinc-700 bg-zinc-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pauza_intre_clienti">Timp între programări (minute)</Label>
          <Input
            id="pauza_intre_clienti"
            name="pauza_intre_clienti"
            type="number"
            min={0}
            max={120}
            step={5}
            defaultValue={profile?.pauza_intre_clienti ?? ""}
            placeholder="Opțional (ex: 10)"
            className="border-zinc-700 bg-zinc-900"
          />
          <p className="text-xs text-muted-foreground">Lasă gol dacă nu vrei pauză implicită între programări.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pauza_start">Pauză zilnică - ora de start</Label>
            <Input
              id="pauza_start"
              name="pauza_start"
              type="time"
              defaultValue={pauzaProgram?.start ?? ""}
              className="border-zinc-700 bg-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pauza_durata">Pauză zilnică - durată (minute)</Label>
            <Input
              id="pauza_durata"
              name="pauza_durata"
              type="number"
              min={15}
              max={240}
              step={5}
              defaultValue={pauzaProgram?.durationMinutes ?? ""}
              placeholder="ex: 60"
              className="border-zinc-700 bg-zinc-900"
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">Opțional. Dacă setezi ora și durata, în intervalul de pauză nu vor exista sloturi disponibile.</p>
        <Button type="submit" className="w-full rounded-full">
          Salvează și continuă
        </Button>
      </form>
    </div>
  );
}
