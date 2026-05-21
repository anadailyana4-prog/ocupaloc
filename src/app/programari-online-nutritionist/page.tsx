import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { getPublicProofMetrics } from "@/lib/public-proof";

export const metadata: Metadata = {
  title: "Programări Online Nutriționist | Software Cabinet 59,99 RON/lună",
  description:
    "Software de programări online pentru nutriționiști și dieteticieni. Fără comision, preț fix 59,99 RON/lună. Clienții rezervă consultații la cabinet sau online — tu primești confirmare automată.",
  alternates: { canonical: "https://ocupaloc.ro/programari-online-nutritionist" }
};

const faqItems = [
  {
    question: "Pot oferi atât consultații la cabinet, cât și online?",
    answer:
      "Da. Adaugi servicii separate pentru consultații față în față și pentru consultații online (video call). Clientul alege formatul preferat din același link de rezervare, fără linkuri diferite sau sisteme separate."
  },
  {
    question: "Pot seta durate diferite pentru prima consultație și follow-up?",
    answer:
      "Da. Prima consultație durează de obicei 60-90 de minute, iar consultațiile de urmărire 30-45 de minute. Configurezi fiecare serviciu cu durata exactă și prețul corespunzător."
  },
  {
    question: "Am nevoie de site propriu pentru a folosi OcupaLoc?",
    answer:
      "Nu. OcupaLoc îți generează o pagină publică de rezervare gata de utilizat. Pui linkul în Instagram, Google Business, TikTok sau WhatsApp. Nu ai nevoie de hosting, site sau cunoștințe tehnice."
  },
  {
    question: "Ce se întâmplă când un client rezervă? Primesc notificare?",
    answer:
      "Da. La fiecare rezervare primești email instant cu datele clientului, tipul consultației și ora. Clientul primește și el confirmare automată. Nicio intervenție manuală din partea ta."
  },
  {
    question: "Pot bloca programul pentru zile libere sau conferințe?",
    answer:
      "Da. Blochezi orice zi sau interval din dashboard. Clienții nu pot rezerva în perioadele blocate, deci nu apar surprize în agendă la întoarcere."
  },
  {
    question: "Este potrivit dacă am cabinet cu mai mulți nutriționiști?",
    answer:
      "Da. Fiecare specialist poate avea cont propriu și link de rezervare separat. Dacă lucrați sub aceeași clinică sau cabinet, fiecare nutriționist gestionează independent agenda sa."
  },
  {
    question: "Clienții pot anula singuri programarea?",
    answer:
      "Da. La rezervare, clientul primește un link de confirmare cu opțiunea de anulare sau modificare. Tu setezi câte ore înainte este permisă modificarea — de exemplu, minimum 24 de ore înaintea consultației."
  },
  {
    question: "Există perioadă de test gratuită?",
    answer:
      "Da. 14 zile gratuite, fără card. Configurezi cabinetul, adaugi serviciile și primești link de rezervare gata de trimis clienților. Plătești doar dacă ești mulțumit."
  }
];

const competitorRows = [
  {
    feature: "Preț lunar",
    ocupaloc: "59,99 RON",
    docplanner: "200–400 RON/lună",
    calendly: "~180 RON/lună"
  },
  {
    feature: "Comision per programare",
    ocupaloc: "0 RON",
    docplanner: "Da (variabil)",
    calendly: "Nu"
  },
  {
    feature: "Pagină publică în română",
    ocupaloc: "Da",
    docplanner: "Da (listing comun)",
    calendly: "Nu — interfața e în engleză"
  },
  {
    feature: "Ești listat lângă concurenți",
    ocupaloc: "Nu — pagina ta proprie",
    docplanner: "Da",
    calendly: "Nu"
  },
  {
    feature: "Confirmare automată email în română",
    ocupaloc: "Da",
    docplanner: "Da",
    calendly: "Parțial (template în engleză)"
  },
  {
    feature: "Setup fără IT în 5 minute",
    ocupaloc: "Da",
    docplanner: "Mediu",
    calendly: "Da, dar fără localizare RO"
  },
  {
    feature: "Plată în RON fără TVA internațional",
    ocupaloc: "Da",
    docplanner: "Nu (facturat din Varșovia)",
    calendly: "Nu (facturat din SUA)"
  }
];

const relatedLinks = [
  { href: "/programari-online-psiholog", label: "Programări online psiholog" },
  { href: "/software-programari-clinica", label: "Software programări clinică" },
  { href: "/preturi", label: "Prețuri OcupaLoc" },
  { href: "/demo-interactiv", label: "Testează fluxul de rezervare" },
  { href: "/blog/telefon-vs-programari-online", label: "Telefon vs programări online" }
];

