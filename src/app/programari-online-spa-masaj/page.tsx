import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Programări Online Spa și Masaj | Software 59,99 RON/lună Fără Comision",
  description:
    "Software de programări online pentru spa, salon de masaj și centre de relaxare. Fără comision, preț fix 59,99 RON/lună. Clienții rezervă ședințe de masaj și tratamente direct, tu primești confirmare automată.",
  alternates: { canonical: "https://ocupaloc.ro/programari-online-spa-masaj" }
};

const faqItems = [
  {
    question: "Pot oferi mai multe tipuri de masaj cu durate diferite?",
    answer:
      "Da. Configurezi fiecare tip de masaj sau tratament separat: masaj relaxare 60 min, masaj terapeutic 90 min, masaj anticellulitic 60 min, masaj cu pietre 90 min. Fiecare are durata și prețul exact. Agenda se blochează automat pe durata corectă."
  },
  {
    question: "Funcționează și dacă am mai mulți terapeuți în spa?",
    answer:
      "Da. Fiecare terapeut are agenda sa proprie. Clientul alege terapeutul preferat și vede disponibilitatea lui în timp real. Nu pot apărea două programări pe același specialist în același slot."
  },
  {
    question: "Clienții pot rezerva pachete complete de tratamente?",
    answer:
      "Da. Poți configura pachete (de exemplu, masaj + facial 2 ore 30 minute) ca un singur serviciu cu durată și preț complete. Clientul rezervă pachetul dintr-un singur pas."
  },
  {
    question: "Am nevoie de site propriu pentru a folosi OcupaLoc?",
    answer:
      "Nu. Primești un link propriu de rezervare pe care îl pui în Instagram, Google Business sau oriunde altundeva. Clienții accesează pagina ta și rezervă fără să ai nevoie de site."
  },
  {
    question: "Pot bloca salonul pentru zile de curățenie sau concediu?",
    answer:
      "Da. Blochezi orice zi sau interval din dashboard. Clienții nu pot rezerva în perioadele blocate, indiferent de terapeut sau serviciu."
  },
  {
    question: "Primesc notificare când cineva rezervă o ședință?",
    answer:
      "Da. La fiecare rezervare primești email instant cu datele clientului, serviciul ales, terapeutul și ora. Clientul primește și el confirmare automată cu toate detaliile."
  },
  {
    question: "Este potrivit și pentru un cabinet de masaj individual, nu doar spa cu mai mulți angajați?",
    answer:
      "Da. Un maseur independent cu program propriu îl poate folosi la fel de eficient ca un spa cu 5 terapeuți. Prețul rămâne fix: 59,99 RON/lună indiferent de numărul de rezervări."
  },
  {
    question: "Există perioadă de test gratuită?",
    answer:
      "Da. 14 zile gratuite, fără card. Configurezi centrul, adaugi serviciile și terapeuții și poți trimite linkul primilor clienți imediat. Plătești doar dacă ești mulțumit."
  }
];

const serviciiSpa = [
  { name: "Masaj relaxare", duration: "60 / 90 min" },
  { name: "Masaj terapeutic", duration: "60 / 90 min" },
  { name: "Masaj cu pietre calde", duration: "90 min" },
  { name: "Masaj anticellulitic", duration: "60 min" },
  { name: "Facial / tratament față", duration: "60–90 min" },
  { name: "Pachet spa complet", duration: "120–180 min" }
];

const beneficii = [
  {
    title: "Rezervări la orice oră, fără apeluri",
    desc:
      "Clienții caută spa și masaj seara sau în weekend. Un link de rezervare disponibil 24/7 captează intenția în momentul exact în care apare. Ei aleg serviciul, terapeutul și ora, și primesc confirmare — fără nicio intervenție din partea ta."
  },
  {
    title: "Agenda organizată pe mai mulți terapeuți",
    desc:
      "Dacă lucrezi cu mai mulți masori sau terapeuți, OcupaLoc gestionează agenda fiecăruia separat. Nu există programări duble, nu există confuzii. Fiecare terapeut are propriul link sau clienții aleg din lista disponibilă."
  },
  {
    title: "Fără comisioane la platformele de listing",
    answer:
      "Platformele de beauty și wellness percep 20-35% comision din rezervările aduse. Cu OcupaLoc plătești 59,99 RON/lună indiferent de câte rezervări primești. Clienții sunt 100% ai tăi."
  }
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
    feature: "Durate configurabile per serviciu",
    ocupaloc: "Da — orice durată",
    fresha: "Da",
    treatwell: "Da"
  },
  {
    feature: "Clienții rămân ai tăi",
    ocupaloc: "Da — 100%",
    fresha: "Parțial",
    treatwell: "Parțial"
  },
  {
    feature: "Setup fără echipă tehnică",
    ocupaloc: "Da — 5 minute",
    fresha: "Da",
    treatwell: "Mediu"
  },
  {
    feature: "Plată în RON fără TVA internațional",
    ocupaloc: "Da",
    fresha: "Nu (facturat din UK/IE)",
    treatwell: "Nu (facturat din Olanda)"
  }
];

const relatedLinks = [
  { href: "/programari-online-salon", label: "Programări online salon beauty" },
  { href: "/programari-online-cosmetica", label: "Programări online cosmetică" },
  { href: "/alternativa-fresha-romania", label: "Alternativă Fresha România" },
  { href: "/preturi", label: "Prețuri OcupaLoc" },
  { href: "/demo-interactiv", label: "Testează fluxul de rezervare" }
];

