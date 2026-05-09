import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Software Programări Clinică | Stomatologie, Fizioterapie, Dermatologie — 59,99 RON/lună",
  description:
    "Software de programări online pentru clinici medicale private: stomatologie, fizioterapie, dermatologie, nutriție. Fără comision, preț fix 59,99 RON/lună. Pacienții rezervă direct, tu primești confirmare automată.",
  alternates: { canonical: "https://ocupaloc.ro/software-programari-clinica" }
};

const faqItems = [
  {
    question: "Funcționează pentru mai multe specialități în aceeași clinică?",
    answer:
      "Da. Poți adăuga mai mulți profesioniști în aceeași clinică, fiecare cu agenda, serviciile și programul său. Pacientul alege specialistul dorit și vede disponibilitatea lui în timp real."
  },
  {
    question: "Pot seta durate diferite pentru consultații și proceduri?",
    answer:
      "Da. Fiecare serviciu are durata proprie configurabilă. O consultație de 20 de minute și o procedură de fizioterapie de 60 de minute funcționează independent în aceeași agendă."
  },
  {
    question: "Am nevoie de un site propriu pentru a folosi OcupaLoc?",
    answer:
      "Nu. OcupaLoc îți generează o pagină publică de rezervare gata de utilizat. Pui linkul în Google Business Profile, Instagram sau pe orice altă platformă fără a avea nevoie de site propriu."
  },
  {
    question: "Pacienții pot anula sau modifica programarea?",
    answer:
      "Da. Fiecare pacient primește un link de confirmare cu opțiunea de a anula sau modifica programarea. Tu controlezi cu câte ore înainte este permisă modificarea."
  },
  {
    question: "Primesc notificare la fiecare programare nouă?",
    answer:
      "Da. La fiecare rezervare primești email instant cu datele pacientului, serviciul ales și ora programată. Pacientul primește și el o confirmare automată cu toate detaliile."
  },
  {
    question: "Există perioadă de test gratuită?",
    answer:
      "Da. Testezi OcupaLoc 14 zile gratuit, fără card. Configurezi clinica, adaugi specialiștii și serviciile și poți verifica întregul flux înainte de a plăti ceva."
  },
  {
    question: "Este potrivit pentru cabinet individual sau doar pentru clinici mari?",
    answer:
      "Este potrivit pentru amândouă. Un medic independent cu cabinet propriu sau o clinică cu 5-10 specialiști îl pot folosi la fel de eficient. Prețul rămâne fix: 59,99 RON/lună per profesionist."
  },
  {
    question: "Cum blochezi concediile sau intervalele fără consultații?",
    answer:
      "Din dashboard poți bloca orice zi sau interval de timp. Pacienții nu vor vedea acele ore disponibile, deci nu pot face rezervări în perioadele blocate."
  }
];

const specialitati = [
  {
    title: "Stomatologie",
    icon: "🦷",
    desc:
      "Cabinetele dentare pierd timp zilnic confirmând și reconfirmând programări la telefon. Cu OcupaLoc, pacientul rezervă online ora de consultație sau tratament, iar tu primești notificare instant. Duratele diferite pentru detartraj, obturație sau consultație de urgență se configurează separat."
  },
  {
    title: "Fizioterapie și recuperare",
    icon: "🏃",
    desc:
      "Ședințele de kinetoterapie și fizioterapie au durate fixe și un ritm de programări intens. OcupaLoc elimină apelurile repetate pentru confirmare și permite pacienților să rezerve singuri ședința dorită — o dată sau recurent în aceeași zi a săptămânii."
  },
  {
    title: "Dermatologie și estetică medicală",
    icon: "🔬",
    desc:
      "Consultațiile dermatologice și procedurile estetice (laser, peeling, mezoterapie) au durate foarte diferite. Sistemul de programări online afișează fiecare serviciu cu durata exactă și nu permite suprapuneri în agendă, indiferent de câte tipuri de proceduri oferi."
  },
  {
    title: "Nutriție și dietetică",
    icon: "🥗",
    desc:
      "Nutriționiștii și dieteticienii au adesea program variabil și consultații atât la cabinet, cât și online. OcupaLoc gestionează ambele formate din același cont. Clientul alege tipul consultației preferate și rezervă direct, fără nicio conversație prealabilă."
  }
];

