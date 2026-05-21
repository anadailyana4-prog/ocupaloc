"use client";

import Link from "next/link";

import { BookingCard } from "@/components/booking/BookingCard";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export function LandingPage() {
  return (
    <div className="min-h-screen oc-bg oc-text antialiased">
      <header className="sticky top-0 z-40 border-b oc-border oc-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-display text-xl font-bold tracking-tight oc-accent md:text-2xl">
            OcupaLoc
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium oc-secondary-text md:flex">
            <a href="#cum-functioneaza" className="transition-colors hover:oc-text">
              Cum funcționează
            </a>
            <a href="#pentru-cine" className="transition-colors hover:oc-text">
              Pentru cine este
            </a>
            <Link href="/preturi" className="transition-colors hover:oc-text">
              Preț
            </Link>
            <a href="#intrebari" className="transition-colors hover:oc-text">
              Întrebări
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg border oc-border bg-white px-4 text-sm font-semibold oc-accent transition-colors hover:oc-badge-bg"
            >
              Intră în cont
            </Link>
            <Link
              href="/signup?start=1"
              data-analytics="homepage_cta_signup"
              data-cta-location="homepage_header"
              className="inline-flex h-10 items-center justify-center rounded-lg oc-primary px-4 text-sm font-semibold transition-colors"
            >
              Încearcă gratuit
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-16 md:pt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div>
              <p className="inline-flex rounded-full border oc-border oc-badge-bg px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] oc-accent">
                Programări online pentru orice business
              </p>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Clienții rezervă online. Tu vezi totul clar, într-un singur loc.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed oc-secondary-text md:text-lg">
                OcupaLoc este potrivit pentru saloane, clinici, consultanți, studiouri și alte businessuri bazate pe
                programări. Clientul își alege serviciul, vede sloturile libere și confirmă din email, iar tu gestionezi
                totul dintr-un meniu simplu.
              </p>

              <ul className="mt-6 grid gap-2 text-sm font-medium oc-text sm:grid-cols-2">
                <li className="rounded-lg border oc-border bg-white px-3 py-2">14 zile gratuite</li>
                <li className="rounded-lg border oc-border bg-white px-3 py-2">59,99 RON/lună, TVA inclus</li>
                <li className="rounded-lg border oc-border bg-white px-3 py-2 sm:col-span-2">Zero comision per programare</li>
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup?start=1"
                  data-analytics="homepage_cta_signup"
                  data-cta-location="homepage_hero"
                  className="inline-flex h-11 items-center justify-center rounded-lg oc-primary px-5 text-sm font-semibold text-white transition-colors"
                >
                  Încearcă gratuit
                </Link>
                <Link
                  href="/demo-interactiv"
                  data-cta-location="homepage_hero_demo"
                  className="inline-flex h-11 items-center justify-center rounded-lg border oc-border bg-white px-5 text-sm font-semibold oc-accent transition-colors hover:oc-badge-bg"
                >
                  Vezi demo fără cont
                </Link>
                <a
                  href="#cum-functioneaza"
                  className="inline-flex h-11 items-center justify-center rounded-lg border oc-border bg-white px-5 text-sm font-semibold oc-accent transition-colors hover:oc-badge-bg"
                >
                  Cum funcționează
                </a>
              </div>
            </div>

            <div className="rounded-2xl border oc-border bg-white p-3 shadow-[0_20px_45px_-30px_rgba(15,118,110,0.35)]">
              <div className="mb-3 rounded-xl border oc-border oc-badge-bg p-3 text-sm oc-text">
                <p className="font-semibold oc-accent">Flux rezervare</p>
                <p className="mt-1 oc-secondary-text">Serviciu ales → Dată → Oră → Confirmare</p>
              </div>
              <BookingCard variant="demo" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="grid gap-2 rounded-2xl border oc-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              "Link personalizat de rezervare",
              "Programări nelimitate",
              "Confirmări automate email",
              "Import clienți gratuit",
              "Suport rapid în limba română"
            ].map((item) => (
              <div key={item} className="rounded-lg border oc-border oc-badge-bg px-3 py-2 text-sm font-medium oc-text">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-10 md:pb-14">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Încredere de la profesioniști din România</h2>
            <p className="mt-3 text-base oc-secondary-text">
              OcupaLoc este gândit pentru saloane, cabinete și antreprenori locali care vor programări online clare, în limba română, fără comision per
              rezervare.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                quote: "În sfârșit am un link de rezervare pe care îl trimit direct pe WhatsApp — nu mai stau să explic orele la telefon.",
                attr: "Antreprenor servicii locale"
              },
              {
                quote: "Prețul fix ne ajută la buget: știm luna asta exact ce plătim, indiferent câte programări primim.",
                attr: "Salon beauty, oraș mediu"
              },
              {
                quote: "Am trecut de la mesaje împrăștiate la o listă clară de programări, cu confirmări pentru client.",
                attr: "Profesionist independent"
              }
            ].map((t) => (
              <blockquote key={t.quote} className="oc-card border oc-border p-5 shadow-sm">
                <p className="text-sm leading-relaxed oc-text">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-3 text-xs font-medium oc-secondary-text">— {t.attr}</footer>
              </blockquote>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border oc-border oc-badge-bg p-5 md:flex md:items-center md:justify-between md:gap-6">
            <div>
              <p className="text-sm font-semibold oc-accent">Exemplu: pagina ta publică de programări</p>
              <p className="mt-1 text-sm oc-secondary-text">
                Vezi în demo cum arată linkul pe care îl trimiți clienților — același flux cap-coadă, fără cont pentru test.
              </p>
            </div>
            <Link
              href="/demo-interactiv"
              data-cta-location="homepage_social_proof_demo"
              className="mt-4 inline-flex h-11 shrink-0 items-center justify-center rounded-lg oc-primary px-5 text-sm font-semibold text-white transition-colors md:mt-0"
            >
              Deschide demo fără cont
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Când programările vin din mai multe locuri, apare haosul.
            </h2>
            <p className="mt-4 text-base oc-secondary-text">
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
              <article key={problem} className="oc-card p-4 shadow-sm">
                <p className="text-sm font-medium oc-text">{problem}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="cum-functioneaza" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Un flux simplu, ușor de urmărit</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="oc-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] oc-accent">Pasul 1</p>
              <h3 className="mt-2 text-xl font-semibold">Primești pagina ta de rezervare</h3>
              <p className="mt-2 text-sm oc-secondary-text">O poți pune pe Instagram, WhatsApp, site sau Google Maps.</p>
            </article>
            <article className="oc-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] oc-accent">Pasul 2</p>
              <h3 className="mt-2 text-xl font-semibold">Clientul rezervă singur</h3>
              <p className="mt-2 text-sm oc-secondary-text">Își alege serviciul și vede doar sloturile libere.</p>
            </article>
            <article className="oc-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] oc-accent">Pasul 3</p>
              <h3 className="mt-2 text-xl font-semibold">Primești confirmări automate</h3>
              <p className="mt-2 text-sm oc-secondary-text">Status clar în meniu, fără apeluri repetitive.</p>
            </article>
          </div>
        </section>

        <section id="pentru-cine" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Potrivit pentru businessuri bazate pe programări
            </h2>
            <p className="mt-3 text-base oc-secondary-text">
              Același flux clar de rezervare poate fi folosit în tipuri diferite de business.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Saloane", "Frizerii", "Coafor", "Manichiură", "Cosmetică", "Psihologi", "Nutriționiști", "Clinici"].map((item) => (
              <article key={item} className="oc-card p-5 shadow-sm">
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
              <div key={benefit} className="oc-card px-4 py-3 text-sm font-medium oc-text shadow-sm">
                {benefit}
              </div>
            ))}
          </div>
        </section>

        <section id="pret" className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Un singur plan. Totul inclus.</h2>
          </div>

          <div className="mt-8 max-w-lg rounded-2xl border oc-border bg-white p-6 shadow-[0_18px_40px_-30px_rgba(15,118,110,0.35)] sm:p-8">
            <p className="text-4xl font-bold tracking-tight oc-text">
              59,99 RON<span className="text-base font-medium oc-secondary-text">/lună</span>
            </p>
            <p className="mt-1 text-sm oc-secondary-text">per locație • TVA inclus</p>

            <ul className="mt-6 space-y-2 text-sm oc-text">
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
              className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-lg oc-primary px-5 text-sm font-semibold transition-colors"
            >
              Încearcă 14 zile gratis
            </Link>

            <p className="mt-3 text-xs oc-secondary-text">
              Model clar: un abonament lunar fix pentru business-ul tău. Poți anula oricând, fără penalizări — vezi condițiile pe pagina de prețuri.
            </p>
            <Link href="/preturi" className="mt-3 inline-flex text-sm font-semibold oc-accent underline decoration-oc-teal/30 underline-offset-4">
              Toate detaliile despre preț și trial →
            </Link>
          </div>
        </section>

        <section id="intrebari" className="mx-auto max-w-4xl px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Întrebări frecvente</h2>
          </div>

          <div className="mt-8 space-y-3">
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Pentru ce tipuri de business este OcupaLoc?</summary>
              <p className="mt-3 text-sm oc-secondary-text">
                OcupaLoc este potrivit pentru saloane, clinici, consultanți, studiouri și alte businessuri bazate pe programări.
              </p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Cum rezervă clientul?</summary>
              <p className="mt-3 text-sm oc-secondary-text">
                Clientul intră pe linkul tău personalizat, își alege serviciul și vede doar sloturile libere.
              </p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Cum confirmă clientul?</summary>
              <p className="mt-3 text-sm oc-secondary-text">
                Clientul confirmă din email și poate folosi linkul securizat pentru anulare sau reprogramare.
              </p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Există comision pentru fiecare programare?</summary>
              <p className="mt-3 text-sm oc-secondary-text">Nu. Planul are zero comision per programare.</p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Ce include planul?</summary>
              <p className="mt-3 text-sm oc-secondary-text">
                Planul include programări nelimitate, link personalizat de rezervare, import clienți gratuit, confirmări automate email și
                suport rapid în limba română.
              </p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Pot testa înainte să plătesc?</summary>
              <p className="mt-3 text-sm oc-secondary-text">Da. Ai 14 zile gratuite pentru testare.</p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Plata online la rezervare este disponibilă?</summary>
              <p className="mt-3 text-sm oc-secondary-text">Nu, plata online la rezervare nu este integrată în acest moment.</p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Se pot anula sau reprograma clienții?</summary>
              <p className="mt-3 text-sm oc-secondary-text">Da. Clientul poate anula sau reprograma prin link securizat.</p>
            </details>
            <details className="oc-card p-4">
              <summary className="cursor-pointer text-sm font-semibold oc-text">Cum iau legătura cu voi?</summary>
              <p className="mt-3 text-sm oc-secondary-text">
                Ne poți scrie la{" "}
                <a href={CONTACT_MAILTO} className="font-semibold oc-accent underline decoration-oc-teal/40 underline-offset-2">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </details>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-16">
          <div className="rounded-2xl border oc-border oc-badge-bg p-6 text-center sm:p-10">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Încearcă varianta clară pentru programări online.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base oc-secondary-text">
              Testezi gratuit și vezi dacă fluxul se potrivește businessului tău.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup?start=1"
                data-analytics="homepage_cta_signup"
                data-cta-location="homepage_final_cta"
                className="inline-flex h-11 items-center justify-center rounded-lg oc-primary px-5 text-sm font-semibold text-white transition-colors"
              >
                Încearcă gratuit
              </Link>
              <Link
                href="/demo-interactiv"
                data-cta-location="homepage_final_demo"
                className="inline-flex h-11 items-center justify-center rounded-lg border oc-border bg-white px-5 text-sm font-semibold oc-accent transition-colors hover:oc-badge-bg"
              >
                Vezi demo fără cont
              </Link>
              <Link
                href="/preturi"
                className="inline-flex h-11 items-center justify-center rounded-lg border oc-border bg-white px-5 text-sm font-semibold oc-accent transition-colors hover:oc-badge-bg"
              >
                Prețuri complete
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t oc-border oc-bg">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4 md:gap-12">
            <div>
              <p className="font-display text-lg font-semibold oc-accent">OcupaLoc</p>
              <p className="mt-2 text-sm oc-secondary-text">Programări online pentru orice business</p>
            </div>

            <div>
              <p className="text-sm font-semibold oc-text">Produs</p>
              <ul className="mt-3 space-y-2 text-sm oc-secondary-text">
                <li><Link href="/preturi" className="transition-colors hover:oc-text">Prețuri</Link></li>
                <li><Link href="/demo-interactiv" className="transition-colors hover:oc-text">Demo fără cont</Link></li>
                <li><a href="#cum-functioneaza" className="transition-colors hover:oc-text">Cum funcționează</a></li>
                <li><a href="#pentru-cine" className="transition-colors hover:oc-text">Pentru cine</a></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold oc-text">Legal</p>
              <ul className="mt-3 space-y-2 text-sm oc-secondary-text">
                <li><Link href="/gdpr" className="transition-colors hover:oc-text">GDPR</Link></li>
                <li><Link href="/confidentialitate" className="transition-colors hover:oc-text">Confidențialitate</Link></li>
                <li><Link href="/termeni" className="transition-colors hover:oc-text">Termeni</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold oc-text">Contact</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href={CONTACT_MAILTO} className="font-medium oc-accent transition-colors hover:oc-accent/80">{CONTACT_EMAIL}</a></li>
                <li><p className="text-xs oc-secondary-text">Suport rapid în limba română</p></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t oc-border pt-6 text-center">
            <p className="text-xs oc-secondary-text">© 2024-2026 OcupaLoc. Toate drepturile rezervate.</p>
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

