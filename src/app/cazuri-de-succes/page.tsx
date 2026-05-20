import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Cazuri de Succes | Cum Saloanele Cresc cu OcupaLoc",
  description:
    "Studii de caz reale: cum saloane din România au crescut veniturile și eficiența folosind programări online. Rezultate concrete, numere reale.",
  alternates: { canonical: "https://ocupaloc.ro/cazuri-de-succes" },
  openGraph: {
    url: "https://ocupaloc.ro/cazuri-de-succes",
    title: "Cazuri de Succes Saloane România | OcupaLoc",
    description: "Rezultate reale: +35% clienți, -70% no-shows, 15 ore economisite lunar."
  }
};

const caseStudies = [
  {
    id: "salon-bucuresti-sector-1",
    name: "Studio Beauty Elena",
    location: "București, Sector 1",
    industry: "Salon complet (coafor, manichiură, cosmetică)",
    size: "4 angajați",
    beforeStats: {
      programari: "~80/lună pe telefon",
      noshow: "18%",
      timpAdmin: "20 ore/săptămână",
    },
    afterStats: {
      programari: "145/lună online",
      noshow: "4%",
      timpAdmin: "5 ore/săptămână",
    },
    results: [
      "🚀 +81% creștere număr programări",
      "📉 -78% reducere no-shows",
      "⏱️ -75% timp administrativ",
      "💰 +35% venituri în 6 luni",
    ],
    quote: "Am recuperat costul abonamentului în prima săptămână doar din programările pe care altfel le-aș fi pierdut.",
    author: "Elena M., Proprietar",
    timeline: "6 luni de utilizare",
  },
  {
    id: "barber-shop-cluj",
    name: "Barber Shop Andrei",
    location: "Cluj-Napoca",
    industry: "Frizerie bărbați / Barber",
    size: "2 frizeri",
    beforeStats: {
      programari: "~60/lună (mix telefon/walk-in)",
      noshow: "25%",
      clientiNoi: "5-8/lună",
    },
    afterStats: {
      programari: "110/lună",
      noshow: "6%",
      clientiNoi: "20-25/lună",
    },
    results: [
      "🚀 +83% programări totale",
      "📉 -76% no-shows",
      "👥 +200% clienți noi lunar",
      "⭐ 4.9 rating Google (de la 4.2)",
    ],
    quote: "Link-ul de programare în bio-ul de Instagram a fost game-changer. Clienții rezervă la 11 noaptea când termină de văzut stories.",
    author: "Andrei P., Frizer & Proprietar",
    timeline: "4 luni de utilizare",
  },
  {
    id: "cabinet-cosmetica-timisoara",
    name: "Cosmetică DermaCare",
    location: "Timișoara",
    industry: "Cabinet cosmetică medicală",
    size: "1 specialist + 1 asistent",
    beforeStats: {
      programari: "~40/lună",
      confirmari: "Manuale, 2 ore/zi la telefon",
      neprezentari: "30% (proceduri lungi)",
    },
    afterStats: {
      programari: "72/lună",
      confirmari: "100% automate",
      neprezentari: "8%",
    },
    results: [
      "🚀 +80% programări",
      "📉 -73% neprezentări",
      "⏱️ 2 ore/zi economisite",
      "📊 Tracking istoric complet",
    ],
    quote: "Procedurile dermatologice necesită pregătire. Reminder-ele automate cu instrucțiuni au redus anulările la jumătate.",
    author: "Dr. Maria C., Specialist Dermatocosmetologie",
    timeline: "3 luni de utilizare",
  },
];

