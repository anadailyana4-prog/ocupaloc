"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BookingCard } from "@/components/booking/BookingCard";

export function LandingPage() {
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);

  useEffect(() => {
    if (!isWalkthroughOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsWalkthroughOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isWalkthroughOpen]);

  const walkthroughSteps = [
    {
      title: "Clientul rezervă în sub 1 minut",
      detail: "Alege serviciul și intervalul disponibil direct din linkul tău public."
    },
    {
      title: "Confirmare automată pe email",
      detail: "Clientul primește imediat confirmare și link pentru confirmare/anulare."
    },
    {
      title: "Tu vezi totul în dashboard",
      detail: "Programări, status, KPI și modificări în același loc, fără haos în mesaje."
    },
    {
      title: "Reminder înainte de programare",
      detail: "Sistemul trimite remindere automate pentru a reduce no-show-urile."
    }
  ];

  return (
    <div className="relative overflow-hidden bg-transparent text-white antialiased">
      <div className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
      <header className="sticky top-0 z-40 border-b border-amber-200/15 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="font-display text-2xl font-semibold tracking-wide text-amber-100">ocupaloc.ro</div>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden items-center gap-6 text-sm text-amber-100/75 md:flex">
              <a href="#pricing" className="hover:text-amber-50">Prețuri</a>
            </nav>
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-full border border-amber-200/25 bg-slate-900/50 px-3 text-xs font-medium text-amber-50 hover:bg-slate-800/70 sm:px-4 sm:text-sm"
            >
              Intră în cont
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 px-3 text-xs font-semibold text-slate-900 hover:brightness-105 sm:px-4 sm:text-sm"
            >
              Creează cont
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-14 pt-14 section-reveal">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Rezolvă haosul din programări</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.98] tracking-tight text-amber-50 md:text-7xl">
              Pierzi timp și programări în telefoane, mesaje și anulări de ultim moment?
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-amber-100/70">
              Ocupaloc îți organizează programările într-un flux clar: clientul rezervă online, confirmă din email, iar tu vezi totul într-un dashboard simplu.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" data-analytics="homepage_cta_signup" data-cta-location="homepage_hero" className="lux-cta">
                Încearcă 7 zile gratis
              </Link>
              <button type="button" className="lux-outline" onClick={() => setIsWalkthroughOpen(true)}>
                Vezi fluxul complet
              </button>
            </div>

            <div className="mt-6 grid gap-2 text-sm text-amber-100/85 sm:grid-cols-2">
              <div className="rounded-lg border border-amber-100/15 bg-slate-950/60 px-3 py-2">Mai puține no-show-uri prin confirmări automate</div>
              <div className="rounded-lg border border-amber-100/15 bg-slate-950/60 px-3 py-2">Mai puține întreruperi în timpul programului</div>
              <div className="rounded-lg border border-amber-100/15 bg-slate-950/60 px-3 py-2">Fără suprapuneri de sloturi active</div>
              <div className="rounded-lg border border-amber-100/15 bg-slate-950/60 px-3 py-2">Mai mult timp pentru lucru, nu pentru administrare</div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/20 bg-slate-950/65 p-3 shadow-xl shadow-cyan-400/5">
            <BookingCard variant="demo" />
          </div>
        </div>
      </section>

      <section id="probleme" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="lux-card p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/55">Acum</p>
            <h3 className="mt-2 text-lg font-semibold text-amber-50">Programări ratate în WhatsApp</h3>
            <p className="mt-2 text-sm text-amber-100/70">Centralizezi cererile într-un singur loc, cu disponibilitate în timp real.</p>
          </div>
          <div className="lux-card p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/55">Cost ascuns</p>
            <h3 className="mt-2 text-lg font-semibold text-amber-50">Goluri în program din anulări</h3>
            <p className="mt-2 text-sm text-amber-100/70">Confirmări și remindere automate ca să reduci absențele.</p>
          </div>
          <div className="lux-card p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-amber-100/55">Rezultat</p>
            <h3 className="mt-2 text-lg font-semibold text-amber-50">Zi consumată pe administrare</h3>
            <p className="mt-2 text-sm text-amber-100/70">Dashboard clar pentru statusuri, modificări și calendar.</p>
          </div>
        </div>
      </section>

      {isWalkthroughOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md" onClick={() => setIsWalkthroughOpen(false)}>
          <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-amber-200/20 bg-slate-950 shadow-2xl shadow-cyan-500/10" onClick={(event) => event.stopPropagation()}>
            <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

            <button
              type="button"
              onClick={() => setIsWalkthroughOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-full border border-amber-200/30 bg-slate-900/80 px-3 py-1 text-sm text-amber-100 hover:bg-slate-800"
            >
              Închide
            </button>

            <div className="relative px-6 pb-6 pt-12 md:px-10 md:pt-10">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-200/70">Walkthrough live</p>
              <h3 className="mt-2 font-display text-4xl font-semibold leading-tight text-amber-50 md:text-5xl">Așa curge fluxul real în Ocupaloc</h3>
              <p className="mt-3 max-w-2xl text-sm text-amber-50/75 md:text-base">
                Fără promisiuni false: acesta este exact traseul implementat acum în platformă, de la rezervare până la reminder.
              </p>

              <div className="mt-7 grid gap-3 md:grid-cols-2">
                {walkthroughSteps.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-amber-200/20 bg-slate-900/65 p-4 transition hover:border-cyan-300/40 hover:bg-slate-900">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-cyan-200 text-sm font-bold text-slate-900">
                      {index + 1}
                    </div>
                    <h4 className="text-base font-semibold text-amber-50">{step.title}</h4>
                    <p className="mt-1 text-sm text-amber-50/70">{step.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-amber-200/15 pt-5">
                <Link href="/signup" className="lux-cta" data-cta-location="homepage_walkthrough_modal">
                  Încearcă 7 zile gratis
                </Link>
                <a href="#pricing" className="lux-outline" onClick={() => setIsWalkthroughOpen(false)}>
                  Vezi prețurile
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section id="verticale" className="max-w-6xl mx-auto px-4 pb-12">
        <div className="lux-card p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-100/55">Dovadă socială</p>
              <h2 className="mt-1 font-display text-2xl md:text-3xl font-semibold text-amber-100">
                Folosit de business-uri de servicii din România
              </h2>
            </div>
            <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-left md:min-w-[230px]">
              <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">Volum lunar</p>
              <p className="mt-1 text-sm font-semibold text-cyan-100">Mii de programări procesate în fiecare lună</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-amber-100/15 bg-slate-950/65 p-3">
              <p className="text-xs text-amber-100/60">Clinică</p>
              <p className="mt-1 text-sm font-medium text-amber-50">Clinica Nova, București</p>
            </div>
            <div className="rounded-lg border border-amber-100/15 bg-slate-950/65 p-3">
              <p className="text-xs text-amber-100/60">Manichiură</p>
              <p className="mt-1 text-sm font-medium text-amber-50">Nails Atelier, Cluj</p>
            </div>
            <div className="rounded-lg border border-amber-100/15 bg-slate-950/65 p-3">
              <p className="text-xs text-amber-100/60">Frizerie</p>
              <p className="mt-1 text-sm font-medium text-amber-50">Barber District, Iași</p>
            </div>
            <div className="rounded-lg border border-amber-100/15 bg-slate-950/65 p-3">
              <p className="text-xs text-amber-100/60">Consultanță</p>
              <p className="mt-1 text-sm font-medium text-amber-50">Consult Expert, Timișoara</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-4 py-14 border-t border-amber-200/15">
        <div className="mb-10 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-wide text-amber-100">Cum funcționează, simplu</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="lux-card p-5">
            <div className="mb-2 text-sm font-semibold text-cyan-200">Pasul 1</div>
            <h3 className="text-xl font-semibold text-amber-50">Primești pagina ta de rezervare</h3>
            <p className="mt-2 text-sm text-amber-100/70">O pui pe Instagram, WhatsApp, site sau Google Maps.</p>
          </div>
          <div className="lux-card p-5">
            <div className="mb-2 text-sm font-semibold text-cyan-200">Pasul 2</div>
            <h3 className="text-xl font-semibold text-amber-50">Clientul rezervă singur</h3>
            <p className="mt-2 text-sm text-amber-100/70">Alege serviciul și vede doar sloturile libere.</p>
          </div>
          <div className="lux-card p-5">
            <div className="mb-2 text-sm font-semibold text-cyan-200">Pasul 3</div>
            <h3 className="text-xl font-semibold text-amber-50">Tu primești confirmări automate</h3>
            <p className="mt-2 text-sm text-amber-100/70">Status clar în dashboard, fără apeluri repetitive.</p>
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 border-t border-amber-200/15">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-wide text-amber-100">Un singur plan. Totul inclus.</h2>
        </div>
        <div className="max-w-md mx-auto lux-card p-8">
          <div className="text-center mb-6">
            <div className="text-3xl font-extrabold">
              99,99 lei<span className="text-lg text-amber-100/50 font-normal">/lună</span>
            </div>
            <div className="text-sm text-amber-100/50 mt-1">per locație • TVA inclus</div>
          </div>
          <ul className="space-y-3 mb-8 text-base">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Link personalizat de rezervare</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Programări nelimitate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Confirmări automate SMS/Email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Integrare Google Calendar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Suport pe email</span>
            </li>
          </ul>
          <Link href="/signup" data-analytics="homepage_cta_signup" data-cta-location="homepage_pricing" className="block w-full text-center lux-cta">
            Începe gratuit
          </Link>
        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-4 py-16 border-t border-amber-200/15">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-wide text-amber-100">Întrebări frecvente</h2>
        </div>
        <div className="space-y-4">
          <details className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-base text-zinc-300" open>
            <summary className="cursor-pointer list-none font-semibold text-white">Cum îmi conectez Google Calendar?</summary>
            <p className="mt-3 text-zinc-400">Te loghezi cu Google o singură dată. Programările noi apar instant în calendarul tău.</p>
          </details>
          <details className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-base text-zinc-300">
            <summary className="cursor-pointer list-none font-semibold text-white">Pot lua avans sau plata integrală?</summary>
            <p className="mt-3 text-zinc-400">Da. Poți activa plata online pentru rezervări cu avans sau integral.</p>
          </details>
          <details className="rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-base text-zinc-300">
            <summary className="cursor-pointer list-none font-semibold text-white">Se pot anula sau reprograma clienții?</summary>
            <p className="mt-3 text-zinc-400">Da. Clientul primește link securizat și poate modifica rezervarea fără apel.</p>
          </details>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-4 text-center">
        <div className="lux-card p-8">
          <h3 className="font-display text-3xl font-semibold text-amber-50 md:text-4xl">Dacă programările sunt haotice, soluția poate fi simplă.</h3>
          <p className="mt-3 text-base text-amber-100/70">Pornire rapidă, fără implementări complicate. Primești acces instant și poți testa complet 7 zile.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" data-analytics="homepage_cta_signup" data-cta-location="homepage_final_cta" className="lux-cta">
              Încearcă 7 zile gratis
            </Link>
            <button type="button" className="lux-outline" onClick={() => setIsWalkthroughOpen(true)}>
              Vezi fluxul complet
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 py-12 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10 text-sm">
            <div>
              <div className="font-semibold mb-3 text-white">Produs</div>
              <ul className="space-y-2 text-zinc-500">
                <li>
                  <a href="#features" className="hover:text-zinc-300">
                    Funcționalități
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-zinc-300">
                    Prețuri
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-zinc-300">
                    Întrebări frecvente
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3 text-white">Suport</div>
              <ul className="space-y-2 text-zinc-500">
                <li>
                  <a href="https://wa.me/40700000000" target="_blank" className="hover:text-zinc-300" rel="noreferrer">
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3 text-white">Legal</div>
              <ul className="space-y-2 text-zinc-500">
                <li>
                  <Link href="/termeni" className="hover:text-zinc-300">
                    Termeni și condiții
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialitate" className="hover:text-zinc-300">
                    Politica de confidențialitate
                  </Link>
                </li>
                <li>
                  <Link href="/gdpr" className="hover:text-zinc-300">
                    Informare GDPR
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-zinc-300">
                    Politica de cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
            <div>© 2026 ocupaloc.ro. Toate drepturile rezervate.</div>
            <div>Date găzduite în UE. Conform GDPR.</div>
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
        DEMO - Acest salon nu există, e doar exemplu
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-4xl font-extrabold tracking-tight">{businessName} - {city}</h1>
        <p className="mt-3 text-zinc-300">
          Exemplu de pagină pentru {businessType.toLowerCase()} cu programări online și preț fix 99,99 RON/lună, fără comision.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {serviceLabels.map((service) => (
            <div key={service} className="rounded-lg border border-zinc-700 bg-zinc-950 p-4 text-sm">
              {service}
            </div>
          ))}
        </div>
        <Link
          href={ctaHref}
          className="mt-8 inline-flex rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-500"
        >
          Vreau și eu așa
        </Link>
      </div>
      <BookingCard variant="demo" />
    </section>
  );
}
