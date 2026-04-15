import Link from "next/link";
import { redirect } from "next/navigation";

import { savePageSettings } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{ saved?: string; error?: string }>;
};

export default async function PaginaDashboardPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profMeta } = await supabase.from("profesionisti").select("id").eq("user_id", user.id).maybeSingle();
  if (!profMeta?.id) {
    redirect("/onboarding");
  }

  const { data: org, error } = await supabase
    .from("profesionisti")
    .select("nume_business, telefon, email, description, slug")
    .eq("id", profMeta.id)
    .maybeSingle();

  if (error || !org) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">
        Nu am putut încărca datele: {error?.message ?? "Organizație lipsă."}
      </div>
    );
  }

  const sp = searchParams ? await searchParams : {};

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Pagina publică</h1>
        <p className="text-sm text-muted-foreground">
          Numele, telefonul și descrierea apar pe{" "}
          <Link href={`/${org.slug}`} className="font-medium text-indigo-400 underline-offset-4 hover:underline">
            /{org.slug}
          </Link>
          . Emailul e opțional și e folosit doar pentru alerte la rezervări noi.
        </p>
      </div>

      {sp.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">Setările au fost salvate.</div>
      ) : null}
      {sp.error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">{decodeURIComponent(sp.error)}</div>
      ) : null}

      <form action={savePageSettings} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="name">Nume business</Label>
          <Input
            id="name"
            name="name"
            required
            maxLength={200}
            defaultValue={org.nume_business}
            className="border-zinc-700 bg-zinc-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            maxLength={50}
            defaultValue={org.telefon ?? ""}
            placeholder="07xx xxx xxx"
            className="border-zinc-700 bg-zinc-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email notificări rezervări</Label>
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={200}
            defaultValue={org.email ?? ""}
            placeholder="salon@exemplu.ro"
            className="border-zinc-700 bg-zinc-900"
          />
          <p className="text-xs text-muted-foreground">Primești aici mesaj la fiecare rezervare nouă (când e configurat Resend).</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descriere</Label>
          <Textarea
            id="description"
            name="description"
            maxLength={200}
            rows={4}
            defaultValue={org.description ?? ""}
            placeholder="Scurtă descriere vizibilă pe pagina ta publică…"
            className="resize-y border-zinc-700 bg-zinc-900"
          />
          <p className="text-xs text-muted-foreground">Maximum 200 de caractere.</p>
        </div>
        <Button type="submit" className="rounded-full px-8">
          Salvează
        </Button>
      </form>
    </div>
  );
}
