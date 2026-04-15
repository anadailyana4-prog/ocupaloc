import { redirect } from "next/navigation";

import { saveOnboardingProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUser, createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: PageProps) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.full_name?.trim() && profile?.phone?.trim() && profile?.role?.trim()) {
    redirect("/dashboard");
  }

  const sp = searchParams ? await searchParams : {};

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-background p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Finalizează profilul</h1>
        <p className="text-sm text-muted-foreground">Completează datele de bază ca să accesezi dashboard-ul.</p>
      </div>

      {sp.error ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-200">
          {decodeURIComponent(sp.error)}
        </div>
      ) : null}

      <form action={saveOnboardingProfile} className="mt-8 space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nume</Label>
          <Input
            id="full_name"
            name="full_name"
            required
            maxLength={120}
            defaultValue={profile?.full_name ?? ""}
            placeholder="Ana Popescu"
            className="border-zinc-700 bg-zinc-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            maxLength={40}
            defaultValue={profile?.phone ?? ""}
            placeholder="07xx xxx xxx"
            className="border-zinc-700 bg-zinc-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <Input
            id="role"
            name="role"
            required
            maxLength={60}
            defaultValue={profile?.role ?? ""}
            placeholder="Proprietar"
            className="border-zinc-700 bg-zinc-900"
          />
        </div>
        <Button type="submit" className="w-full rounded-full">
          Salvează și continuă
        </Button>
      </form>
    </div>
  );
}
