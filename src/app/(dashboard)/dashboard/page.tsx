import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivationWidgets } from "./activation-widgets";
import { CopyPublicLinkButton } from "./copy-public-link";
import { ProgramariTable, type ProgramareRow } from "./programari-table";
import { updatePublicSalonFields } from "./actions";
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
    .select("id, slug, telefon, description, nume_business, onboarding_pas, program")
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
    <div className="space-y-12">
      <ActivationWidgets slug={prof.slug ?? null} profileDone={profileDone} serviciiCount={serviciiCount ?? 0} programSetat={programSetat} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Bun venit, {greetName}</h1>
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

      <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Date publice</h2>
        <p className="text-sm text-muted-foreground">Telefonul și descrierea apar pe pagina publică a salonului.</p>
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
          <Button type="submit" className="rounded-full">
            Salvează datele publice
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
