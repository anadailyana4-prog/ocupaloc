"use client";

import Link from "next/link";

import { BookingCard } from "@/components/booking/BookingCard";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F6F1] text-[#1E293B] antialiased">
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-[#F8F6F1]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-xl font-bold tracking-tight text-[#0F766E] md:text-2xl">
            OcupaLoc
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#64748B] md:flex">
            <a href="#cum-functioneaza" className="transition-colors hover:text-[#1E293B]">
              Cum funcționează
            </a>
            <a href="#pentru-cine" className="transition-colors hover:text-[#1E293B]">
              Pentru cine este
            </a>
            <a href="#pret" className="transition-colors hover:text-[#1E293B]">
              Preț
            </a>
            <a href="#intrebari" className="transition-colors hover:text-[#1E293B]">
              Întrebări
            </a>
          </nav>
          <Link
            href="/signup?start=1"
            data-analytics="homepage_cta_signup"
            data-cta-location="homepage_header"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#F59E0B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#D97706]"
          >
            Încearcă gratuit
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-16 md:pt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div>
              <p className="inline-flex rounded-full border border-[#E2E8F0] bg-[#EEF7F6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#0F766E]">
                Programări online pentru orice business
              </p>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Clienții rezervă online. Tu vezi totul clar, într-un singur loc.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#64748B] md:text-lg">
                OcupaLoc este potrivit pentru saloane, clinici, consultanți, studiouri și alte businessuri bazate pe
                programări. Clientul își alege serviciul, vede sloturile libere și confirmă din email, iar tu gestionezi
                totul dintr-un meniu simplu.
              </p>

              <ul className="mt-6 grid gap-2 text-sm font-medium text-[#1E293B] sm:grid-cols-2">
                <li className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">14 zile gratuite</li>
                <li className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2">59,99 RON/lună, TVA inclus</li>
                <li className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 sm:col-span-2">Zero comision per programare</li>
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup?start=1"
                  data-analytics="homepage_cta_signup"
                  data-cta-location="homepage_hero"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#F59E0B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#D97706]"
                >
                  Încearcă gratuit
                </Link>
                <a
                  href="#cum-functioneaza"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-[#0F766E] bg-white px-5 text-sm font-semibold text-[#0F766E] transition-colors hover:bg-[#EEF7F6]"
                >
                  Vezi cum funcționează
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_20px_45px_-30px_rgba(15,118,110,0.35)]">
              <div className="mb-3 rounded-xl border border-[#E2E8F0] bg-[#EEF7F6] p-3 text-sm text-[#1E293B]">
                <p className="font-semibold text-[#0F766E]">Flux rezervare</p>
                <p className="mt-1 text-[#64748B]">Serviciu ales → Dată → Oră → Confirmare</p>
              </div>
              <BookingCard variant="demo" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="grid gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              "Link personalizat de rezervare",
              "Programări nelimitate",
              "Confirmări automate SMS/Email",
              "Import clienți gratuit",
              "Suport rapid în limba română"
            ].map((item) => (
              <div key={item} className="rounded-lg border border-[#E2E8F0] bg-[#EEF7F6] px-3 py-2 text-sm font-medium text-[#1E293B]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Când programările vin din mai multe locuri, apare haosul.
            </h2>
            <p className="mt-4 text-base text-[#64748B]">
              Multe businessuri primesc programări prin telefon, mesaje sau canale diferite. Fără o structură clară,
              programul devine greu de urmărit.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              "Programările vin din mai multe locuri",
              "Orele trebuie urmărite manual",
              "Apar apeluri repetitive",
              "Confirmările și schimbările consumă timp"
            ].map((problem) => (
              <article key={problem} className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-[#1E293B]">{problem}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="cum-functioneaza" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Un flux simplu, ușor de urmărit</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0F766E]">Pasul 1</p>
              <h3 className="mt-2 text-xl font-semibold">Primești pagina ta de rezervare</h3>
              <p className="mt-2 text-sm text-[#64748B]">O poți pune pe Instagram, WhatsApp, site sau Google Maps.</p>
            </article>
            <article className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0F766E]">Pasul 2</p>
              <h3 className="mt-2 text-xl font-semibold">Clientul rezervă singur</h3>
              <p className="mt-2 text-sm text-[#64748B]">Își alege serviciul și vede doar sloturile libere.</p>
            </article>
            <article className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#0F766E]">Pasul 3</p>
              <h3 className="mt-2 text-xl font-semibold">Primești confirmări automate</h3>
              <p className="mt-2 text-sm text-[#64748B]">Status clar în meniu, fără apeluri repetitive.</p>
            </article>
          </div>
        </section>

        <section id="pentru-cine" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Potrivit pentru businessuri bazate pe programări
            </h2>
            <p className="mt-3 text-base text-[#64748B]">
              Același flux clar de rezervare poate fi folosit în tipuri diferite de business.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Saloane", "Clinici", "Consultanți", "Studiouri", "Beauty", "Servicii locale"].map((item) => (
              <article key={item} className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold">{item}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Totul inclus într-un plan clar</h2>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              "Preț fix: 59,99 RON/lună",
              "TVA inclus",
              "Zero comision per programare",
              "Link personalizat de rezervare",
              "Programări nelimitate",
              "Import clienți gratuit",
              "Suport rapid în limba română",
              "Meniu de administrare",
              "Confirmări email",
              "Gestionarea zilnică a programărilor"
            ].map((benefit) => (
              <div key={benefit} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#1E293B] shadow-sm">
                {benefit}
              </div>
            ))}
          </div>
        </section>

        <section id="pret" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Un singur plan. Totul inclus.</h2>
          </div>

          <div className="mt-8 max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_40px_-30px_rgba(15,118,110,0.35)] sm:p-8">
            <p className="text-4xl font-bold tracking-tight text-[#1E293B]">
              59,99 RON<span className="text-base font-medium text-[#64748B]">/lună</span>
            </p>
            <p className="mt-1 text-sm text-[#64748B]">per locație • TVA inclus</p>

            <ul className="mt-6 space-y-2 text-sm text-[#1E293B]">
              <li>Programări nelimitate</li>
              <li>Zero comision per programare</li>
              <li>Link personalizat de rezervare</li>
              <li>Import clienți gratuit</li>
              <li>Suport rapid în limba română</li>
            </ul>

            <Link
              href="/signup?start=1"
              data-analytics="homepage_cta_signup"
              data-cta-location="homepage_pricing"
              className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#F59E0B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#D97706]"
            >
              Încearcă 14 zile gratis
            </Link>

            <p className="mt-3 text-xs text-[#64748B]">Model clar: un abonament lunar fix pentru business-ul tău.</p>
          </div>
        </section>

        <section id="intrebari" className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Întrebări frecvente</h2>
          </div>

          <div className="mt-8 space-y-3">
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Pentru ce tipuri de business este OcupaLoc?</summary>
              <p className="mt-3 text-sm text-[#64748B]">
                OcupaLoc este potrivit pentru saloane, clinici, consultanți, studiouri și alte businessuri bazate pe programări.
              </p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Cum rezervă clientul?</summary>
              <p className="mt-3 text-sm text-[#64748B]">
                Clientul intră pe linkul tău personalizat, își alege serviciul și vede doar sloturile libere.
              </p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Cum confirmă clientul?</summary>
              <p className="mt-3 text-sm text-[#64748B]">
                Clientul confirmă din email și poate folosi linkul securizat pentru anulare sau reprogramare.
              </p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Există comision pentru fiecare programare?</summary>
              <p className="mt-3 text-sm text-[#64748B]">Nu. Planul are zero comision per programare.</p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Ce include planul?</summary>
              <p className="mt-3 text-sm text-[#64748B]">
                Planul include programări nelimitate, link personalizat de rezervare, import clienți gratuit, confirmări automate SMS/Email și
                suport rapid în limba română.
              </p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Pot testa înainte să plătesc?</summary>
              <p className="mt-3 text-sm text-[#64748B]">Da. Ai 14 zile gratuite pentru testare.</p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Plata online la rezervare este disponibilă?</summary>
              <p className="mt-3 text-sm text-[#64748B]">Nu, plata online la rezervare nu este integrată în acest moment.</p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Se pot anula sau reprograma clienții?</summary>
              <p className="mt-3 text-sm text-[#64748B]">Da. Clientul poate anula sau reprograma prin link securizat.</p>
            </details>
            <details className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#1E293B]">Cum iau legătura cu voi?</summary>
              <p className="mt-3 text-sm text-[#64748B]">
                Ne poți scrie la{" "}
                <a href={CONTACT_MAILTO} className="font-semibold text-[#0F766E] underline decoration-[#0F766E]/40 underline-offset-2">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </details>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#EEF7F6] p-6 text-center sm:p-10">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Încearcă varianta clară pentru programări online.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[#64748B]">
              Testezi gratuit și vezi dacă fluxul se potrivește businessului tău.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup?start=1"
                data-analytics="homepage_cta_signup"
                data-cta-location="homepage_final_cta"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#F59E0B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#D97706]"
              >
                Încearcă gratuit
              </Link>
              <a
                href="#pret"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#0F766E] bg-white px-5 text-sm font-semibold text-[#0F766E] transition-colors hover:bg-[#EEF7F6]"
              >
                Vezi prețul
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-xl font-semibold text-[#0F766E]">OcupaLoc</p>
            <p className="mt-2 text-sm text-[#64748B]">Programări online pentru orice business</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <a href="#pret" className="text-[#1E293B] hover:text-[#0F766E]">
              Prețuri
            </a>
            <Link href="/gdpr" className="text-[#1E293B] hover:text-[#0F766E]">
              GDPR
            </Link>
            <a href={CONTACT_MAILTO} className="text-[#1E293B] hover:text-[#0F766E]">
              Contact
            </a>
          </div>

          <div>
            <a href={CONTACT_MAILTO} className="text-sm font-medium text-[#0F766E] hover:text-[#115E59]">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

type DemoLandingProps = {
  businessName: string;
  city: string;
  businessType: string;
  services: Array<string | { name?: string; price?: number; label?: string }>;
  ctaHref: string;
};

export function DemoLandingPreview({ businessName, city, businessType, services, ctaHref }: DemoLandingProps) {
  const serviceLabels = services.map((service) => {
    if (typeof service === "string") return service;
    if (typeof service === "object" && service && "label" in service && typeof (service as { label?: unknown }).label === "string") {
      return (service as { label: string }).label;
    }
    if (typeof service === "object" && service && "name" in service && "price" in service) {
      const name = String((service as { name?: unknown }).name ?? "Serviciu");
      const price = String((service as { price?: unknown }).price ?? "");
      return `${name}${price ? ` ${price} RON` : ""}`;
    }
    return "Serviciu";
  });

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-10 text-white">
      <div className="rounded-2xl border border-yellow-500 bg-yellow-400 p-4 text-center text-sm font-bold text-black">
        DEMO - Acest business nu există, e doar exemplu
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-4xl font-extrabold tracking-tight">
          {businessName} - {city}
        </h1>
        <p className="mt-3 text-zinc-300">
          Exemplu de pagină pentru {businessType.toLowerCase()} cu programări online și preț fix 59,99 RON/lună, fără comision.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {serviceLabels.map((service) => (
            <div key={service} className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm">
              {service}
            </div>
          ))}
        </div>
        <Link href={ctaHref} className="mt-8 inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-500">
          Vreau și eu așa
        </Link>
      </div>
      <BookingCard variant="demo" />
    </section>
  );
}