export default function ProgramariOnlineSpaMasajPage() {
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
    name: "OcupaLoc — Programări online spa și masaj",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      description: "Abonament lunar programări online spa și salon masaj"
    },
    description:
      "Software de programări online pentru spa, salon de masaj și centre de relaxare din România. Fără comision, preț fix 59,99 RON/lună."
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <Script
        id="faq-schema-spa-masaj"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="service-schema-spa-masaj"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="mx-auto max-w-5xl space-y-14">

        {/* ── HERO ── */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Programări online pentru spa și masaj — rezervări automate, fără telefon
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-300">
            Clienții unui salon de masaj sau spa rezervă rar în orele de program — ei caută și hotărăsc seara sau în weekend.
            OcupaLoc îți oferă un link personal de rezervare disponibil 24/7: clientul alege tipul de masaj sau tratamentul dorit, terapeutul
            preferat și ora disponibilă, și primește confirmare automată. Tu nu mai ești întrerupt, agenda nu mai are suprapuneri.
            Preț fix <strong className="text-white">59,99 RON/lună</strong>, fără comision per ședință.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup?start=1&tip=spa-masaj"
              data-cta-location="spa_hero_primary"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/demo-interactiv"
              data-cta-location="spa_hero_demo"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 hover:bg-zinc-800"
            >
              Testează fluxul de rezervare
            </Link>
          </div>
        </section>

        {/* ── SERVICII ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Orice tip de masaj sau tratament, cu durata lui exactă
          </h2>
          <p className="leading-relaxed text-zinc-300">
            Spre deosebire de un tuns sau o manichiură cu durată relativ fixă, serviciile de spa și masaj variază enorm: de la 30 de minute
            la pachete complete de 3 ore. OcupaLoc permite configurarea duratei exacte pentru fiecare serviciu. Clientul vede exact cât
            durează și ce oră îi rămâne disponibilă — nu un calendar cu sloturi de 30 de minute care nu reflectă realitatea.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {serviciiSpa.map((s) => (
              <div key={s.name} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="font-semibold text-zinc-100">{s.name}</p>
                <p className="mt-1 text-sm text-zinc-400">{s.duration}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-zinc-400">
            Duratele sunt orientative. Configurezi durata și prețul exact pentru fiecare serviciu din centrul tău.
          </p>
        </section>

        {/* ── DE CE ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            De ce centrele spa și saloanele de masaj trec la programări online
          </h2>

          {beneficii.map((b) => (
            <article key={b.title} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h3 className="text-xl font-semibold text-amber-100">{b.title}</h3>
              <p className="mt-3 leading-relaxed text-zinc-300">{b.desc ?? b.answer}</p>
            </article>
          ))}

          <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h3 className="text-xl font-semibold text-amber-100">
              Reduci anulările de ultim moment prin confirmare automată
            </h3>
            <p className="mt-3 leading-relaxed text-zinc-300">
              Clienții care rezervă online și primesc o confirmare scrisă cu serviciul, terapeutul și ora au o rată mai mică de neprezentare.
              Confirmarea funcționează ca un angajament. Poți seta și un interval minim de anulare — de exemplu, nu se pot anula rezervările
              cu mai puțin de 24 de ore înainte. Reduces locurile goale fără nicio intervenție manuală.
            </p>
          </article>
        </section>

        {/* ── CE PRIMESTI ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ce primești cu OcupaLoc pentru spa sau salon de masaj
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-lg font-semibold">Link propriu de rezervare</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                <span className="font-mono text-zinc-300">ocupaloc.ro/spa-ul-tau</span> — pui linkul în Instagram, Google Maps sau pe orice altă platformă. Clienții rezervă direct, fără apeluri.
              </p>
            </article>
            <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-lg font-semibold">Agende separate per terapeut</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Fiecare maseur sau terapeut are propria agendă. Clientul alege specialistul preferat și vede disponibilitatea lui reală, nu un calendar comun cu suprapuneri.
              </p>
            </article>
            <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-lg font-semibold">Confirmare automată pentru toată lumea</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Tu primești email cu detaliile rezervării, clientul primește confirmarea ședinței. Ambele instant, fără nicio acțiune manuală.
              </p>
            </article>
          </div>
          <div className="mt-4 text-center">
            <Link
              href="/signup?start=1&tip=spa-masaj"
              data-cta-location="spa_features_cta"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              Începe testul gratuit de 14 zile
            </Link>
          </div>
        </section>

        {/* ── COMPARATIV ── */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            OcupaLoc vs. Fresha și Treatwell pentru spa și masaj
          </h2>
          <p className="leading-relaxed text-zinc-300">
            Fresha și Treatwell sunt platforme de listing — vizibilitate mare, dar cu comision pe fiecare rezervare adusă de ele.
            OcupaLoc este instrumentul tău propriu: clienții vin la tine, nu la un marketplace cu zeci de competitori.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-700 text-left text-zinc-400">
                  <th className="pb-3 pr-4 font-medium">Funcționalitate</th>
                  <th className="pb-3 pr-4 font-semibold text-white">OcupaLoc</th>
                  <th className="pb-3 pr-4 font-medium">Fresha</th>
                  <th className="pb-3 font-medium">Treatwell</th>
                </tr>
              </thead>
              <tbody>
                {competitorRows.map((row) => (
                  <tr key={row.feature} className="border-b border-zinc-800">
                    <td className="py-3 pr-4 text-zinc-400">{row.feature}</td>
                    <td className="py-3 pr-4 font-medium text-indigo-300">{row.ocupaloc}</td>
                    <td className="py-3 pr-4 text-zinc-400">{row.fresha}</td>
                    <td className="py-3 text-zinc-400">{row.treatwell}</td>
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
            Gata să primești rezervări automate la spa sau salon de masaj?
          </h2>
          <p className="mt-3 text-zinc-300">
            14 zile gratuit, fără card. Configurezi centrul în 5 minute și trimiți linkul primilor clienți chiar astăzi.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?start=1&tip=spa-masaj"
              data-cta-location="spa_final_cta"
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
