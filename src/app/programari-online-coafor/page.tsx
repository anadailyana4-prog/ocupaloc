import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { getPublicProofMetrics } from "@/lib/public-proof";

export const metadata: Metadata = {
  title: "Programări Online Coafor | Software 59,99 RON/lună Fără Comision",
  description:
    "Software de programări online pentru coafoare și saloane de coafură. Fără comision, preț fix 59,99 RON/lună. Clientele rezervă direct vopsit, tuns sau coafat — tu nu mai răspunzi la telefon.",
  alternates: { canonical: "https://ocupaloc.ro/programari-online-coafor" }
};

const faqItems = [
  {
    question: "Pot diferenția serviciile de coafură după durată și preț?",
    answer:
      "Da. Configurezi fiecare serviciu separat: tuns, vopsit, coafat, mese, balyage, keratinare — fiecare cu durata și prețul lui. Agenda se blochează automat pe durata corectă, fără suprapuneri."
  },
  {
    question: "Funcționează și dacă am mai mulți coafori în salon?",
    answer:
      "Da. Fiecare coafor din salon poate avea agenda proprie. Clienta alege coaforul preferat și vede disponibilitatea lui în timp real. Nu există programări duble pe același specialist."
  },
  {
    question: "Clienții pot rezerva și servicii care durează 3-4 ore, ca vopsitul complet?",
    answer:
      "Da. Nu există limită de durată per serviciu. Dacă vopsitul complet durează 3 ore și jumătate, configurezi exact acea durată și sistemul blochează întreg intervalul din agendă."
  },
  {
    question: "Am nevoie de un site pentru a folosi OcupaLoc?",
    answer:
      "Nu. Primești un link propriu de tipul ocupaloc.ro/numele-salonului pe care îl pui direct în Instagram bio, Google Business sau WhatsApp. Clienții rezervă fără să ai nevoie de site propriu."
  },
  {
    question: "Ce se întâmplă când o clientă rezervă? Primesc notificare?",
    answer:
      "Da. La fiecare rezervare nouă primești email instant cu datele clientei, serviciul ales, coaforul și ora. Clienta primește și ea confirmare automată. Nicio intervenție manuală din partea ta."
  },
  {
    question: "Pot bloca zilele de concediu sau salonul este mereu disponibil?",
    answer:
      "Tu controlezi complet disponibilitatea. Blochezi zilele libere, concediile sau intervalele de pauză din dashboard. Clienții nu pot rezerva în perioadele blocate."
  },
  {
    question: "Este mai ieftin decât Fresha sau Treatwell?",
    answer:
      "Da. OcupaLoc costă 59,99 RON/lună fix, fără comision per programare. Fresha și Treatwell percep comisioane de 20-35% din rezervările aduse de platformă. La un salon cu venit mediu, diferența este semnificativă lunar."
  },
  {
    question: "Există perioadă de test gratuită?",
    answer:
      "Da. 14 zile gratuite, fără card. Configurezi salonul, adaugi serviciile și coaforii și trimiți linkul primelor cliente. Plătești doar dacă ești mulțumit de rezultat."
  }
];

const serviciiCoafor = [
  { name: "Tuns și coafat", duration: "45–60 min" },
  { name: "Vopsit complet", duration: "120–210 min" },
  { name: "Balyage / mese", duration: "150–240 min" },
  { name: "Keratinare / tratamente", duration: "120–180 min" },
  { name: "Coafat ocazie", duration: "60–90 min" },
  { name: "Consultație culoare", duration: "30 min" }
];

