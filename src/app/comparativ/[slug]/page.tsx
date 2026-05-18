import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { comparisons, type ComparisonSlug } from "@/data/comparisons";
import { CalculatorComision } from "@/components/comparativ/CalculatorComision";

type PageProps = { params: Promise<{ slug: string }> };

const STATIC_SLUGS: ComparisonSlug[] = ["fresha", "treatwell", "booksy", "stailer"];

const COMPETITOR_META: Record<ComparisonSlug, { title: string; description: string; h1: string }> = {
  fresha: {
    title: "Alternativă Fresha România fără comision | OcupaLoc 59,99 RON",
    description:
      "Compară OcupaLoc cu Fresha: preț fix 59,99 RON/lună, zero comision per programare, suport în română. Migrează simplu azi.",
    h1: "OcupaLoc vs Fresha – De ce saloanele din România aleg 59,99 RON fără comision"
  },
  treatwell: {
    title: "Alternativă Treatwell România | 0% comision | OcupaLoc",
    description:
      "Compară OcupaLoc cu Treatwell: evită comisionul de 25-30%, plătește fix 59,99 RON/lună și păstrează controlul clienților.",
    h1: "OcupaLoc vs Treatwell – Fără comision 25% per programare"
  },
  booksy: {
    title: "Alternativă Booksy România | Mai ieftin 59,99 RON | OcupaLoc",
    description:
      "Compară OcupaLoc cu Booksy: preț mai mic, setup simplu în 5 minute, plată în RON și suport local pentru saloane beauty.",
    h1: "OcupaLoc vs Booksy – Programări mai ieftine pentru saloane din România"
  },
  stailer: {
    title: "Alternativă Stailer România | Software programări salon | OcupaLoc",
    description:
      "Compară OcupaLoc cu Stailer: mai ieftin, fără comision, cu funcții complete de booking și suport în limba română.",
    h1: "OcupaLoc vs Stailer – Alternativă completă pentru saloane beauty"
  }
};

export function generateStaticParams() {
  return STATIC_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!STATIC_SLUGS.includes(slug as ComparisonSlug)) {
    return { title: "Comparativ" };
  }
  const meta = COMPETITOR_META[slug as ComparisonSlug];
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `https://ocupaloc.ro/comparativ/${slug}` }
  };
}

export default async function ComparativPage({ params }: PageProps) {
  const { slug } = await params;
  if (!STATIC_SLUGS.includes(slug as ComparisonSlug)) notFound();

  const key = slug as ComparisonSlug;
  const competitor = comparisons[key];
  const meta = COMPETITOR_META[key];

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
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id={`faq-schema-comparativ-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{meta.h1}</h1>
          <p className="oc-secondary-text">Comparativ simplu pentru saloane care vor cost predictibil și zero comision.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border oc-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="oc-badge-bg oc-text">
              <tr>
                <th className="px-4 py-3">Caracteristică</th>
                <th className="px-4 py-3 text-emerald-300">OcupaLoc</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t oc-border">
                <td className="px-4 py-3">Preț lunar</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">59,99 RON</td>
              </tr>
              <tr className="border-t oc-border">
                <td className="px-4 py-3">Comision per programare</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">0 RON</td>
              </tr>
              <tr className="border-t oc-border">
                <td className="px-4 py-3">Suport</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">În română, telefon</td>
              </tr>
              <tr className="border-t oc-border">
                <td className="px-4 py-3">Setup</td>
                <td className="px-4 py-3 font-semibold text-emerald-300">5 minute</td>
              </tr>
            </tbody>
          </table>
        </section>

        <CalculatorComision />

        <section className="rounded-2xl border oc-border bg-white p-6">
          <h2 className="text-2xl font-bold">Dezavantaje frecvente la platformele cu comision</h2>
          <ul className="mt-3 space-y-2 oc-text">
            {competitor.dezavantaje.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Întrebări frecvente</h2>
          {faqItems.map((item) => (
            <article key={item.q} className="rounded-xl border oc-border bg-white p-4">
              <h3 className="font-semibold">{item.q}</h3>
              <p className="mt-1 oc-secondary-text">{item.a}</p>
            </article>
          ))}
        </section>

        <Link href="/signup?start=1" className="inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white">
          Treci la OcupaLoc fără comision
        </Link>
      </div>
    </main>
  );
}

