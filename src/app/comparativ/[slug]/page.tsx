import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { comparisons, type ComparisonSlug } from "@/data/comparisons";
import { CalculatorComision } from "@/components/comparativ/CalculatorComision";

type PageProps = { params: Promise<{ slug: string }> };

const STATIC_SLUGS: ComparisonSlug[] = ["fresha", "treatwell", "booksy", "stailer"];

export function generateStaticParams() {
  return STATIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!STATIC_SLUGS.includes(slug as ComparisonSlug)) {
    return { title: "Comparativ" };
  }
  return {
    title: "Comparativ platforme cu comision | OcupaLoc",
    description: "Vezi de ce saloanele aleg OcupaLoc: preț fix, zero comision și setup rapid."
  };
}

export default async function ComparativPage({ params }: PageProps) {
  const { slug } = await params;
  if (!STATIC_SLUGS.includes(slug as ComparisonSlug)) notFound();

  const key = slug as ComparisonSlug;
  const competitor = comparisons[key];

  const faqItems = [
    {
      q: "Care este diferența principală față de platformele cu comision?",
      a: "OcupaLoc are preț fix 59,99 RON/lună, comision 0 și suport în limba română."
    },
    {
      q: "Există comision pe rezervări la OcupaLoc?",
      a: "Nu. Comisionul este 0 indiferent de numărul de programări."
    },
    {
      q: "Pot migra rapid de pe altă platformă?",
      a: "Da. Poți configura serviciile și porni în aceeași zi, fără schimbări complexe."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a
      }
    }))
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <Script id={`faq-schema-comparativ-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">De ce saloanele aleg OcupaLoc</h1>
          <p className="text-zinc-400">Comparativ simplu pentru saloane care vor cost predictibil și zero comision.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/70 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Caracteristică</th>
                <th className="px-4 py-3 text-emerald-300">OcupaLoc</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-800">
                <td className="px-4 py-3">Preț lunar</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">59,99 RON</td>
              </tr>
              <tr className="border-t border-zinc-800">
                <td className="px-4 py-3">Comision per programare</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">0 RON</td>
              </tr>
              <tr className="border-t border-zinc-800">
                <td className="px-4 py-3">Suport</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">În română, telefon</td>
              </tr>
              <tr className="border-t border-zinc-800">
                <td className="px-4 py-3">Setup</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">5 minute</td>
              </tr>
            </tbody>
          </table>
        </section>

        <CalculatorComision />

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-2xl font-bold">Dezavantaje frecvente la platformele cu comision</h2>
          <ul className="mt-3 space-y-2 text-zinc-300">
            {competitor.dezavantaje.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Întrebări frecvente</h2>
          {faqItems.map((item) => (
            <article key={item.q} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-1 text-zinc-400">{item.a}</p>
            </article>
          ))}
        </section>

        <Link href="/signup" className="inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
          Treci la OcupaLoc fără comision
        </Link>
      </div>
    </main>
  );
}

