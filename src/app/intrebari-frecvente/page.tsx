import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Întrebări Frecvente | OcupaLoc - Programări Online",
  description:
    "Răspunsuri la cele mai comune întrebări despre OcupaLoc: prețuri, funcționalități, implementare, suport și multe altele.",
  alternates: { canonical: "https://ocupaloc.ro/intrebari-frecvente" },
};

const faqCategories = [
  {
    category: "Prețuri și Plată",
    questions: [
      {
        q: "Cât costă OcupaLoc?",
        a: "OcupaLoc costă 59.99 RON pe lună, TVA inclus. Nu există comision per programare, nu există taxe ascunse, nu există limită de utilizatori sau programări. Plătești același preț indiferent cât de mult crește salonul tău."
      },
      {
        q: "Există perioadă de probă?",
        a: "Da. Oferim 14 zile gratuite, fără card, fără obligații. Poți testa toate funcționalitățile, poți primi programări reale, poți invita echipa. Dacă nu ești mulțumit, pur și simplu nu continui."
      },
      {
        q: "Pot anula abonamentul oricând?",
        a: "Absolut. Nu există contract pe perioadă fixă. Poți anula din cont oricând, iar accesul rămâne activ până la finalul perioadei plătite. Nu există penalități de anulare."
      },
      {
        q: "Cum se face plata?",
        a: "Acceptăm plată cu cardul (procesată securizat prin Stripe) sau transfer bancar pentru firme. Factura este emisă automat în contul tău și trimisă pe email."
      },
    ],
  },
  {
    category: "Funcționalități",
    questions: [
      {
        q: "Pot avea mai mulți angajați/profesioniști?",
        a: "Da, nelimitat. Fiecare angajat poate avea propriul calendar, propriile servicii și propriul link de rezervare. Nu se percepe cost suplimentar per angajat."
      },
      {
        q: "Cum primesc notificări când cineva se programează?",
        a: "Primești notificare instant pe email și în dashboard. Poți vedea toate programările în timp real, cu status (confirmată, anulată, finalizată)."
      },
      {
        q: "Pot bloca clienți care nu se prezintă?",
        a: "Da. Poți bloca clienți problematici. Când un client blocat încearcă să se programeze, va vedea un mesaj că nu mai poate face rezervări."
      },
      {
        q: "Există aplicație mobilă?",
        a: "Dashboard-ul funcționează perfect pe mobil prin browser. Nu avem app nativ încă, dar experiența mobilă este optimizată complet."
      },
      {
        q: "Pot exporta datele clienților?",
        a: "Da. Poți exporta lista de clienți în orice moment în format CSV sau Excel. Datele tale îți aparțin."
      },
    ],
  },
  {
    category: "Implementare și Setup",
    questions: [
      {
        q: "Cât durează configurarea?",
        a: "Configurarea de bază durează 15-30 minute. Adaugi numele salonului, serviciile, prețurile, duratele și programul de lucru. Pagina de rezervare este gata imediat."
      },
      {
        q: "Am nevoie de cunoștințe tehnice?",
        a: "Nu. Platforma este concepută pentru profesioniști din beauty, nu pentru dezvoltatori. Interfața este intuitivă, iar fiecare pas are explicații clare."
      },
      {
        q: "Pot importa clienți existenți?",
        a: "Da. Poți importa baza de clienți din Excel sau CSV. Dacă ai nevoie de ajutor, echipa noastră te asistă gratuit."
      },
      {
        q: "Cum distribui link-ul de rezervare?",
        a: "Primești un link unic (ex: ocupaloc.ro/salonul-meu) pe care îl poți pune în bio Instagram, Facebook, WhatsApp, Google Business, website sau carduri de vizită."
      },
    ],
  },
  {
    category: "Suport și Asistență",
    questions: [
      {
        q: "Ce se întâmplă dacă am o problemă?",
        a: "Oferim suport în limba română prin email și chat. Timpul mediu de răspuns este sub 2 ore în programul de lucru (L-V, 9-18)."
      },
      {
        q: "Oferiți training pentru echipă?",
        a: "Da. Avem ghiduri video și documentație scrisă. La cerere, organizăm sesiuni scurte de onboarding pentru echipe mai mari."
      },
      {
        q: "Platforma funcționează în weekend/noaptea?",
        a: "Da. OcupaLoc este disponibil 24/7/365. Clienții pot rezerva oricând, chiar și când salonul este închis."
      },
    ],
  },
  {
    category: "Securitate și Date",
    questions: [
      {
        q: "Datele mele sunt în siguranță?",
        a: "Da. Folosim criptare SSL, servere securizate în UE, și respectăm GDPR. Datele clienților nu sunt vândute sau partajate cu terți."
      },
      {
        q: "Ce se întâmplă dacă OcupaLoc dispare?",
        a: "Poți exporta toate datele oricând. Deși suntem aici pentru a rămâne, îți garantăm portabilitatea datelor."
      },
      {
        q: "Backup automat?",
        a: "Da. Toate datele sunt salvate automat și redundantly. Nu riști să pierzi programările sau datele clienților."
      },
    ],
  },
];

export default function IntrebariFrecventePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap(cat => 
      cat.questions.map(q => ({
        "@type": "Question",
        name: q.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.a
        }
      }))
    ),
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Întrebări Frecvente
          </h1>
          <p className="text-xl oc-secondary-text max-w-2xl mx-auto">
            Răspunsuri la tot ce trebuie să știi despre OcupaLoc. 
            Nu găsești ce cauți? Contactează-ne direct.
          </p>
        </header>

        {/* FAQ Categories */}
        <section className="space-y-12">
          {faqCategories.map((category) => (
            <div key={category.category} className="space-y-4">
              <h2 className="text-2xl font-bold border-b oc-border pb-2">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((item, index) => (
                  <details
                    key={index}
                    className="rounded-xl border oc-border bg-white group"
                  >
                    <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold list-none">
                      {item.q}
                      <span className="ml-4 text-xl transition-transform group-open:rotate-180">
                        ▼
                      </span>
                    </summary>
                    <div className="px-5 pb-5 pt-0">
                      <p className="leading-relaxed oc-secondary-text">
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Quick Links */}
        <section className="rounded-2xl border oc-border bg-white p-6">
          <h2 className="text-xl font-bold mb-4">Resurse rapide</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/ghid-programari-salon" className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
              Ghid complet programări
            </Link>
            <Link href="/demo-interactiv" className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
              Demo interactiv
            </Link>
            <Link href="/preturi" className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
              Prețuri
            </Link>
            <Link href="/blog" className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
              Blog
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl border oc-border oc-primary p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Încă ai întrebări?
          </h2>
          <p className="mb-6 max-w-xl mx-auto oc-secondary-text">
            Scrie-ne pe email sau încearcă direct cu 14 zile gratuite. 
            Nu există risc, nu există obligații.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup?start=1" className="rounded-lg oc-primary px-6 py-3 font-semibold text-white">
              Începe gratuit
            </Link>
            <a 
              href="mailto:suport@ocupaloc.ro" 
              className="rounded-lg border oc-border bg-white px-6 py-3 font-semibold hover:oc-badge-bg"
            >
              Contactează suport
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