export default function CazuriDeSuccesPage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OcupaLoc",
    url: "https://ocupaloc.ro",
    logo: "https://ocupaloc.ro/og-image.svg",
    sameAs: [
      "https://www.facebook.com/ocupaloc",
      "https://www.instagram.com/ocupaloc",
    ],
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="org-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Cazuri de Succes: Saloane care Cresc cu OcupaLoc
          </h1>
          <p className="text-xl oc-secondary-text max-w-3xl mx-auto">
            Rezultate reale de la saloane din România. 
            Nu promisiuni — numere concrete.
          </p>
        </header>

        {/* Stats Overview */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border oc-border oc-primary p-6 text-center">
            <div className="text-4xl font-bold oc-accent">+35%</div>
            <div className="text-sm oc-secondary-text mt-1">Creștere venituri medie</div>
          </div>
          <div className="rounded-2xl border oc-border oc-primary p-6 text-center">
            <div className="text-4xl font-bold oc-accent">-70%</div>
            <div className="text-sm oc-secondary-text mt-1">Reducere no-shows</div>
          </div>
          <div className="rounded-2xl border oc-border oc-primary p-6 text-center">
            <div className="text-4xl font-bold oc-accent">15h</div>
            <div className="text-sm oc-secondary-text mt-1">Economisite lunar</div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Povești de Succes</h2>
          
          {caseStudies.map((study) => (
            <article
              key={study.id}
              className="rounded-2xl border oc-border bg-white overflow-hidden"
            >
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold">{study.name}</h3>
                    <p className="oc-secondary-text">
                      {study.location} • {study.industry} • {study.size}
                    </p>
                  </div>
                  <div className="text-sm oc-badge-bg px-3 py-1 rounded-full">
                    {study.timeline}
                  </div>
                </div>

                {/* Stats Comparison */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-xl border oc-border p-4">
                    <h4 className="font-semibold mb-3 text-red-600">Înainte de OcupaLoc</h4>
                    <ul className="space-y-2 text-sm">
                      {Object.entries(study.beforeStats).map(([key, value]) => (
                        <li key={key} className="flex justify-between">
                          <span className="oc-secondary-text">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border oc-primary p-4 oc-badge-bg">
                    <h4 className="font-semibold mb-3 oc-accent">După OcupaLoc</h4>
                    <ul className="space-y-2 text-sm">
                      {Object.entries(study.afterStats).map(([key, value]) => (
                        <li key={key} className="flex justify-between">
                          <span className="oc-secondary-text">{key}:</span>
                          <span className="font-medium oc-accent">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Results */}
                <div className="flex flex-wrap gap-2">
                  {study.results.map((result) => (
                    <span
                      key={result}
                      className="rounded-full border oc-border bg-white px-3 py-1 text-sm font-medium"
                    >
                      {result}
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="border-l-4 oc-primary pl-4 italic oc-secondary-text">
                  &ldquo;{study.quote}&rdquo;
                  <footer className="mt-2 not-italic font-medium oc-text">
                    — {study.author}
                  </footer>
                </blockquote>
              </div>
            </article>
          ))}
        </section>

        {/* How to Get Results */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Cum Obți Aceleași Rezultate</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: 1, title: "Creează cont", desc: "Înregistrează-te gratuit. 14 zile fără obligații." },
              { step: 2, title: "Configurează", desc: "Adaugă serviciile și programul în 15 minute." },
              { step: 3, title: "Distribuie link", desc: "Pune link-ul în bio, Google, WhatsApp." },
              { step: 4, title: "Crește", desc: "Primele programări în 24-48 ore." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl border oc-border bg-white p-5 text-center">
                <div className="w-10 h-10 rounded-full oc-primary text-white flex items-center justify-center font-bold mx-auto mb-3">
                  {step}
                </div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm oc-secondary-text">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border oc-border oc-primary p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Fii următorul caz de succes
          </h2>
          <p className="mb-6 max-w-xl mx-auto oc-secondary-text">
            Alătură-te sutelor de saloane din România care folosesc OcupaLoc 
            pentru a crește eficient și predictibil.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup?start=1" className="rounded-lg oc-primary px-6 py-3 font-semibold text-white">
              Începe gratuit 14 zile
            </Link>
            <Link href="/demo-interactiv" className="rounded-lg border oc-border bg-white px-6 py-3 font-semibold hover:oc-badge-bg">
              Vezi cum funcționează
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
