import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Aplicație Programări Salon | Software Salon Fără Comision | 59,99 RON",
  description:
    "Aplicație de programări online pentru salon: software salon fără comision, preț fix 59,99 RON/lună. Rezervări online în 30 de secunde, agendă clară, reamintiri automate.",
  keywords: [
    "aplicatie programari salon",
    "aplicatie programari online salon",
    "software salon",
    "software programari salon",
    "program de programari salon",
    "sistem programari salon"
  ],
  alternates: { canonical: "https://ocupaloc.ro/aplicatie-programari-salon" },
  openGraph: {
    title: "Aplicație Programări Salon | OcupaLoc",
    description: "Software salon fără comision, 59,99 RON/lună. Rezervări online pentru salonul tău, fără telefon.",
    url: "https://ocupaloc.ro/aplicatie-programari-salon",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Aplicație Programări Salon | OcupaLoc",
    description: "Software salon fără comision, 59,99 RON/lună. Rezervări online în 30 de secunde."
  }
};

const benefits = [
  {
    title: "Rezervări online 24/7",
    text: "Clienții văd intervalele libere și se programează singuri, oricând, chiar și când salonul e închis."
  },
  {
    title: "Fără comision pe rezervare",
    text: "Preț fix 59,99 RON pe lună. Plătești același abonament, indiferent câte programări primești."
  },
  {
    title: "Mai puține neprezentări",
    text: "Reamintirile automate prin email reduc clienții care uită de programare și golurile din agendă."
  },
  {
    title: "Setup în câteva minute",
    text: "Adaugi serviciile și programul, primești un link public și începi să primești rezervări imediat."
  },
  {
    title: "Agendă clară pe orice ecran",
    text: "Vezi ziua, săptămâna și serviciile dintr-o privire, pe telefon sau pe calculator, fără instalări."
  },
  {
    title: "Imagine profesionistă",
    text: "Un flux de rezervare ordonat arată clienților că salonul tău e serios și bine organizat."
  }
];

const faqItems = [
  {
    question: "Ce este o aplicație de programări pentru salon?",
    answer:
      "Este un software salon prin care clienții își fac singuri programarea online: aleg serviciul, văd orele libere în timp real și confirmă în câteva secunde, fără să te sune. Tu primești toate rezervările centralizat într-o agendă clară."
  },
  {
    question: "Cât costă aplicația de programări salon OcupaLoc?",
    answer:
      "Preț fix 59,99 RON pe lună, fără comision pe rezervare și fără costuri ascunse. Indiferent dacă primești 10 sau 500 de programări într-o lună, plătești același abonament."
  },
  {
    question: "Trebuie să instalez ceva pe telefon?",
    answer:
      "Nu. Aplicația funcționează direct în browser, pe telefon și pe calculator. Nici tu, nici clienții nu trebuie să instalați nimic — totul se întâmplă printr-un link."
  },
  {
    question: "Cât durează să configurez salonul?",
    answer:
      "Câteva minute. Adaugi serviciile cu durată și preț, setezi programul de lucru și primești un link public pe care îl pui în bio Instagram, pe Google și pe WhatsApp."
  },
  {
    question: "Pot folosi software-ul pentru un salon cu mai mulți angajați?",
    answer:
      "Da. Poți organiza serviciile și programul pentru a gestiona un volum mare de rezervări și a păstra agenda echilibrată pe parcursul zilei."
  },
  {
    question: "Aplicația trimite confirmări și reamintiri clienților?",
    answer:
      "Da. Clientul primește confirmarea programării, iar reamintirile automate înainte de programare reduc semnificativ neprezentările."
  }
];

