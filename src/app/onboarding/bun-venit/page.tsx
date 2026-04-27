"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";

import { Button } from "@/components/ui/button";
import { trackOnboardingEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useEffect } from "react";

function BunVenitContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "businessul-tau";

  useEffect(() => {
    trackOnboardingEvent("onboarding_activation", {
      step: 4,
      page: "/onboarding/bun-venit"
    });
  }, []);

  const publicUrl = useMemo(() => `https://ocupaloc.ro/${slug}`, [slug]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copiat.");
    } catch {
      toast.error("Nu am putut copia link-ul.");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Cont creat cu succes!</h1>
          <p className="text-lg text-zinc-400">Un pas rămas: activează trial-ul gratuit ca să poți primi programări.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold text-primary">1. Personalizează-ți pagina</p>
              <Button asChild className="w-full">
                <Link href="/dashboard/pagina">Editează profil</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold text-primary">2. Adaugă-ți serviciile complete</p>
              <Button asChild className="w-full" variant="secondary">
                <Link href="/dashboard/servicii">Adaugă servicii</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-semibold text-primary">3. Trimite link-ul clienților</p>
              <p className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">{publicUrl}</p>
              <Button className="w-full" variant="outline" onClick={() => void copyUrl()}>
                Copy
              </Button>
            </CardContent>
          </Card>
        </section>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-center text-sm text-amber-200">
          Dacă nu poți intra imediat în cont, verifică emailul și confirmă adresa. Pentru autentificare rapidă poți folosi și opțiunea
          Intră cu link pe email din pagina de login.
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center space-y-3">
          <p className="text-base font-semibold text-zinc-100">Activează trial gratuit 14 zile</p>
          <p className="text-sm text-zinc-400">Introdu cardul acum — nu ți se percepe nimic astăzi. Abonamentul (59,99 RON/lună) începe automat după cele 14 zile. Poți anula oricând.</p>
          <form method="get" action="/api/billing/create-checkout">
            <Button type="submit" size="lg" className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white">
              Introdu cardul și activează trial-ul
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function BunVenitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Se încarcă...</div>}>
      <BunVenitContent />
    </Suspense>
  );
}