const competitorRows = [
  {
    feature: "Preț lunar",
    ocupaloc: "59,99 RON",
    fresha: "Gratuit + comision 20-35%",
    treatwell: "Gratuit + comision 20-35%"
  },
  {
    feature: "Comision per programare",
    ocupaloc: "0 RON",
    fresha: "Da — pe rezervările din platformă",
    treatwell: "Da — pe rezervările din platformă"
  },
  {
    feature: "Ești listat lângă concurenți",
    ocupaloc: "Nu — pagina ta proprie",
    fresha: "Da",
    treatwell: "Da"
  },
  {
    feature: "Clienții rămân ai tăi",
    ocupaloc: "Da",
    fresha: "Parțial — îi are și platforma",
    treatwell: "Parțial — îi are și platforma"
  },
  {
    feature: "Durate configurabile per serviciu",
    ocupaloc: "Da",
    fresha: "Da",
    treatwell: "Da"
  },
  {
    feature: "Setup în 5 minute fără IT",
    ocupaloc: "Da",
    fresha: "Da",
    treatwell: "Da"
  },
  {
    feature: "Plată în RON fără TVA internațional",
    ocupaloc: "Da",
    fresha: "Nu (facturat din UK/IE)",
    treatwell: "Nu (facturat din Olanda)"
  }
];

