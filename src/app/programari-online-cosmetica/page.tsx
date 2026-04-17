import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Programări Online Cosmetică | Software Salon",
  description:
    "Software salon pentru programari online în cosmetică: fără comision, preț fix 99,99 RON și organizare simplă pentru tratamente faciale și corporale."
};

const faqItems = [
  {
    question: "Este util pentru tratamente faciale și corporale?",
    answer:
      "Da, poți seta durate diferite pentru fiecare tratament, astfel încât agenda să rămână realistă și ușor de administrat."
  },
  {
    question: "Cum ajută programari online la retenția clientelor?",
    answer:
      "Rezervarea simplă și rapidă crește șansa de revenire, pentru că elimină fricțiunea și timpul pierdut în conversații repetitive."
  },
  {
    question: "Care este prețul?",
    answer: "Prețul este 99,99 RON pe lună, fără comision pe rezervare."
  },
  {
    question: "Ce canale pot folosi pentru link-ul de rezervare?",
    answer:
      "Poți publica link-ul de software salon în Instagram, Facebook, WhatsApp și Google Business Profile."
  }
];

const relatedLinks = [
  { href: "/programari-online-salon", label: "Programări online salon" },
  { href: "/preturi", label: "Prețuri Ocupaloc" },
  { href: "/software-programari-manichiura", label: "Software programări manichiură" },
  { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" }
];

export default function ProgramariOnlineCosmeticaPage() {
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
      <Script id="faq-schema-cosmetica" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Gestionează programările pentru cosmetică</h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-300">
            Cu Ocupaloc ai programari online fără comision pentru servicii de cosmetică. Software salon cu preț fix 99,99 RON și control complet pe program.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" data-cta-location="seo_cosmetica_hero_primary" className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
              Încearcă gratuit
            </Link>
            <Link href="/signup" data-cta-location="seo_cosmetica_hero_secondary" className="rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-800">
              Pornește acum
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-3xl font-bold">Programari online pentru cabinete de cosmetică eficiente</h2>
          <p className="leading-relaxed text-zinc-300">
            În cosmetică, fiecare tratament are propriul ritm. Unele proceduri au nevoie de timp de pregătire, altele de timp de pauză între cliente. Dacă agenda este
            organizată doar în conversații, aceste detalii se pierd ușor și apar întârzieri. Un software salon dedicat te ajută să planifici realist și să oferi o
            experiență impecabilă de la rezervare până la finalul serviciului.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Programari online înseamnă că fiecare clientă vede exact ce servicii oferi, cât durează și când sunt disponibile. În loc să răspunzi de zeci de ori la aceleași
            întrebări, creezi un flux clar care funcționează 24/7. Pentru business-urile de cosmetică, acest lucru reduce presiunea administrativă și lasă mai mult spațiu
            pentru partea care contează: calitatea tratamentelor și relația cu clienta.
          </p>
          <p className="leading-relaxed text-zinc-300">
            O provocare comună este programarea în afara orelor de lucru. Multe cliente iau decizii seara, după program. Dacă nu pot rezerva atunci, există șanse mari să
            aleagă altă opțiune. Cu software salon și link public, rezervarea se face instant, fără intervenția ta. Această disponibilitate constantă îți aduce cerere
            suplimentară din momente pe care altfel le-ai pierde.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Pentru cabinetele de cosmetică, predictibilitatea costurilor este la fel de importantă ca predictibilitatea agendei. Un model fără comision îți protejează
            marja, mai ales în lunile aglomerate. La 99,99 RON lunar, poți calcula simplu cât investești în platformă și poți decide mai bine ce buget aloci pentru
            produse, training sau promovare. Programari online trebuie să genereze profit, nu să îl consume prin taxe variabile.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Clientele percep rapid diferența dintre un salon improvizat și unul profesionist. Când rezervarea este clară și rapidă, apare încrederea. Când programul este
            respectat, apare fidelitatea. Un software salon bun nu este doar un instrument tehnic, ci o extensie a brandului tău. El transmite organizare, seriozitate
            și grijă pentru timpul clientei.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Dacă oferi tratamente variate, poți organiza serviciile în categorii simple și poți seta durate diferite pentru fiecare. Acest lucru te ajută să construiești
            o agendă echilibrată și să eviți suprapuneri. În timp, observi mai ușor ce servicii au cerere ridicată și poți ajusta programul în mod strategic. Astfel,
            programari online devin și o sursă de insight pentru decizii de business.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Implementarea nu trebuie să fie complicată. Începi cu serviciile principale, publici link-ul și încurajezi clientele să rezerve direct online. După câteva
            săptămâni, acest comportament devine normal pentru majoritatea clientelor. Tu câștigi timp, iar ele câștigă comoditate. Rezultatul este o relație mai stabilă
            și o activitate mai ușor de scalat.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Dacă vrei să construiești un business de cosmetică modern și profitabil, ai nevoie de procese clare, nu doar de prezență online. Cu software salon fără
            comision, la 99,99 RON, ai fundația potrivită pentru creștere sustenabilă. Programari online nu mai sunt un „nice to have”, ci standardul pe care clientele
            îl așteaptă deja.
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
