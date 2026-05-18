import type { Metadata } from "next";
import Link from "next/link";

import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Suport OcupaLoc - Ajutor Programări Online",
  description: "Centrul de suport OcupaLoc: ghid de pornire, billing, probleme tehnice și întrebări despre software-ul de programări pentru saloane."
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
    question: "Cum semnalez o eroare în booking sau meniu?",
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
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="rounded-3xl border oc-border bg-white p-8 shadow-[0_20px_45px_-30px_rgba(15,118,110,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] oc-accent">Suport</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Centru de suport OcupaLoc</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 oc-secondary-text md:text-lg">
            Aici găsești punctul public de contact pentru întrebări comerciale, probleme tehnice, onboarding și solicitări privind datele. Începem cu pași clari, fără să te plimbăm între pagini.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={CONTACT_MAILTO} className="inline-flex rounded-full oc-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#D97706]">
              Scrie-ne la {CONTACT_EMAIL}
            </a>
            <Link href="/status" className="inline-flex rounded-full border oc-border bg-white px-5 py-3 text-sm font-semibold oc-text transition hover:oc-badge-bg">
              Verifică statusul sistemului
            </Link>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {supportCards.map((card) => (
            <article key={card.title} className="rounded-2xl border oc-border bg-white p-6">
              <h2 className="text-xl font-semibold oc-text">{card.title}</h2>
              <p className="mt-3 text-sm leading-6 oc-secondary-text">{card.description}</p>
              <Link href={card.href} className="mt-5 inline-flex rounded-full border oc-border bg-white px-4 py-2 text-sm font-medium oc-text transition hover:oc-badge-bg">
                {card.ctaLabel}
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border oc-border bg-white p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] oc-secondary-text">Întrebări frecvente de suport</p>
          <div className="mt-6 space-y-5">
            {faq.map((item) => (
              <article key={item.question} className="rounded-2xl border oc-border oc-badge-bg p-5">
                <h2 className="text-lg font-semibold oc-text">{item.question}</h2>
                <p className="mt-2 text-sm leading-7 oc-secondary-text">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}