export default async function ProgramariOnlineNutritionistPage() {
  const proof = await getPublicProofMetrics();
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
    name: "OcupaLoc — Programări online nutriționist",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      description: "Abonament lunar programări online cabinet nutriționist"
    },
    description:
      "Software de programări online pentru nutriționiști și dieteticieni din România. Fără comision, preț fix 59,99 RON/lună. Consultații la cabinet și online din același cont."
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script
        id="faq-schema-nutritionist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="service-schema-nutritionist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="mx-auto max-w-5xl space-y-14">

        {/* ── HERO ── */}
        <section className="rounded-2xl border oc-border bg-white p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Programări online pentru nutriționist — fără WhatsApp, fără telefon
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed oc-text">
            Ca nutriționist sau dietetician, fiecare mesaj primit pentru o programare este timp luat din consultații și din crearea planurilor
            alimentare. OcupaLoc îți oferă un link de rezervare personal pe care clienții îl accesează oricând: aleg tipul consultației
            (cabinet sau online), durata și ora disponibilă, și primesc confirmare automată. Tu nu mai coordonezi agenda pe WhatsApp.
            Preț fix <strong className="text-white">59,99 RON/lună</strong>, fără comision la fiecare consultație.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup?start=1&tip=nutritionist"
              data-cta-location="nutritionist_hero_primary"
              className="rounded-lg oc-primary px-6 py-3 font-semibold text-white"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/demo-interactiv"
              data-cta-location="nutritionist_hero_demo"
              className="rounded-lg border oc-border px-6 py-3 font-semibold oc-text hover:oc-badge-bg"
            >
              Testează fluxul de rezervare
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border oc-border bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] oc-secondary-text">Proof real (ultimele 30 zile)</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border oc-border p-4">
              <p className="text-xs oc-secondary-text">Programări confirmate pe platformă</p>
              <p className="mt-1 text-2xl font-bold oc-text">{proof.confirmedBookings30d}</p>
            </div>
            <div className="rounded-xl border oc-border p-4">
              <p className="text-xs oc-secondary-text">Business-uri active cu booking confirmat</p>
              <p className="mt-1 text-2xl font-bold oc-text">{proof.activeBusinesses30d}</p>
            </div>
          </div>
          <p className="mt-3 text-xs oc-secondary-text">Metrici derivate din programări confirmate (nu reprezintă venit facturat Stripe).</p>
        </section>

        {/* ── DE CE ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            De ce nutriționiștii aleg programări online în loc de telefon sau WhatsApp
          </h2>
          <p className="leading-relaxed oc-text">
            Modelul clasic de gestionare a programărilor — mesaje pe WhatsApp, apeluri, note pe hârtie — funcționează când ai un număr mic de
            clienți. Pe măsură ce activitatea crește, coordonarea manuală a agendei devine în sine o sarcină cu program întreg. Programările online
            nu schimbă modul în care lucrezi cu clienții — elimină doar birocrația legată de agendă.
          </p>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              Clienții rezervă când sunt motivați — nu când ești disponibil la mesaje
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              Decizia de a face o consultație la nutriționist se ia adesea seara, după ce cineva a citit un articol, a văzut un video sau
              a discutat cu un prieten. În acel moment, dorința este maximă. Dacă nu pot rezerva imediat, mulți amână și uită. Un link de
              rezervare disponibil 24/7 captează această decizie instant — fără să fie nevoie ca tu să fii online sau disponibil la telefon.
            </p>
          </article>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              Gestionezi consultații la cabinet și online din același sistem
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              Mulți nutriționiști lucrează în ambele formate: față în față la cabinet și prin video call pentru clienți din alte orașe.
              Cu OcupaLoc configurezi ambele tipuri ca servicii separate, cu durate și prețuri diferite dacă este cazul. Clientul alege
              direct din link formatul preferat. Nu ai nevoie de sisteme diferite sau linkuri separate pentru același lucru.
            </p>
          </article>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              Prima consultație și follow-up — cu durate diferite în aceeași agendă
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              Prima consultație la un nutriționist durează de obicei 60-90 de minute și include anamneza, analiza obiceiurilor alimentare și
              stabilirea obiectivelor. Consultațiile de urmărire durează 30-45 de minute. OcupaLoc permite configurarea duratelor exacte per
              tip de serviciu. Agenda se blochează automat pe durata corectă, fără suprapuneri și fără calcule manuale.
            </p>
          </article>
        </section>

        {/* ── CE PRIMESTI ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ce primești cu OcupaLoc ca nutriționist sau dietetician
          </h2>
          <p className="leading-relaxed oc-text">
            OcupaLoc nu este o platformă de listing unde concurezi cu alți specialiști. Este instrumentul tău propriu — cu linkul tău,
            serviciile tale și regulile tale. Clientul ajunge direct la tine.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Link personal de rezervare în 5 minute</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                Îți creezi contul, adaugi tipurile de consultații cu duratele și prețurile lor și primești{" "}
                <span className="font-mono oc-text">ocupaloc.ro/numele-tau</span> — pui linkul în Instagram, TikTok, Google Business sau site.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Confirmare automată pentru tine și client</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                La fiecare rezervare primești email cu datele clientului, tipul consultației și ora. Clientul primește confirmarea automată.
                Fără mesaje manuale, fără confirm-uri pe WhatsApp.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Agenda clară fără Excel sau agende scrise</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                Toate consultațiile sunt în dashboard-ul tău, ordonate cronologic. Știi exact ce zi urmează și câți clienți noi ai în săptămână,
                fără să combini mai multe sisteme.
              </p>
            </article>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/signup?start=1&tip=nutritionist"
              data-cta-location="nutritionist_features_cta"
              className="rounded-lg oc-primary px-6 py-3 font-semibold text-white"
            >
              Începe testul gratuit de 14 zile
            </Link>
          </div>
        </section>

        {/* ── TIPURI CABINET ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Potrivit pentru cabinet individual și pentru nutriționiști cu activitate online
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border oc-border bg-white p-6">
              <h3 className="text-xl font-semibold oc-accent">Nutriționist independent cu program fix sau flexibil</h3>
              <p className="mt-3 leading-relaxed oc-text">
                Dacă lucrezi singur cu un program variabil — zile diferite la cabinet, zile de consultații online, zile rezervate pentru
                creat planuri alimentare — OcupaLoc se adaptează ușor. Poți activa sau dezactiva zile, seta intervale de pauză și bloca
                perioadele ocupate cu alte activități. Clienții văd mereu disponibilitatea reală, nu un calendar static.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-6">
              <h3 className="text-xl font-semibold oc-accent">Nutriționist cu activitate predominant online</h3>
              <p className="mt-3 leading-relaxed oc-text">
                Dacă lucrezi cu clienți din toată România prin video call, OcupaLoc funcționează identic — fără să ai nevoie de cabinet fizic.
                Clienții din Cluj, Timișoara sau Constanța rezervă consultații online exact la fel ca cei locali. Linkul de rezervare merge
                oriunde: Instagram cu audiență națională, newsletter, site personal sau reclame online.
              </p>
            </article>
          </div>
        </section>

        {/* ── COMPARATIV ── */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            OcupaLoc față de alte soluții pentru programări la nutriționist
          </h2>
          <p className="leading-relaxed oc-text">
            Platformele de tip Docplanner/RoMedic îți cer să concurezi cu alți nutriționiști din același listing. Calendly nu are localizare
            în română și nu e optimizat pentru piața locală. OcupaLoc este construit pentru profesioniști din România — în română, facturat
            în RON, cu suport local.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b oc-border text-left oc-secondary-text">
                  <th className="pb-3 pr-4 font-medium">Funcționalitate</th>
                  <th className="pb-3 pr-4 font-semibold text-white">OcupaLoc</th>
                  <th className="pb-3 pr-4 font-medium">Docplanner / RoMedic</th>
                  <th className="pb-3 font-medium">Calendly</th>
                </tr>
              </thead>
              <tbody>
                {competitorRows.map((row) => (
                  <tr key={row.feature} className="border-b oc-border">
                    <td className="py-3 pr-4 oc-secondary-text">{row.feature}</td>
                    <td className="py-3 pr-4 font-medium oc-accent">{row.ocupaloc}</td>
                    <td className="py-3 pr-4 oc-secondary-text">{row.docplanner}</td>
                    <td className="py-3 oc-secondary-text">{row.calendly}</td>
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
            <article key={item.question} className="rounded-xl border oc-border bg-white p-6">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 leading-relaxed oc-text">{item.answer}</p>
            </article>
          ))}
        </section>

        {/* ── FINAL CTA ── */}
        <section className="rounded-2xl border oc-border oc-primary p-8 text-center">
          <h2 className="text-2xl font-bold">
            Gata să elimini coordonarea programărilor pe WhatsApp?
          </h2>
          <p className="mt-3 oc-text">
            14 zile gratuit, fără card. Configurezi cabinetul în 5 minute și trimiți linkul primilor clienți chiar astăzi.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?start=1&tip=nutritionist"
              data-cta-location="nutritionist_final_cta"
              className="rounded-lg oc-primary px-8 py-3 font-semibold text-white"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/preturi"
              className="rounded-lg border oc-border px-8 py-3 font-semibold oc-text hover:oc-badge-bg"
            >
              Vezi prețul
            </Link>
          </div>
        </section>

        {/* ── INTERNAL LINKS ── */}
        <nav aria-label="Pagini conexe" className="border-t oc-border pt-8">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider oc-secondary-text">Vezi și</p>
          <ul className="flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg border oc-border px-4 py-2 text-sm oc-text hover:oc-badge-bg"
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