const competitorRows = [
  {
    feature: "Preț lunar",
    ocupaloc: "59,99 RON",
    docplanner: "200–400 RON/lună",
    medisoft: "~300 RON/lună"
  },
  {
    feature: "Comision per programare",
    ocupaloc: "0 RON",
    docplanner: "Da (variabil)",
    medisoft: "Nu"
  },
  {
    feature: "Pagină publică fără site propriu",
    ocupaloc: "Da",
    docplanner: "Da (listing comun)",
    medisoft: "Parțial"
  },
  {
    feature: "Setup rapid fără IT",
    ocupaloc: "Da — 5 minute",
    docplanner: "Mediu",
    medisoft: "Complex"
  },
  {
    feature: "Fără listing cu concurenți",
    ocupaloc: "Da",
    docplanner: "Nu — ești listat lângă alții",
    medisoft: "Da"
  },
  {
    feature: "Confirmare automată email",
    ocupaloc: "Da",
    docplanner: "Da",
    medisoft: "Da"
  },
  {
    feature: "Plată în RON, fără TVA internațional",
    ocupaloc: "Da",
    docplanner: "Nu (facturat din Varșovia)",
    medisoft: "Da"
  }
];

const relatedLinks = [
  { href: "/preturi", label: "Vezi prețul complet" },
  { href: "/programari-online-psiholog", label: "Software programări psiholog" },
  { href: "/programari-online-nutritionist", label: "Programări online nutriționist" },
  { href: "/demo-interactiv", label: "Testează fluxul de rezervare" },
  { href: "/blog/telefon-vs-programari-online", label: "Telefon vs programări online" }
];