const relatedLinks = [
  { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
  { href: "/programari-online-salon", label: "Programări online salon beauty" },
  { href: "/alternativa-fresha-romania", label: "Alternativă Fresha România" },
  { href: "/preturi", label: "Prețuri OcupaLoc" },
  { href: "/demo-interactiv", label: "Testează fluxul de rezervare" }
];

export default async function ProgramariOnlineCoaforPage() {
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
    name: "OcupaLoc — Programări online coafor",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      description: "Abonament lunar programări online salon coafură"
    },
    description:
      "Software de programări online pentru coafoare și saloane de coafură din România. Fără comision, preț fix 59,99 RON/lună."
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script
        id="faq-schema-coafor"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="service-schema-coafor"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="mx-auto max-w-5xl space-y-14">

        {/* ── HERO ── */}
        <section className="rounded-2xl border oc-border bg-white p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Programări online pentru coafor — fără telefon, fără agendă de hârtie
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed oc-text">
            Salonul tău de coafură pierde timp prețios cu apeluri de programare, confirmări și reprogramări. OcupaLoc îți oferă un link personal
            de rezervare pe care clientele îl accesează oricând, aleg serviciul dorit — tuns, vopsit, balyage, keratinare — și primesc confirmare
            automată. Tu nu mai întrerupi lucrul ca să răspunzi la telefon. Preț fix{" "}
            <strong className="text-white">59,99 RON/lună</strong>, fără comision la fiecare programare.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup?start=1&tip=coafor"
              data-cta-location="coafor_hero_primary"
              className="rounded-lg oc-primary px-6 py-3 font-semibold text-white"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/demo-interactiv"
              data-cta-location="coafor_hero_demo"
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

        {/* ── SERVICII ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Servicii de coafură cu durate diferite — toate în aceeași agendă
          </h2>
          <p className="leading-relaxed oc-text">
            Una dintre cele mai mari provocări în coafură este că serviciile au durate complet diferite. Un tuns durează 45 de minute,
            un balyage poate dura 4 ore. Cu OcupaLoc, fiecare serviciu are durata sa configurată exact, iar agenda se blochează automat
            pe întreaga perioadă. Clientele văd doar sloturile reale în care se poate programa serviciul ales — nu sloturile standard de 30 de minute.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {serviciiCoafor.map((s) => (
              <div key={s.name} className="rounded-xl border oc-border bg-white p-4">
                <p className="font-semibold oc-text">{s.name}</p>
                <p className="mt-1 text-sm oc-secondary-text">{s.duration}</p>
              </div>
            ))}
          </div>
          <p className="text-sm oc-secondary-text">
            Duratele de mai sus sunt orientative. Tu configurezi durata exactă pentru fiecare serviciu din salonul tău.
          </p>
        </section>

        {/* ── DE CE ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            De ce coafoarele și saloanele de coafură trec la programări online
          </h2>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              Clientele rezervă când au chef — nu când ești disponibil la telefon
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              Cea mai mare parte a deciziilor de programare se iau seara sau în weekend, când salonul este ocupat sau închis. Dacă clienții nu pot
              rezerva în momentul în care vor, amână și poate uită sau merg la alt salon. Un link de rezervare disponibil 24/7 captează această
              intenție în momentul exact în care apare, fără nicio intervenție din partea ta.
            </p>
          </article>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              Nu mai ești întrerupt în timpul lucrului pentru a confirma ore
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              Fiecare apel primit în timp ce lucrezi cu o clientă este o întrerupere care afectează calitatea muncii și experiența clientei de
              pe scaun. Cu programările online, confirmările sunt automate. Clienții primesc toate detaliile instant, tu nu mai întrerupi lucrul
              și nu mai ții minte cine a sunat și pentru ce oră a întrebat.
            </p>
          </article>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              Fără dependență de platformele cu comision
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              Platformele de tip Fresha sau Treatwell aduc vizibilitate, dar percep 20-35% comision din rezervările generate de ele. Pe termen lung,
              devii dependent de o platformă care deține relația cu clienții tăi. OcupaLoc îți dă instrumentul de programare, dar clienții sunt
              100% ai tăi. Nu există comision, nu există listing cu concurenți, nu există risc de a pierde clienți dacă schimbi platforma.
            </p>
          </article>
        </section>

        {/* ── CE PRIMESTI ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ce primești cu OcupaLoc ca salon de coafură
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Link propriu de rezervare</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                <span className="font-mono oc-text">ocupaloc.ro/salonul-tau</span> — pui linkul în Instagram bio, Google Business sau WhatsApp și clienții rezervă direct fără să te sune.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Agende individuale per coafor</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                Dacă lucrezi cu mai mulți coafori, fiecare are agenda sa. Clienta alege specialistul preferat și vede disponibilitatea lui reală.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Confirmare automată — fără nicio acțiune din partea ta</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                La fiecare rezervare, tu primești email cu datele clientei, ea primește confirmarea cu ora și serviciul. Totul automat, instant.
              </p>
            </article>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/signup?start=1&tip=coafor"
              data-cta-location="coafor_features_cta"
              className="rounded-lg oc-primary px-6 py-3 font-semibold text-white"
            >
              Începe testul gratuit de 14 zile
            </Link>
          </div>
        </section>

        {/* ── COMPARATIV ── */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            OcupaLoc vs. Fresha și Treatwell pentru saloane de coafură
          </h2>
          <p className="leading-relaxed oc-text">
            Fresha și Treatwell sunt platforme de listing cu vizibilitate mare, dar cu comisioane semnificative. OcupaLoc este instrumentul tău
            propriu de programări — fără comision, fără listing, fără dependență de o platformă externă.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b oc-border text-left oc-secondary-text">
                  <th className="pb-3 pr-4 font-medium">Funcționalitate</th>
                  <th className="pb-3 pr-4 font-semibold text-white">OcupaLoc</th>
                  <th className="pb-3 pr-4 font-medium">Fresha</th>
                  <th className="pb-3 font-medium">Treatwell</th>
                </tr>
              </thead>
              <tbody>
                {competitorRows.map((row) => (
                  <tr key={row.feature} className="border-b oc-border">
                    <td className="py-3 pr-4 oc-secondary-text">{row.feature}</td>
                    <td className="py-3 pr-4 font-medium oc-accent">{row.ocupaloc}</td>
                    <td className="py-3 pr-4 oc-secondary-text">{row.fresha}</td>
                    <td className="py-3 oc-secondary-text">{row.treatwell}</td>
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
            Gata să primești programări fără să te mai întrerupi din lucru?
          </h2>
          <p className="mt-3 oc-text">
            14 zile gratuit, fără card. Configurezi salonul în 5 minute și poți trimite linkul primelor cliente chiar astăzi.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?start=1&tip=coafor"
              data-cta-location="coafor_final_cta"
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
