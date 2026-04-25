import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Comparație Costuri Programări | Fără Comision 59,99 RON",
  description:
    "Descoperă de ce OcupaLoc este alegerea potrivită pentru saloane din România: software în română, fără comision, la 59,99 RON pe lună."
};

const faqItems = [
  {
    question: "De ce este OcupaLoc o alternativă la platformele cu comision?",
    answer:
      "Pentru că oferă software salon în limba română, cost fix de 59,99 RON și model fără comision per programare."
  },
  {
    question: "Pot migra rapid de pe altă platformă?",
    answer:
      "Da, poți configura serviciile și programul în aceeași zi, iar datele clienților pot fi importate din CSV pentru o tranziție simplă."
  },
  {
    question: "Este potrivit pentru salon mic sau profesionist independent?",
    answer:
      "Da, platforma este folosită atât de saloane cu echipe, cât și de specialiști independenți care vor programari online clare și rapide."
  },
  {
    question: "Există costuri ascunse?",
    answer:
      "Nu. Prețul este 59,99 RON pe lună, fără comision, fără taxe suplimentare pe rezervări."
  }
];

const comparisons = [
  { label: "Preț lunar", ocupaloc: "59,99 RON", platforma: "Variabil" },
  { label: "Comision per programare", ocupaloc: "Fără comision", platforma: "Da" },
  { label: "Suport în română", ocupaloc: "Da", platforma: "Limitat" },
  { label: "Fără reclame", ocupaloc: "Da", platforma: "Nu" },
  { label: "Plată în RON", ocupaloc: "Da", platforma: "Nu" }
];

const relatedLinks = [
  { href: "/programari-online-salon", label: "Programări online salon" },
  { href: "/software-programari-manichiura", label: "Software programări manichiură" },
  { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
  { href: "/programari-online-cosmetica", label: "Programări online cosmetică" }
];

export default function ComparatieCosturiProgramariPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <Script id="faq-schema-alternativa-fresha" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Comparație costuri: platforme cu comision vs OcupaLoc</h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-300">
            Dacă vrei programari online fără comision, suport local și cost clar de 59,99 RON, OcupaLoc este software salon construit pentru piața din România.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" data-cta-location="seo_alternativa_fresha_hero_primary" className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
              Încearcă gratuit
            </Link>
            <Link href="/signup" data-cta-location="seo_alternativa_fresha_hero_secondary" className="rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-800">
              Mută-te pe OcupaLoc
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/70 text-zinc-200">
              <tr>
                <th className="px-4 py-3">Criteriu</th>
                <th className="px-4 py-3 text-emerald-300">OcupaLoc</th>
                <th className="px-4 py-3">Platformă cu comision</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.label} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-300">{row.ocupaloc}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.platforma}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-3xl font-bold">De ce să treci de la platformele cu comision la OcupaLoc</h2>
          <p className="leading-relaxed text-zinc-300">
            Când un salon crește, fiecare procent din încasări contează. Multe business-uri pornesc cu platforme internaționale pentru programari online, dar în timp
            observă că modelul bazat pe comision devine tot mai greu de susținut. Cu cât ai mai multe rezervări, cu atât costul total urcă, iar marja ta scade. Aceasta
            este exact situația în care apare nevoia unei alternative locale: o soluție simplă, care îți oferă control financiar.
          </p>
          <p className="leading-relaxed text-zinc-300">
            OcupaLoc folosește un model transparent: 59,99 RON pe lună, fără comision. Pentru proprietarii de software salon, această predictibilitate este o diferență
            majoră. Poți bugeta corect, poți seta campanii și oferte fără să te întrebi cât vei mai plăti la final de lună în taxe ascunse. Practic, performanța ta nu
            mai este penalizată. Dacă faci mai multe programari online, păstrezi beneficiul în business.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Al doilea motiv este adaptarea locală. O platformă globală poate fi puternică, dar nu întotdeauna vorbește limba și nevoile salonului românesc. Când ai
            întrebări urgente despre configurare, comunicare cu clientul sau flux de programări, suportul în română reduce frustrarea și accelerează soluția. Într-un
            salon, timpul de răspuns contează. Când ai o zi plină, nu vrei să pierzi ore întregi în ticket-uri tehnice.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Un alt punct important este experiența clientului final. Programari online eficiente înseamnă pași puțini, servicii clare și disponibilitate corectă.
            OcupaLoc este construit exact pentru acest flux: clientul găsește rapid ce vrea, rezervă și primește confirmare. Pentru tine, asta se traduce în mai puține
            apeluri repetitive și o agendă mai ordonată. Pentru client, înseamnă încredere. Iar în piața de beauty, încrederea este baza fidelizării.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Mulți antreprenori întreabă dacă migrarea este complicată. În realitate, tranziția poate fi făcută etapizat: setezi serviciile principale, configurezi
            programul, publici noul link și imporți baza de clienți. În câteva zile, majoritatea rezervărilor trec natural în noul software salon. Important este să
            comunici clar schimbarea și să păstrezi același link în toate canalele: Instagram, Google Business Profile, WhatsApp și site.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Din perspectiva marketingului, modelul fără comision îți oferă libertate mai mare de testare. Poți rula promoții de tip „sloturi de dimineață”, pachete
            pentru clienți recurenți sau campanii sezoniere fără să îți fie teamă că platforma îți „mănâncă” profitul prin taxe crescute. Când costul este fix la
            59,99 RON, fiecare rezervare suplimentară are impact direct pozitiv în încasări.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Trebuie menționată și componenta de brand. Un salon care folosește software programari online modern transmite profesionalism, organizare și grijă pentru
            experiența clientului. Într-o piață competitivă, aceste detalii fac diferența între „bun” și „primul pe care îl aleg clienții”. Când procesul de rezervare
            merge impecabil, impresia bună începe înainte ca persoana să intre în salon.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Dacă obiectivul tău este creștere sustenabilă, nu doar volum temporar, atunci alternativa corectă trebuie să îți ofere control, claritate și suport local.
            OcupaLoc bifează exact aceste puncte: programari online fără comision, software salon adaptat pieței românești și preț fix de 59,99 RON. Pentru multe
            business-uri, această combinație este suficientă ca să facă schimbarea de pe platformele cu comision și să păstreze mai mult din valoarea pe care o creează în fiecare zi.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-bold">Întrebări frecvente</h2>
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 leading-relaxed text-zinc-400">{item.answer}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-2xl font-bold">Vezi și:</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {relatedLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
