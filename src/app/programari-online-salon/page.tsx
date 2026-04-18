import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Programări Online Salon | Software 59,99 RON/lună Fără Comision",
  description:
    "Software românesc de programări pentru saloane beauty. Frizerie, manichiură, cosmetică. Fără comision, la 59,99 RON/lună."
};

const faqItems = [
  {
    question: "Pentru ce tipuri de saloane este potrivit Ocupaloc?",
    answer:
      "Platforma este construită pentru frizerie, barber shop, manichiură, pedichiură, cosmetică și masaj, cu setări simple pentru program, servicii și prețuri."
  },
  {
    question: "Cât costă software-ul pentru programari online?",
    answer:
      "Prețul este fix: 59,99 RON pe lună, fără comision per programare. Știi exact cât plătești indiferent de numărul de rezervări."
  },
  {
    question: "Pot să import clienții din Excel sau altă platformă?",
    answer:
      "Da, poți importa rapid datele clienților din CSV și porni mai repede fără să copiezi manual fiecare număr de telefon sau email."
  },
  {
    question: "În cât timp pot începe să primesc rezervări?",
    answer:
      "Majoritatea saloanelor sunt gata în mai puțin de 30 de minute, inclusiv setarea serviciilor, programului și publicarea linkului de rezervare."
  }
];

const relatedLinks = [
  { href: "/preturi", label: "Prețuri Ocupaloc" },
  { href: "/software-programari-manichiura", label: "Software programări manichiură" },
  { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
  { href: "/programari-online-cosmetica", label: "Programări online cosmetică" }
];

export default function ProgramariOnlineSalonPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <Script id="faq-schema-programari-online-salon" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-5xl space-y-12">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Programari online pentru salonul tău, fără comision</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-300">
            Dacă ai un software salon care simplifică rezervările, câștigi timp, reduci conversațiile repetitive și păstrezi 100% din încasări. Ocupaloc este
            soluția de programari online creată pentru saloane beauty din România: frizerie, manichiură, cosmetică și masaj. Preț fix 59,99 RON pe lună, fără comision
            la fiecare client nou.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup" data-cta-location="seo_programari_online_salon_hero_primary" className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500">
              Încearcă 14 zile gratis
            </Link>
            <Link href="/signup" data-cta-location="seo_programari_online_salon_hero_secondary" className="rounded-lg border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-800">
              Creează cont acum
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">Rezervări non-stop</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Clienții tăi pot face programari online în orice moment, inclusiv seara sau în weekend. Tu nu mai depinzi de telefon pentru fiecare rezervare.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">Fără comision</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Cu 59,99 RON pe lună ai cost predictibil. Nu pierzi bani la fiecare client, ceea ce contează enorm când agenda începe să se umple.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xl font-semibold">Setup rapid</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Adaugi servicii, program și link-ul public în câțiva pași. Un software salon bun trebuie să te ajute din prima zi, nu după săptămâni de training.
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-6">
          <h2 className="text-2xl font-bold">Cât economisești cu Ocupaloc</h2>
          <p className="mt-3 leading-relaxed text-zinc-200">
            Dacă ai 60 de programari online într-o lună și plătești comision per rezervare, costul poate trece ușor de 600 RON. Cu Ocupaloc plătești 59,99 RON, fără
            comision. Diferența rămâne în business și o poți reinvesti în produse, training sau echipamente. Pe termen lung, un software salon cu preț fix te ajută
            să crești sănătos și să nu fii penalizat tocmai când ai cele mai multe programări.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-3xl font-bold tracking-tight">Ghid practic pentru programari online în salon</h2>
          <p className="leading-relaxed text-zinc-300">
            Când un salon începe să crească, cel mai mare blocaj nu mai este neapărat lipsa cererii, ci modul în care este gestionată cererea. Dacă rezervările vin
            doar prin telefon și mesaje, fiecare zi devine o combinație între muncă efectivă cu clientul și administrare. Programari online înseamnă că transferi
            partea repetitivă către un flux clar: clientul vede serviciile, alege ora și primește confirmare. Pentru un software salon, acest flux este fundația.
          </p>
          <p className="leading-relaxed text-zinc-300">
            În practică, clienții caută rapid pe Google, Instagram și TikTok. Când găsesc un salon care oferă programari online fără comision și informații clare despre
            servicii, au mai multă încredere. Nu mai trebuie să întrebe de fiecare dată „Cât costă?”, „Cât durează?” sau „Aveți loc joi?”. Toate aceste răspunsuri sunt
            deja în pagină. Conversia crește pentru că scade fricțiunea. Într-un business local, fiecare secundă contează între interes și acțiune.
          </p>
          <p className="leading-relaxed text-zinc-300">
            O greșeală frecventă este folosirea mai multor sisteme: carnet pentru notițe, WhatsApp pentru confirmări și apeluri pentru modificări. Acest model merge cât
            timp ai puțini clienți, dar devine greu când apar ore de vârf. Un software salon centralizează agenda, datele clienților și istoricul. În loc să cauți
            conversații vechi, vezi instant cine vine, ce serviciu a rezervat și când revine. Pentru frizerie, manichiură și cosmetică, această claritate salvează ore
            întregi în fiecare săptămână.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Costul este, de asemenea, un factor decisiv. Mulți antreprenori acceptă comisioane mari pentru că par mici la început. Când faci calculele pe 6 sau 12 luni,
            comisionul depășește rapid un abonament fix. 59,99 RON este un prag simplu de înțeles și ușor de planificat. Nu ești surprins la final de lună și nu trebuie
            să ajustezi prețurile din cauza platformei. Un model fără comision îți păstrează marja și te ajută să scalezi când cererea crește.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Un alt avantaj major al programărilor online este disponibilitatea. Cea mai mare parte a rezervărilor se face în afara orelor clasice de lucru. Clienții
            verifică agenda seara, după serviciu, sau duminica pentru săptămâna următoare. Dacă salonul tău nu permite rezervare instant, acești clienți aleg concurența.
            Când ai software salon cu link public, transformi aceste momente în venit real, fără să fii prezent la telefon.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Pentru rezultate bune, începe cu o structură simplă: servicii clare, durate realiste, prețuri corecte și un program actualizat. Apoi pune link-ul de
            programari online în bio Instagram, în Google Business Profile și în mesajul de WhatsApp. Nu complica procesul cu multe opțiuni de la început. Clientul
            trebuie să găsească rapid ce caută și să finalizeze rezervarea în sub un minut. Această simplitate crește rata de finalizare.
          </p>
          <p className="leading-relaxed text-zinc-300">
            Dacă vrei să treci de la un sistem bazat pe mesaje la unul predictibil, fă tranziția treptat. Menține câteva zile ambele variante, apoi direcționează toți
            clienții către linkul unic. În scurt timp vei vedea că agenda devine mai ordonată, no-show-urile sunt mai ușor de gestionat, iar discuțiile repetitive scad.
            Cu software salon potrivit, ai mai mult timp pentru calitatea serviciilor și pentru creșterea business-ului.
          </p>
          <p className="leading-relaxed text-zinc-300">
            În final, programari online nu sunt doar un trend, ci o infrastructură de lucru pentru salonul modern. Când combini preț fix 59,99 RON, model fără comision
            și experiență simplă pentru client, obții un avantaj competitiv real. Iar acest avantaj nu vine din promisiuni mari, ci din procese zilnice mai bune, care
            îți aduc încasări mai stabile, clienți mai mulțumiți și mai puțin stres operațional.
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