function isBarberDemoType(businessType: string) {
  return businessType === "Barber" || businessType === "Frizerie";
}

export function DemoLandingPreview({ businessName, city, businessType, services, ctaHref }: DemoLandingProps) {
  const barberDemo = isBarberDemoType(businessType);
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
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="rounded-2xl border-2 border-oc-primary bg-oc-primary/10 p-4 text-center">
        <p className="text-sm font-bold oc-text">🔔 DEMO - Acest business nu există, e doar exemplu pentru a vedea fluxul</p>
      </div>
      <div className="rounded-2xl oc-card border oc-border p-8 shadow-md">
        <h1 className="text-4xl font-extrabold tracking-tight oc-text md:text-5xl">
          {businessName}
        </h1>
        <p className="mt-2 text-sm font-medium oc-accent">
          {barberDemo ? `Programări online · demo personalizat · ${city}` : `${businessType} · ${city}`}
        </p>
        <p className="mt-3 oc-secondary-text">
          {barberDemo
            ? "Pagina ta de rezervare — cu serviciul principal Tuns și restul meniului orientativ. Clienții se programează singuri; tu vezi doar orele ocupate."
            : `Exemplu de pagină pentru ${businessType.toLowerCase()} cu programări online și preț fix 59,99 RON/lună, fără comision.`}
        </p>
        {barberDemo ? (
          <p className="mt-4 text-xs oc-secondary-text">
            Servicii exemplu (Tuns, Tuns + barbă, Contur) — le înlocuiești cu prețurile tale la crearea profilului.
          </p>
        ) : null}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {serviceLabels.map((service) => (
            <div key={service} className="rounded-lg oc-card border oc-border p-4 text-sm oc-text shadow-sm">
              {service}
            </div>
          ))}
        </div>
        <Link href={ctaHref} className="mt-8 inline-flex rounded-lg oc-primary px-6 py-3 text-base font-semibold text-white transition-colors">
          Creează profilul tău — 14 zile gratuit
        </Link>
        <p className="mt-3 text-sm oc-secondary-text">
          Datele din demo se precompletează la înregistrare. După confirmarea emailului primești pagina ta live.
        </p>
      </div>
      <BookingCard variant="demo" />
    </section>
  );
}
