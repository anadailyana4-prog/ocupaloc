import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { DemoMarketingClient } from "./demo-marketing-client";

export const metadata: Metadata = {
  title: "Demo — cum arată programările online | OcupaLoc",
  description: "Vezi un exemplu realist cu Studio Beauty: servicii, zile și sloturi. Apoi încearcă gratuit sau intră în demo cu contul configurator.",
  alternates: { canonical: "https://ocupaloc.ro/demo" }
};

export default function DemoPage() {
  async function loginDemo() {
    "use server";

    const { redirect } = await import("next/navigation");

    const emailRaw = process.env[`DEMO${"_EMAIL"}`];
    const passwordRaw = process.env[`DEMO${"_PASSWORD"}`];
    if (!emailRaw || !passwordRaw) {
      redirect("/login?error=demo_config_missing");
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: emailRaw!,
      password: passwordRaw!
    });

    if (error) {
      redirect("/login?error=demo_login_failed");
    }

    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen oc-bg px-4 py-10 oc-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Demonstrație programări online</h1>
          <p className="mt-2 text-sm oc-secondary-text md:text-base">
            Exemplu „Studio Beauty” cu servicii și sloturi aliniate zilei de azi. Mai jos poți intra și în contul demo pentru
            dashboard, dacă este configurat.
          </p>
        </header>

        <DemoMarketingClient />

        <details className="mx-auto max-w-3xl rounded-xl border oc-border bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold oc-text">Intră în cont demo (admin)</summary>
          <p className="mt-2 text-xs oc-secondary-text">
            Necesită <code className="rounded bg-zinc-100 px-1">DEMO_EMAIL</code> și{" "}
            <code className="rounded bg-zinc-100 px-1">DEMO_PASSWORD</code> în mediul server.
          </p>
          <form action={loginDemo} className="mt-3">
            <Button data-testid="demo-login-submit" type="submit" variant="outline" className="w-full sm:w-auto">
              Intră în demo (dashboard)
            </Button>
          </form>
        </details>

        <p className="text-center text-xs oc-secondary-text">
          <Link href="/demo-interactiv" className="font-medium oc-accent underline underline-offset-2">
            Configurează un demo personalizat în 3 pași →
          </Link>
        </p>
      </div>
    </div>
  );
}
