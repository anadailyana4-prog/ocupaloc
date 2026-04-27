import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Aplicație Programări Frizerie | Fără Comision",
  description:
    "Aplicație de programari online pentru frizeri și barberi: software salon fără comision, preț fix 59,99 RON, cu setup rapid."
};

const faqItems = [
  {
    question: "Este potrivită aplicația pentru barber shop cu mai mulți frizeri?",
    answer:
      "Da, poți organiza agenda clar și poți publica un flux simplu de programari online pentru clienții care preferă rezervare rapidă."
  },
  {
    question: "Cum mă ajută un software salon la no-show-uri?",
    answer:
      "Prin confirmări și un proces clar de rezervare. Clienții înțeleg mai bine slotul ales și apar mai rar confuzii de oră sau serviciu."
  },
  {
    question: "De ce fără comision este important?",
    answer:
      "Pentru că la volum mare de rezervări comisioanele cresc mult. Cu 59,99 RON lunar ai cost fix și marjă mai bună."
  },
  {
    question: "Pot începe fără echipă tehnică?",
    answer:
      "Da. Configurarea inițială este simplă și orientată către profesioniști din beauty, nu către dezvoltatori."
  }
];

const relatedLinks = [
  { href: "/programari-online-salon", label: "Programări online salon" },
  { href: "/preturi", label: "Prețuri OcupaLoc" },
  { href: "/software-programari-manichiura", label: "Software programări manichiură" },
  { href: "/programari-online-cosmetica", label: "Programări online cosmetică" }
];

export default function AplicatieProgramariFrizeriePage() {
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
      <Script id="faq-schema-frizerie" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Aplicație programări pentru frizeri și barberi</h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-300">
            Organizează agenda rapid cu programari online fără comision. OcupaLoc este software salon pentru frizerie, cu preț clar: 59,99 RON pe lună.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup?start=1" data-cta-location="seo_frizerie_hero_primary" className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
              Încearcă gratuit
            </Link>
            <Link href="/signup?start=1" data-cta-location="seo_frizerie_hero_secondary" className="rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-800">
              Activează aplicația
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-3xl font-bold">Cum ajută programari online într-o frizerie modernă</h2>
          <p className="leading-relaxed text-zinc-300">
            În frizerie, viteza și ritmul sunt esențiale. Când ai mulți clienți care vin după lucru, fiecare slot contează. Dacă rezervările vin haotic prin mesaje,
            agenda se umple greu și apar goluri între servicii. O aplicație de programari online pune ordine: clientul selectează serviciul, vede orele reale și confirmă.
            Pentru tine, asta înseamnă mai puțin timp la telefon și mai mult timp pentru experiența din scaun.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Mulți barberi pierd rezervări tocmai în momentele în care nu pot răspunde. Când ești cu mașina de tuns în mână, nu poți purta conversații lungi pe WhatsApp.
            Software salon elimină această fricțiune. Link-ul de programare rămâne disponibil permanent, iar clientul poate rezerva instant fără să aștepte un răspuns.
            Acest lucru crește conversia și reduce riscul ca persoana să aleagă alt salon.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Pentru barber shop-uri, claritatea serviciilor face diferența. „Tuns”, „tuns + barbă”, „contur barbă” sau „fade complex” trebuie să aibă durate distincte.
            Când aceste durate sunt setate corect în programari online, ziua devine previzibilă. Eviți întârzierile în lanț și reduci stresul echipei. Clienții simt
            imediat această organizare și revin mai des.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Din punct de vedere financiar, modelul fără comision este critic. Dacă plătești taxă per rezervare, cu cât muncești mai mult, cu atât platforma îți ia mai
            mult din venit. Cu OcupaLoc ai 59,99 RON fix pe lună. Acest cost predictibil îți permite să investești în oameni, în training sau în amenajare, nu în comisioane.
            Pentru un software salon destinat creșterii, aceasta este una dintre cele mai importante decizii.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Un alt avantaj major este profesionalizarea brandului. Când un client vede programari online bine structurate, percepe salonul ca fiind organizat și serios.
            În piața de frizerie, diferențele de imagine se transformă rapid în diferențe de încasări. Un proces simplu de rezervare este adesea primul contact real
            cu brandul tău, înainte de orice tunsoare.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Pentru echipe mai mari, aplicația ajută și la distribuirea echilibrată a programărilor. Poți urmări mai clar când ai vârfuri de cerere, ce servicii sunt
            cele mai căutate și unde ai nevoie de ajustări de program. Aceste date nu sunt doar statistici, ci instrumente de decizie care te ajută să optimizezi ziua.
            În timp, salonul devine mai eficient, iar clienții observă că experiența este constant bună.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Implementarea este simplă: adaugi servicii, stabilești intervalele și pui link-ul în bio, Google și WhatsApp. Din acel moment, programari online devin
            canalul principal, iar comunicarea pe telefon rămâne doar pentru excepții. Rezultatul este un flux de lucru mai curat și mai puține întreruperi.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Dacă vrei să construiești o frizerie care crește constant, ai nevoie de infrastructură digitală, nu doar de marketing. Un software salon fără comision,
            la 59,99 RON, îți oferă baza potrivită pentru volum, retenție și reputație. Programari online nu înseamnă doar tehnologie, ci control asupra timpului tău.
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
