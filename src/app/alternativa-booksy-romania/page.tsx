import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Alternativă Booksy România | 59,99 RON Fără Comision | OcupaLoc",
  description:
    "Cauți o alternativă la Booksy în România? OcupaLoc: programări online fără comision, preț fix 59,99 RON/lună, fără reclame către concurență. Migrează în 5 minute.",
  keywords: [
    "alternativa booksy",
    "alternativa booksy romania",
    "booksy alternativa",
    "software programari fara comision",
    "aplicatie programari salon"
  ],
  alternates: { canonical: "https://ocupaloc.ro/alternativa-booksy-romania" },
  openGraph: {
    title: "Alternativă Booksy România | OcupaLoc",
    description: "Programări online fără comision, preț fix 59,99 RON/lună. Fără reclame către concurență.",
    url: "https://ocupaloc.ro/alternativa-booksy-romania",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Alternativă Booksy România | OcupaLoc",
    description: "Programări online fără comision, 59,99 RON/lună."
  }
};

const comparisons = [
  { label: "Preț lunar", ocupaloc: "59,99 RON fix", platforma: "Abonament + comision" },
  { label: "Comision per programare", ocupaloc: "0% — fără comision", platforma: "Da, pe clienți noi" },
  { label: "Reclame către alte saloane", ocupaloc: "Niciodată", platforma: "Da, în marketplace" },
  { label: "Pagina ta proprie", ocupaloc: "Link curat ocupaloc.ro/numele-tau", platforma: "Profil în marketplace comun" },
  { label: "Suport în română", ocupaloc: "Da", platforma: "Limitat" },
  { label: "Setup", ocupaloc: "Câteva minute", platforma: "Mai complex" }
];

const faqItems = [
  {
    question: "Care este principala diferență față de Booksy?",
    answer:
      "OcupaLoc nu ia comision pe rezervări și nu afișează reclame către alte saloane pe pagina ta. Plătești 59,99 RON fix pe lună și păstrezi 100% din încasări, indiferent câți clienți noi îți vin prin link."
  },
  {
    question: "De ce contează că nu există marketplace cu reclame?",
    answer:
      "Pe platformele tip marketplace, clientul tău poate vedea oferte de la saloane concurente chiar lângă profilul tău. Cu OcupaLoc ai o pagină proprie, curată, fără ca cineva să-ți „fure” clientul în momentul rezervării."
  },
  {
    question: "Pot migra de pe Booksy fără să pierd clienții?",
    answer:
      "Da. Îți configurezi serviciile și programul în aceeași zi, primești un link nou și îl pui peste tot unde aveai vechiul link: bio Instagram, Google, WhatsApp. Clienții recurenți trec natural pe noul flux."
  },
  {
    question: "Cât costă în total, fără surprize?",
    answer:
      "59,99 RON pe lună. Fără comision per programare, fără taxe pe clienți noi, fără costuri ascunse. Știi exact cât plătești în fiecare lună."
  },
  {
    question: "E potrivit și pentru un profesionist independent?",
    answer:
      "Da. Funcționează la fel de bine pentru un specialist independent care vrea un link simplu de rezervare, cât și pentru un salon cu mai mulți angajați."
  }
];