export default function SoftwareProgramariClinicaPage() {
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

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OcupaLoc — Programări online clinică medicală",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      description: "Abonament lunar programări online clinică privată"
    },
    description:
      "Software de programări online pentru clinici medicale private din România: stomatologie, fizioterapie, dermatologie, nutriție. Fără comision, preț fix 59,99 RON/lună."
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <Script
        id="faq-schema-clinica"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="service-schema-clinica"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="mx-auto max-w-5xl space-y-14">

        {/* ── HERO ── */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Software programări online pentru clinici — fără telefon, fără confuzii
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-300">
            Clinicile private pierd în medie 1-2 ore pe zi cu gestionarea programărilor la telefon. Fiecare specialitate are durate diferite,
            fiecare medic are programul lui, iar pacienții sună și pentru confirmare, și pentru reprogramare. OcupaLoc aduce tot fluxul într-un
            singur sistem: pacientul rezervă singur, alege specialistul, serviciul și ora, și primește confirmare automată. Tu și echipa ta nu
            mai răspundeți la telefon pentru programări. Preț fix{" "}
            <strong className="text-white">59,99 RON/lună</strong> per profesionist, fără comision per consultație.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup?start=1&tip=clinica"
              data-cta-location="clinica_hero_primary"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/demo-interactiv"
              data-cta-location="clinica_hero_demo"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              Testează fluxul de rezervare
            </Link>
          </div>
        </section>

        {/* ── SPECIALITATI ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Pentru ce specialități medicale funcționează OcupaLoc
          </h2>
          <p className="leading-relaxed text-zinc-300">
            OcupaLoc funcționează pentru orice clinică sau cabinet medical privat care lucrează pe bază de programare. Nu contează dacă ai un
            singur specialist sau o echipă întreagă — sistemul se adaptează la structura ta.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {specialitati.map((s) => (
              <article key={s.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
                <h3 className="text-xl font-semibold text-indigo-300">
                  {s.icon} {s.title}
                </h3>
                <p className="mt-3 leading-relaxed text-zinc-300">{s.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── DE CE ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            De ce clinicile private trec la programări online
          </h2>
          <p className="leading-relaxed text-zinc-300">
            Pacienții din România caută tot mai des clinici pe Google, Instagram sau prin recomandări și vor să rezerve imediat, nu să sune a doua
            zi când clinica e deschisă. Dacă nu oferi o metodă simplă de rezervare online, o parte din ei vor merge la un competitor care o oferă.
            Programările online nu înlocuiesc relația cu pacientul — elimină doar birocrația legată de agendă.
          </p>

          <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h3 className="text-xl font-semibold text-amber-100">
              Agenda fără suprapuneri, indiferent de câți specialiști ai
            </h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              Când mai mulți medici lucrează în aceeași clinică, gestionarea agendelor comune este cel mai frecvent motiv de erori de programare.
              OcupaLoc separă agenda fiecărui specialist. Pacientul alege medicul dorit și vede disponibilitatea lui reală, nu o agendă generică.
              Nu pot apărea două programări în același slot pentru același specialist, indiferent din ce canal vine rezervarea.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h3 className="text-xl font-semibold text-amber-100">
              Pacienții rezervă la orice oră — nu doar când ești disponibil la telefon
            </h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              O parte semnificativă din căutările de clinici și cabinete se întâmplă seara sau în weekend. Dacă programările pot fi făcute doar
              în orele de program, pierzi aceste oportunități. Cu OcupaLoc, pagina de rezervare este disponibilă 24/7. Pacientul rezervă duminică
              la 22:00, tu găsești programarea confirmată luni dimineața în dashboard.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h3 className="text-xl font-semibold text-amber-100">
              Reduci no-show-urile prin confirmare automată
            </h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              Pacienții care rezervă online și primesc o confirmare cu detaliile programării au o rată mai mică de neprezentare față de cei care
              au sunat și au fost trecuți manual în agendă. Confirmarea scrisă — cu data, ora, serviciul și linkul de anulare dacă nu mai pot
              veni — funcționează ca un angajament. Reduces locurile goale fără nicio intervenție manuală din partea ta.
            </p>
          </article>
        </section>

        {/* ── CE PRIMESTI ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ce primești cu OcupaLoc pentru clinica ta
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-lg font-semibold">Pagină publică de rezervare fără site propriu</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Clinica ta primește un link de tipul{" "}
                <span className="font-mono text-zinc-300">ocupaloc.ro/numele-clinicii</span> pe care îl pui oriunde: Google Business, Instagram, Facebook sau orice alt canal.
              </p>
            </article>
            <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-lg font-semibold">Agende separate per specialist</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Fiecare medic sau terapeut are agenda și programul lui. Pacientul alege specialistul dorit și rezervă direct la el, fără confuzii
                sau suprapuneri.
              </p>
            </article>
            <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-lg font-semibold">Notificări instant pentru clinică și pacient</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                La orice rezervare nouă, atât clinica, cât și pacientul primesc email automat cu toate detaliile. Fără apeluri de confirmare,
                fără mesaje manuale.
              </p>
            </article>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/signup?start=1&tip=clinica"
              data-cta-location="clinica_features_cta"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              Începe testul gratuit de 14 zile
            </Link>
          </div>
        </section>

        {/* ── COMPARATIV ── */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            OcupaLoc față de alte soluții pentru programări clinică
          </h2>
          <p className="leading-relaxed text-zinc-300">
            Platformele mari de tip listing (Docplanner / RoMedic) îți cer să concurezi cu alte clinici din același sistem. OcupaLoc îți dă
            un instrument propriu: pacientul ajunge direct la tine, nu la o pagină de comparare.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-left text-zinc-400">
                  <th className="pb-3 pr-4 font-medium">Funcționalitate</th>
                  <th className="pb-3 pr-4 font-semibold text-white">OcupaLoc</th>
                  <th className="pb-3 pr-4 font-medium">Docplanner / RoMedic</th>
                  <th className="pb-3 font-medium">Medisoft / alt ERP</th>
                </tr>
              </thead>
              <tbody>
                {competitorRows.map((row) => (
                  <tr key={row.feature} className="border-b border-zinc-800">
                    <td className="py-3 pr-4 text-zinc-400">{row.feature}</td>
                    <td className="py-3 pr-4 font-medium text-indigo-300">{row.ocupaloc}</td>
                    <td className="py-3 pr-4 text-zinc-400">{row.docplanner}</td>
                    <td className="py-3 text-zinc-400">{row.medisoft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-5">
          <h2 className="text-3xl font-bold tracking-tight">Întrebări frecvente</h2>
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 leading-relaxed text-zinc-300">{item.answer}</p>
            </article>
          ))}
        </section>

        {/* ── FINAL CTA ── */}
        <section className="rounded-2xl border border-indigo-800 bg-indigo-950/40 p-8 text-center">
          <h2 className="text-2xl font-bold">
            Gata să elimini programările la telefon din clinica ta?
          </h2>
          <p className="mt-3 text-zinc-300">
            14 zile gratuit, fără card. Configurezi clinica în 5 minute și poți trimite linkul de rezervare pacienților chiar astăzi.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?start=1&tip=clinica"
              data-cta-location="clinica_final_cta"
              className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/preturi"
              className="rounded-lg border border-zinc-700 px-8 py-3 font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              Vezi prețul
            </Link>
          </div>
        </section>

        {/* ── INTERNAL LINKS ── */}
        <nav aria-label="Pagini conexe" className="border-t border-zinc-800 pt-8">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">Vezi și</p>
          <ul className="flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
