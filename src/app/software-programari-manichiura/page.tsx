import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Software Programări Manichiură | 59,99 RON/lună",
  description:
    "Programari online pentru manichiură și pedichiură: software salon fără comision, preț fix 59,99 RON și proces simplu pentru cliente."
};

const faqItems = [
  {
    question: "Este util software-ul pentru tehnicieni independenți?",
    answer:
      "Da, inclusiv pentru un singur specialist. Programari online reduc mesajele repetitive și te ajută să ai agenda organizată zilnic."
  },
  {
    question: "Pot seta durate diferite pe servicii de manichiură?",
    answer:
      "Da, poți configura fiecare serviciu cu durată proprie, astfel încât agenda să reflecte realist timpul pentru manichiură și pedichiură."
  },
  {
    question: "Cât costă abonamentul?",
    answer: "Costul este 59,99 RON pe lună, fără comision la rezervări."
  },
  {
    question: "Cum încep?",
    answer: "Îți faci cont, adaugi serviciile și publici link-ul de programari online în Instagram și WhatsApp."
  }
];

const relatedLinks = [
  { href: "/programari-online-salon", label: "Programări online salon" },
  { href: "/preturi", label: "Prețuri Ocupaloc" },
  { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
  { href: "/programari-online-cosmetica", label: "Programări online cosmetică" }
];

export default function SoftwareProgramariManichiuraPage() {
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
      <Script id="faq-schema-manichiura" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Programări online pentru manichiură și pedichiură</h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-300">
            Dacă lucrezi în nail care, ai nevoie de un software salon care simplifică fiecare zi. Cu Ocupaloc ai programari online fără comision, cost fix 59,99 RON și
            control complet asupra agendei.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" data-cta-location="seo_manichiura_hero_primary" className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
              Încearcă gratuit
            </Link>
            <Link href="/signup" data-cta-location="seo_manichiura_hero_secondary" className="rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-800">
              Activează contul
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-3xl font-bold">De ce programari online sunt esențiale pentru manichiuriste</h2>
          <p className="leading-relaxed text-zinc-300">
            În manichiură și pedichiură, calendarul este foarte sensibil la întârzieri, anulări și servicii cu durată variabilă. Dacă încă faci totul din mesaje,
            pierzi timp prețios între cliente și ajungi să verifici telefonul încontinuu. Un software salon rezolvă tocmai această problemă: clientei i se oferă clar
            serviciul, durata și ora disponibilă, iar tu primești rezervarea gata confirmată.
          </p>
          <p className="leading-relaxed text-zinc-300">
            De obicei, cele mai multe solicitări vin când ești în lucru. În loc să întrerupi o procedură pentru a răspunde la întrebări, lași link-ul de programari
            online să facă acest pas pentru tine. Clienta rezervă când are timp, iar tu continui să lucrezi fără întreruperi. Productivitatea crește, iar calitatea
            serviciului rămâne constantă.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Pentru manichiuriste, diferențierea serviciilor este crucială. O întreținere simplă nu are aceeași durată ca o construcție cu design complex. Când folosești
            software salon și definești duratele corecte, agenda se aliniază cu realitatea. Acest detaliu te ajută să eviți suprapuneri, întârzieri în lanț și zile
            epuizante în care alergi de la o clientă la alta fără pauză.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Costul contează la fel de mult. În zona de beauty, marja poate fi afectată rapid de taxe și comisioane. Un model fără comision este mai sănătos pe termen
            lung, mai ales când ai volum bun de programari online. Cu 59,99 RON pe lună, știi exact cât plătești și păstrezi mai mult din încasări. Pentru orice
            profesionist independent, predictibilitatea financiară face diferența între muncă multă și profit real.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Relația cu clienta devine și ea mai bună când ai proces clar. Confirmările și reamintirile reduc confuziile, iar clienta vede că ești organizată și serioasă.
            În plus, un software salon bine structurat te ajută să construiești un brand premium: pagină curată, servicii explicate simplu, rezervare rapidă în câteva
            click-uri. O experiență fluidă înainte de vizită crește șansa ca persoana să revină.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Dacă lucrezi cu clientele recurente, programari online facilitează retenția. Fiecare clientă poate reveni rapid la același serviciu, fără conversații lungi.
            Iar tu poți organiza agenda pe intervale optime pentru tipurile de lucrări pe care le faci cel mai des. Cu timpul, ziua ta devine mai echilibrată, iar
            încasările mai stabile.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Un alt avantaj este controlul asupra ritmului de lucru. Poți bloca pauze, poți defini ore pentru servicii complexe și poți ajusta programul sezonier. În
            perioadele aglomerate, acest control te ajută să eviți burnout-ul. Programari online nu înseamnă doar mai multe rezervări, ci și un mod mai sănătos de a
            conduce activitatea zilnică.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Pentru multe tehniciene, pasul spre digitalizare pare mare, dar implementarea este simplă. Începi cu serviciile principale, setezi programul de bază și
            distribui link-ul în bio și pe WhatsApp. În câteva zile observi diferența: mai puține întrebări repetitive, mai puține goluri în calendar și o imagine mai
            profesionistă. Cu software salon potrivit, agenda devine aliatul tău, nu o sursă de stres.
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
