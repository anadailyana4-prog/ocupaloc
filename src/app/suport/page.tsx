import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Suport",
  description: "Centrul public de suport OcupaLoc: onboarding, billing, probleme tehnice și solicitări privind datele."
};

const supportCards = [
  {
    title: "Pornire rapidă",
    description: "Pentru activare rapidă, pregătește numele business-ului, lista de servicii, durata lor și programul de lucru.",
    ctaLabel: "Vezi prețurile",
    href: "/preturi"
  },
  {
    title: "Status și incidente",
    description: "Dacă suspectezi o problemă tehnică, verifică întâi pagina publică de status ca să vezi dacă există degradări operaționale.",
    ctaLabel: "Deschide status",
    href: "/status"
  },
  {
    title: "Date și legal",
    description: "Pentru confidențialitate, GDPR, cookies sau termenii de utilizare, ai acces direct la documentele publice ale platformei.",
    ctaLabel: "Vezi documentele",
    href: "/confidentialitate"
  }
] as const;

const faq = [
  {
    question: "Cum cer ajutor dacă nu reușesc să-mi configurez contul?",
    answer: `Trimite-ne un email la ${CONTACT_EMAIL} cu numele business-ului, adresa contului și problema exactă. Cu cât descrii mai clar contextul, cu atât intervenția este mai rapidă.`
  },
  {
    question: "Cum semnalez o eroare în booking sau dashboard?",
    answer: "Menționează linkul unde apare problema, pașii exacți care duc la eroare și, ideal, un screenshot. Verifică și pagina de status înainte, ca să separi un incident general de o problemă locală de cont."
  },
  {
    question: "Cum solicit export sau ștergere de date?",
    answer: "Trimite o solicitare pe email și precizează dacă este vorba despre datele contului tău sau despre o programare făcută la un business care folosește OcupaLoc. Cererile privind programările pot necesita și contactarea directă a business-ului operator."
  },
  {
    question: "Unde văd condițiile comerciale?",
    answer: "Pagina de preț conține oferta publică activă, iar paginile legale explică baza contractuală, confidențialitatea și regulile generale de utilizare."
  }
] as const;

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Suport</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Centru de suport OcupaLoc</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
            Aici găsești punctul public de contact pentru întrebări comerciale, probleme tehnice, onboarding și solicitări privind datele. Începem cu pași clari, fără să te plimbăm între pagini.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={CONTACT_MAILTO} className="inline-flex rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
              Scrie-ne la {CONTACT_EMAIL}
            </a>
            <Link href="/status" className="inline-flex rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800">
              Verifică statusul sistemului
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {supportCards.map((card) => (
            <article key={card.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-xl font-semibold text-zinc-100">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{card.description}</p>
              <Link href={card.href} className="mt-5 inline-flex rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800">
                {card.ctaLabel}
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Întrebări frecvente de suport</p>
          <div className="mt-6 space-y-5">
            {faq.map((item) => (
              <article key={item.question} className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
                <h2 className="text-lg font-semibold text-zinc-100">{item.question}</h2>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}