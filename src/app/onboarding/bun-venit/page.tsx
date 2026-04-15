"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function BunVenitPage() {
  const [slug, setSlug] = useState("businessul-tau");

  useEffect(() => {
    const lastSlug = localStorage.getItem("ocupaloc:lastSlug");
    if (lastSlug) setSlug(lastSlug);
  }, []);

  const publicUrl = useMemo(() => `https://ocupaloc.ro/s/${slug}`, [slug]);

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
          <p className="text-lg text-zinc-400">Îți ia 3 minute să fii gata de primul client</p>
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

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/dashboard">Mergi în dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