const relatedLinks = [
  { href: "/alternativa-fresha-romania", label: "Alternativă Fresha România" },
  { href: "/aplicatie-programari-salon", label: "Aplicație programări salon" },
  { href: "/programari-online-salon", label: "Programări online salon" },
  { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
  { href: "/preturi", label: "Prețuri OcupaLoc" }
];

export default function AlternativaBooksyPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: "https://ocupaloc.ro" },
      { "@type": "ListItem", position: 2, name: "Alternativă Booksy România", item: "https://ocupaloc.ro/alternativa-booksy-romania" }
    ]
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="faq-schema-booksy" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="breadcrumb-schema-booksy" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <nav aria-label="Breadcrumb" className="text-sm oc-secondary-text">
          <Link href="/" className="hover:underline">Acasă</Link>
          <span className="px-1.5">/</span>
          <span className="oc-text">Alternativă Booksy România</span>
        </nav>

        <section className="rounded-2xl border oc-border bg-white p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Alternativă Booksy România: programări fără comision la 59,99 RON</h1>
          <p className="mt-4 text-lg leading-relaxed oc-text">
            Dacă vrei o alternativă la Booksy fără comision și fără reclame către saloane concurente, OcupaLoc îți dă o pagină proprie de
            programări online, cu preț fix de 59,99 RON pe lună. Păstrezi 100% din încasări și controlul total asupra clienților tăi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup?start=1" data-cta-location="seo_booksy_hero_primary" className="rounded-lg oc-primary px-5 py-3 font-semibold text-white">
              Încearcă gratuit
            </Link>
            <Link href="/demo-interactiv" data-cta-location="seo_booksy_hero_secondary" className="rounded-lg border oc-border px-5 py-3 font-semibold oc-text hover:oc-badge-bg">
              Vezi demo
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border oc-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="oc-badge-bg oc-text">
              <tr>
                <th className="px-4 py-3">Criteriu</th>
                <th className="px-4 py-3 text-emerald-600">OcupaLoc</th>
                <th className="px-4 py-3">Platformă marketplace</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.label} className="border-t oc-border">
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{row.ocupaloc}</td>
                  <td className="px-4 py-3 oc-secondary-text">{row.platforma}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-4 rounded-2xl border oc-border bg-white p-8">
          <h2 className="text-3xl font-bold">De ce caută saloanele o alternativă la Booksy</h2>
          <p className="leading-relaxed oc-text">
            Platformele de tip marketplace au adus programări online la îndemâna tuturor, însă au și un cost ascuns: modelul lor de business
            se bazează pe comisioane și pe expunerea ta lângă concurență. Pentru un salon mic sau un profesionist independent, fiecare leu
            pierdut pe comision la clienți noi se adună rapid. Iar când clientul tău vede oferte de la alte saloane în același loc unde ar
            trebui să rezerve la tine, riști să-l pierzi exact în momentul deciziei.
          </p>
          <p className="leading-relaxed oc-text">
            OcupaLoc rezolvă ambele probleme. Primul avantaj este financiar: plătești 59,99 RON fix pe lună, fără comision per rezervare.
            Indiferent dacă primești 20 sau 300 de programări, costul rămâne același. Pe termen lung, diferența față de un model cu comision
            poate însemna mii de lei pe an care rămân în business-ul tău, nu la platformă.
          </p>
          <p className="leading-relaxed oc-text">
            Al doilea avantaj este controlul asupra brandului. Cu OcupaLoc primești o pagină proprie, curată, cu link de forma
            ocupaloc.ro/numele-tau. Pe acea pagină nu apar reclame către alte saloane și nimeni nu-ți distrage clientul în drumul spre
            rezervare. Clientul vede doar serviciile tale, prețurile tale și orele tale libere — exact ca un mini-site de programări dedicat.
          </p>
          <p className="leading-relaxed oc-text">
            Migrarea este simplă și nu trebuie făcută peste noapte. Îți creezi serviciile cu durată și preț, setezi programul de lucru și
            primești noul link. Apoi îl pui în bio Instagram, în Google Business Profile și în mesajul de WhatsApp, exact acolo unde aveai
            vechiul link. În câteva zile, rezervările trec natural pe noul sistem, fără să pierzi clienții recurenți.
          </p>
          <p className="leading-relaxed oc-text">
            În plus, ai suport în limba română și o interfață gândită pentru ritmul real al unui salon din România. Când ai o întrebare,
            primești răspuns clar, fără bariere de limbă. Iar pentru client, experiența rămâne simplă: alege serviciul, vede orele reale și
            confirmă în câteva secunde. Pentru multe saloane, această combinație — fără comision, fără reclame, suport local și preț fix —
            este motivul principal pentru care fac trecerea.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-bold">Întrebări frecvente</h2>
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 leading-relaxed oc-secondary-text">{item.answer}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border oc-border bg-white p-5">
          <h2 className="text-2xl font-bold">Vezi și:</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {relatedLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