const relatedLinks = [
  { href: "/programari-online-salon", label: "Programări online salon" },
  { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
  { href: "/software-programari-manichiura", label: "Software programări manichiură" },
  { href: "/programari-online-coafor", label: "Programări online coafor" },
  { href: "/programari-online-cosmetica", label: "Programări online cosmetică" },
  { href: "/preturi", label: "Prețuri OcupaLoc" }
];

export default function AplicatieProgramariSalonPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OcupaLoc - Aplicație programări salon",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://ocupaloc.ro/aplicatie-programari-salon",
    description:
      "Aplicație de programări online pentru saloane: software salon fără comision, cu rezervări online, agendă și reamintiri automate.",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      description: "Abonament lunar, fără comision pe rezervare"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: "https://ocupaloc.ro" },
      { "@type": "ListItem", position: 2, name: "Aplicație programări salon", item: "https://ocupaloc.ro/aplicatie-programari-salon" }
    ]
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="faq-schema-salon" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="software-schema-salon" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <Script id="breadcrumb-schema-salon" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <nav aria-label="Breadcrumb" className="text-sm oc-secondary-text">
          <Link href="/" className="hover:underline">Acasă</Link>
          <span className="px-1.5">/</span>
          <span className="oc-text">Aplicație programări salon</span>
        </nav>

        <section className="rounded-2xl border oc-border bg-white p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Aplicație programări salon</h1>
          <p className="mt-4 text-lg leading-relaxed oc-text">
            OcupaLoc este aplicația de programări online pentru salon care îți pune agenda în ordine: clienții rezervă singuri, în
            timp real, fără telefon. Software salon fără comision, la preț fix de 59,99 RON pe lună.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup?start=1" data-cta-location="seo_salon_hero_primary" className="rounded-lg oc-primary px-5 py-3 font-semibold text-white">
              Încearcă gratuit
            </Link>
            <Link href="/demo-interactiv" data-cta-location="seo_salon_hero_secondary" className="rounded-lg border oc-border px-5 py-3 font-semibold oc-text hover:oc-badge-bg">
              Vezi demo
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border oc-border bg-white p-8">
          <h2 className="text-3xl font-bold">De ce ai nevoie de o aplicație de programări în salon</h2>
          <p className="leading-relaxed oc-text">
            Un salon plin înseamnă și un telefon care sună constant și un Instagram plin de mesaje cu „aveți liber sâmbătă?”. Fiecare
            întrerupere te scoate din ritm și te ține departe de client. O aplicație de programări salon mută acest proces online:
            clientul vede serviciile, durata și orele libere și confirmă singur, în mai puțin de 30 de secunde. Tu rămâi concentrat pe
            lucru, iar agenda se completează automat.
          </p>
          <p className="leading-relaxed oc-text">
            Cel mai mare câștig este timpul. În loc să porți zeci de conversații pe zi ca să stabilești o oră, trimiți un singur link de
            programare. Acel link funcționează non-stop, inclusiv când salonul e închis sau ești cu mâinile ocupate. Multe rezervări vin
            seara târziu sau dimineața devreme — exact momentele în care nu ai cum să răspunzi la telefon. Cu un software salon, nu mai
            pierzi acești clienți.
          </p>
          <p className="leading-relaxed oc-text">
            Al doilea câștig este predictibilitatea. Când fiecare serviciu are durata setată corect, ziua devine clară și eviți
            întârzierile în lanț. Clienții care vin după program nu mai stau la coadă, iar tu nu mai jonglezi cu suprapunerile. Programările
            online îți arată din timp când ai vârfuri de cerere, ce servicii sunt cele mai căutate și unde ai goluri pe care le poți umple.
          </p>
          <p className="leading-relaxed oc-text">
            Pentru un salon care vrea să crească, modelul fără comision contează enorm. Platformele care iau o taxă pe fiecare rezervare
            te costă din ce în ce mai mult pe măsură ce muncești mai mult. Cu OcupaLoc plătești 59,99 RON fix pe lună, indiferent de câte
            programări primești. Banii rămași îi investești în produse, în echipă sau în amenajare — nu în comisioane.
          </p>
          <p className="leading-relaxed oc-text">
            Nu în ultimul rând, o aplicație de programări îți profesionalizează imaginea. Pentru mulți clienți noi, pagina ta de rezervare
            este primul contact real cu salonul. Un proces ordonat, cu servicii clare și confirmare imediată, transmite seriozitate și
            crește șansele ca persoana să rezerve la tine, nu la concurență.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-3xl font-bold">Ce primești cu OcupaLoc</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-xl border oc-border bg-white p-5">
                <h3 className="font-semibold oc-text">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed oc-secondary-text">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border oc-border bg-white p-8">
          <h2 className="text-3xl font-bold">Cum funcționează în 3 pași</h2>
          <ol className="space-y-3">
            <li className="rounded-xl border oc-border oc-badge-bg p-4">
              <span className="font-semibold">1. Îți creezi contul gratuit</span> și adaugi serviciile cu durată și preț.
            </li>
            <li className="rounded-xl border oc-border oc-badge-bg p-4">
              <span className="font-semibold">2. Setezi programul de lucru</span> și primești un link public de programare.
            </li>
            <li className="rounded-xl border oc-border oc-badge-bg p-4">
              <span className="font-semibold">3. Distribui link-ul</span> pe Instagram, Google și WhatsApp — clienții rezervă singuri.
            </li>
          </ol>
          <Link href="/signup?start=1" data-cta-location="seo_salon_steps_cta" className="inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white">
            Creează cont gratuit
          </Link>
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
