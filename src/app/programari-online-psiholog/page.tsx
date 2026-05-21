import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { getPublicProofMetrics } from "@/lib/public-proof";

export const metadata: Metadata = {
  title: "Programări Online Psiholog | Software Cabinet 59,99 RON/lună",
  description:
    "Software de programări online pentru psihologi și cabinete de psihoterapie. Fără comision, preț fix 59,99 RON/lună. Clienții rezervă direct, tu primești confirmare automată.",
  alternates: { canonical: "https://ocupaloc.ro/programari-online-psiholog" }
};

const faqItems = [
  {
    question: "Pot seta sesiuni de 50 sau 90 de minute?",
    answer:
      "Da. OcupaLoc îți permite să configurezi fiecare serviciu cu durata exactă. Poți adăuga o sesiune standard de 50 minute, o sesiune extinsă de 90 minute sau orice altă durată necesară pentru evaluări și terapie de cuplu."
  },
  {
    question: "Clienții pot anula singuri programarea?",
    answer:
      "Da. Clientul primește un link de confirmare la momentul rezervării și poate anula sau modifica programarea înainte de ora stabilită. Tu setezi câte ore înainte este permisă anularea."
  },
  {
    question: "Funcționează și pentru ședințe online, nu doar la cabinet?",
    answer:
      "Da. Poți adăuga servicii de tip 'Ședință online' cu durată și preț separate față de ședințele la cabinet. Linkul de programare funcționează identic, iar clientul primește aceeași confirmare automată."
  },
  {
    question: "Am nevoie de un site propriu pentru a folosi OcupaLoc?",
    answer:
      "Nu. OcupaLoc îți generează o pagină publică de rezervare gata de utilizat. Pui linkul direct în Instagram, Google Business Profile sau WhatsApp. Nu ai nevoie de site propriu, hosting sau cunoștințe tehnice."
  },
  {
    question: "Ce se întâmplă când clientul rezervă? Primesc notificare?",
    answer:
      "Da. La fiecare rezervare nouă primești email de notificare cu datele clientului, serviciul ales și ora. Clientul primește și el confirmare automată. Ambele mesaje sunt trimise instant."
  },
  {
    question: "Pot bloca interval de timp pentru pauze sau zile libere?",
    answer:
      "Da. Poți configura programul săptămânal, pauza de prânz, zilele libere sau perioadele de concediu. Clientul vede doar sloturile cu adevărat disponibile."
  },
  {
    question: "Este potrivit pentru cabinet cu mai mulți psihoterapeuți?",
    answer:
      "Da. Fiecare terapeut poate avea propriul cont și link de programare separat. Dacă lucrați sub același cabinet, fiecare profesionist gestionează independent agenda sa."
  },
  {
    question: "Există perioadă de test gratuită?",
    answer:
      "Da. Ai 14 zile gratuite pentru a testa OcupaLoc fără card. Configurezi cabinetul, primești link de rezervare și poți verifica fluxul complet înainte de a plăti ceva."
  }
];

const relatedLinks = [
  { href: "/preturi", label: "Vezi prețul complet" },
  { href: "/programari-online-salon", label: "Funcționează și pentru saloane beauty" },
  { href: "/blog/telefon-vs-programari-online", label: "Telefon vs programări online" },
  { href: "/demo-interactiv", label: "Testează fluxul de rezervare" },
  { href: "/despre", label: "Cine suntem" }
];

const competitorRows = [
  {
    feature: "Preț lunar",
    ocupaloc: "59,99 RON",
    mindx: "~150–300 RON (estimare)",
    psihomanager: "~100–200 RON (estimare)"
  },
  {
    feature: "Comision per programare",
    ocupaloc: "0 RON",
    mindx: "Variabil",
    psihomanager: "Variabil"
  },
  {
    feature: "Suport în română",
    ocupaloc: "Da",
    mindx: "Da",
    psihomanager: "Da"
  },
  {
    feature: "Pagină publică fără site propriu",
    ocupaloc: "Da",
    mindx: "Parțial",
    psihomanager: "Parțial"
  },
  {
    feature: "Confirmare automată email",
    ocupaloc: "Da",
    mindx: "Da",
    psihomanager: "Da"
  },
  {
    feature: "Setup fără echipă tehnică",
    ocupaloc: "Da — 5 minute",
    mindx: "Mediu",
    psihomanager: "Mediu"
  },
  {
    feature: "Funcționează pentru orice serviciu, nu doar psihologie",
    ocupaloc: "Da",
    mindx: "Nu",
    psihomanager: "Nu"
  },
  {
    feature: "Plată în RON fără TVA internațional",
    ocupaloc: "Da",
    mindx: "Da",
    psihomanager: "Da"
  }
];

export default async function ProgramariOnlinePsihologPage() {
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
    name: "OcupaLoc — Programări online psiholog",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "59.99",
      priceCurrency: "RON",
      description: "Abonament lunar programări online cabinet psiholog"
    },
    description:
      "Software de programări online pentru psihologi și cabinete de psihoterapie din România. Fără comision, preț fix 59,99 RON/lună."
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script
        id="faq-schema-psiholog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="service-schema-psiholog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      <div className="mx-auto max-w-5xl space-y-14">

        {/* ── HERO ── */}
        <section className="rounded-2xl border oc-border bg-white p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Programări online pentru psiholog — fără telefon, fără WhatsApp
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed oc-text">
            Ca psiholog sau psihoterapeut, timpul pe care îl pierzi cu programările prin telefon și mesaje este timp luat din energie și atenție
            pentru clienți. OcupaLoc îți oferă un link personal de rezervare pe care clienții îl accesează direct, aleg ședința, ora disponibilă
            și primesc confirmare automată. Tu nu mai răspunzi la &bdquo;mai aveți loc joi?&rdquo; Programările vin la tine, ordonate și confirmate.
            Preț fix <strong className="text-white">59,99 RON/lună</strong>, fără comision la fiecare ședință.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/signup?start=1&tip=psiholog"
              data-cta-location="psiholog_hero_primary"
              className="rounded-lg oc-primary px-6 py-3 font-semibold text-white"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/demo-interactiv"
              data-cta-location="psiholog_hero_demo"
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
            De ce psihologii aleg programări online în loc de telefon
          </h2>
          <p className="leading-relaxed oc-text">
            Modelul clasic — apeluri, mesaje WhatsApp, agende scrise — funcționează când ai câțiva clienți constanți. Dar pe măsură ce cabinetul
            crește, gestionarea manuală a programărilor devine o sarcină în sine. Fiecare loc disponibil este anunțat, întrebat, confirmat și
            reconfirmat. Dacă apare o anulare, ciclul se reia. Programările online elimină acest ciclu.
          </p>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              {"Clienții rezervă când au curajul să o facă — nu când ești disponibil la telefon"}
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              Mulți oameni care caută un psiholog ezită să sune. Există o barieră emoțională reală în a inițiia primul contact vocal. Un link de
              rezervare online elimină această barieră. Clientul poate accesa pagina ta luni dimineața la 7:00 sau duminică seara la 22:00, alege
              serviciul și confirmă ședința fără nicio conversație. Primul pas — cel mai greu — devine practic invizibil. Rata de conversie
              crește tocmai pentru că fricțiunea scade.
            </p>
          </article>

          <article className="rounded-xl border oc-border bg-white p-6">
            <h3 className="text-xl font-semibold text-oc-teal">
              Fără conversații repetitive despre ore și disponibilitate
            </h3>
            <p className="mt-3 leading-relaxed oc-text">
              &bdquo;Aveți loc miercuri la 18:00?&rdquo; &mdash; &bdquo;Nu, dar joi la 17:00?&rdquo; &mdash; &bdquo;Joi nu pot, dar vineri?&rdquo; Această negociere repetată consumă minute la
              fiecare client nou și energie mentală pe care o poți aloca altfel. Cu un sistem de programări online, clientul vede direct sloturile
              disponibile, alege ce i se potrivește și gata. Tu nu intervii în proces decât dacă vrei să modifici ceva în agendă.
            </p>
          </article>
        </section>

        {/* ── CE PRIMESTI ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ce primești cu OcupaLoc ca psiholog sau psihoterapeut
          </h2>
          <p className="leading-relaxed oc-text">
            OcupaLoc nu este o platformă de listing unde concurezi cu alți specialiști. Este un instrument propriu, cu linkul tău, branding-ul tău
            și regulile tale. Clientul ajunge direct la tine, nu printr-un marketplace.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Link personal de rezervare în 5 minute</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                Îți creezi contul, adaugi tipurile de ședințe (standard, extinsă, online, evaluare), setezi duratele, prețurile și programul
                săptămânal. Primești un link de tipul <span className="font-mono oc-text">ocupaloc.ro/numele-tau</span> pe care îl pui
                imediat în Instagram, Google Business sau website.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Confirmare automată pentru tine și pentru client</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                La fiecare rezervare nouă primești email instant cu datele clientului. Clientul primește confirmarea ședinței și toate detaliile
                necesare. Nu mai trimiți confirmări manual, nu mai cauți cine a scris și când.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">Agendă clară fără Excel sau agende de hârtie</h3>
              <p className="mt-2 text-sm leading-relaxed oc-secondary-text">
                Toate programările sunt în dashboard-ul tău, ordonate cronologic. Știi exact ce zi urmează, care clienți sunt noi și câte
                ședințe ai în săptămână. Nu mai combini două sisteme diferite pentru același scop.
              </p>
            </article>
          </div>

          <p className="leading-relaxed oc-text">
            Pe lângă fluxul de bază, poți configura durate diferite pentru fiecare tip de serviciu — esențial într-un cabinet de psihologie unde
            o ședință de evaluare durează mai mult decât una standard, iar terapia de cuplu are alt format față de terapia individuală. Agenda
            reflectă realist cum arată ziua ta de lucru, nu o simplificare artificială.
          </p>
        </section>

        {/* ── TIPURI CABINET ── */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Potrivit pentru cabinet individual și clinici mici de psihologie
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border oc-border bg-white p-6">
              <h3 className="text-xl font-semibold oc-accent">Psiholog independent cu program flexibil</h3>
              <p className="mt-3 leading-relaxed oc-text">
                Dacă lucrezi singur și ai program variabil săptămânal, OcupaLoc se adaptează ușor. Poți activa sau dezactiva zile de lucru,
                seta pauze între ședințe, bloca intervale pentru supervizare sau formare continuă. Clientul vede mereu doar disponibilitatea reală,
                nu o agendă statică. Când ești în concediu, blochezi zilele respective și rezervările nu mai pot fi făcute în acea perioadă.
              </p>
            </article>
            <article className="rounded-xl border oc-border bg-white p-6">
              <h3 className="text-xl font-semibold oc-accent">Cabinet cu mai mulți terapeuți</h3>
              <p className="mt-3 leading-relaxed oc-text">
                Dacă activezi într-un cabinet unde lucrează mai mulți psihoterapeuți, fiecare specialist poate avea cont propriu, link propriu și
                agendă independentă. Nu există o agendă comună care să genereze confuzii. Fiecare terapeut gestionează propriile ședințe, prețuri
                și disponibilitate. Simplu și clar atât pentru clienți, cât și pentru fiecare profesionist în parte.
              </p>
            </article>
          </div>

          <p className="leading-relaxed oc-text">
            Mulți psihologi lucrează și online, nu doar față în față. Poți adăuga servicii separate pentru ședințele desfășurate prin video call,
            cu durate și prețuri diferite față de cele la cabinet. Clientul alege formatul preferat din același link de rezervare. Nu ai nevoie de
            sisteme separate sau linkuri diferite pentru același lucru.
          </p>
        </section>

        {/* ── COMPARATIV ── */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            OcupaLoc față de alte soluții pentru programări cabinet psiholog
          </h2>
          <p className="text-sm oc-secondary-text">
            * Prețurile concurenților sunt estimări publice; verifică întotdeauna pe site-urile lor înainte de orice decizie.
          </p>
          <div className="overflow-hidden rounded-2xl border oc-border">
            <table className="w-full text-left text-sm">
              <thead className="oc-badge-bg oc-text">
                <tr>
                  <th className="px-4 py-3">Caracteristică</th>
                  <th className="px-4 py-3 text-emerald-300">OcupaLoc</th>
                  <th className="px-4 py-3 oc-secondary-text">Mindx</th>
                  <th className="px-4 py-3 oc-secondary-text">PsihoManager</th>
                </tr>
              </thead>
              <tbody>
                {competitorRows.map((row) => (
                  <tr key={row.feature} className="border-t oc-border">
                    <td className="px-4 py-3 oc-text">{row.feature}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-300">{row.ocupaloc}</td>
                    <td className="px-4 py-3 oc-secondary-text">{row.mindx}</td>
                    <td className="px-4 py-3 oc-secondary-text">{row.psihomanager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="leading-relaxed oc-text">
            Diferența principală față de platformele dedicate exclusiv psihologiei este flexibilitatea. Dacă îți extinzi activitatea — un atelier,
            o evaluare de grup sau orice alt serviciu care nu e ședință clasică — OcupaLoc funcționează fără limitări de tip. Nu ești blocat
            într-un sistem construit strict pentru un singur context.
          </p>
        </section>

        {/* ── PRET ── */}
        <section className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 p-8">
          <h2 className="text-3xl font-bold tracking-tight">Cât costă — un preț, fără surprize</h2>
          <p className="mt-4 text-5xl font-black">
            59,99 <span className="text-xl font-medium oc-secondary-text">RON/lună</span>
          </p>
          <p className="mt-3 oc-secondary-text">Fără comision. Fără taxă pe ședință. Fără planuri ascunse.</p>
          <ul className="mt-5 space-y-2 oc-text">
            <li>✓ Servicii nelimitate (ședință individuală, cuplu, evaluare, online)</li>
            <li>✓ Programări nelimitate în fiecare lună</li>
            <li>✓ Pagina ta publică de rezervare</li>
            <li>✓ Notificări automate email la fiecare rezervare</li>
            <li>✓ Configurare program, pauze, zile libere</li>
            <li>✓ Acces pe orice dispozitiv</li>
          </ul>
          <p className="mt-5 leading-relaxed oc-text">
            Dacă faci 40 de ședințe pe lună și o altă platformă ia 3% comision la o ședință medie de 200 RON, plătești în jur de 240 RON lunar
            doar în comisioane. Cu OcupaLoc plătești 59,99 RON indiferent câte ședințe ai. Cu cât agenda ta este mai plină, cu atât avantajul
            modelului cu preț fix este mai mare.
          </p>
          <div className="mt-6">
            <Link
              href="/signup?start=1&tip=psiholog"
              data-cta-location="psiholog_pret_cta"
              className="inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white"
            >
              Test gratuit 14 zile
            </Link>
          </div>
        </section>

        {/* ── CUM INCEPI ── */}
        <section className="space-y-5">
          <h2 className="text-3xl font-bold tracking-tight">
            Cum începi ca psiholog — 3 pași, sub 10 minute
          </h2>
          <ol className="space-y-4">
            <li className="flex gap-4 rounded-xl border oc-border bg-white p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full oc-primary font-bold text-white">1</span>
              <div>
                <p className="font-semibold">Creezi contul și adaugi serviciile</p>
                <p className="mt-1 text-sm oc-secondary-text">
                  Completezi numele cabinetului, adaugi tipurile de ședințe cu duratele și prețurile corespunzătoare. Fiecare serviciu poate
                  avea durată proprie — important pentru un cabinet de psihologie cu formate diverse.
                </p>
              </div>
            </li>
            <li className="flex gap-4 rounded-xl border oc-border bg-white p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full oc-primary font-bold text-white">2</span>
              <div>
                <p className="font-semibold">Setezi programul și primești linkul tău public</p>
                <p className="mt-1 text-sm oc-secondary-text">
                  Configurezi zilele disponibile, orele de lucru și pauzele. Imediat după, primești linkul de tipul{" "}
                  <span className="font-mono oc-text">ocupaloc.ro/numele-tau</span> pe care îl distribui unde dorești.
                </p>
              </div>
            </li>
            <li className="flex gap-4 rounded-xl border oc-border bg-white p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full oc-primary font-bold text-white">3</span>
              <div>
                <p className="font-semibold">Publici linkul și primești primele rezervări</p>
                <p className="mt-1 text-sm oc-secondary-text">
                  Pui linkul în bio Instagram, în Google Business Profile, în semnătura de email sau pe site. Clienții accesează, aleg
                  ședința și rezervă. Tu primești notificare instant la fiecare programare nouă.
                </p>
              </div>
            </li>
          </ol>

          <div className="rounded-2xl border oc-border oc-primary p-6 text-center">
            <p className="text-lg font-semibold">Gata să reduci programările pe WhatsApp?</p>
            <p className="mt-2 text-sm oc-text">
              Configurezi cabinetul în 10 minute. Primești link de rezervare instant. 14 zile gratuit, fără card.
            </p>
            <Link
              href="/signup?start=1&tip=psiholog"
              data-cta-location="psiholog_how_cta"
              className="mt-4 inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white"
            >
              Test gratuit 14 zile
            </Link>
          </div>
        </section>

        {/* ── DE CE ACUM ── */}
        <section className="space-y-4 rounded-2xl border oc-border bg-white p-8">
          <h2 className="text-3xl font-bold tracking-tight">
            De ce digitalizarea programărilor contează pentru un cabinet de psihologie
          </h2>
          <p className="leading-relaxed oc-text">
            Piața de servicii de sănătate mintală din România a crescut semnificativ în ultimii ani. Mai mulți oameni caută psihologi și
            psihoterapeuți, cabinetele independente se înmulțesc, iar concurența pentru vizibilitate online este reală. În acest context,
            modul în care un client poate face prima programare face diferența între a te alege pe tine sau pe altcineva.
          </p>
          <p className="leading-relaxed oc-text">
            Un psiholog care poate fi contactat ușor, care are un flux clar de rezervare și care trimite confirmare automată apare mai profesionist
            și mai accesibil. Nu pentru că este mai bun din punct de vedere clinic, ci pentru că experiența de dinainte de prima ședință este
            mai fluidă. Clienții noi, în special, apreciază claritatea: știu ce durată are ședința, cât costă, unde se desfășoară și că locul
            este confirmat. Toate acestea se pot comunica printr-un sistem de programări online fără niciun efort suplimentar din partea ta.
          </p>
          <p className="leading-relaxed oc-text">
            Pe termen lung, un sistem predictibil de programări înseamnă agendă mai stabilă, mai puțin timp pierdut cu administrarea și mai multă
            energie pentru ceea ce contează cu adevărat: calitatea procesului terapeutic. Investiția de 59,99 RON pe lună este mică față de
            valoarea timpului economisit și față de oportunitatea de a fi mai accesibil pentru clienții noi care ajung la tine în afara
            orelor de program.
          </p>
          <p className="leading-relaxed oc-text">
            Nu ai nevoie de un site complex, de agenție de marketing sau de un sistem sofisticat. Un link clar, publicat în locurile potrivite,
            face cea mai mare parte din muncă. OcupaLoc este tocmai acel link — simplu pentru client, eficient pentru tine.
          </p>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Întrebări frecvente</h2>
          {faqItems.map((item) => (
            <article key={item.question} className="rounded-xl border oc-border bg-white p-5">
              <h3 className="text-lg font-semibold">{item.question}</h3>
              <p className="mt-2 leading-relaxed oc-secondary-text">{item.answer}</p>
            </article>
          ))}
        </section>

        {/* ── FINAL CTA ── */}
        <section className="rounded-2xl border oc-border oc-primary p-8 text-center">
          <h2 className="text-2xl font-bold">Încearcă OcupaLoc gratuit pentru cabinetul tău</h2>
          <p className="mt-3 oc-text">
            14 zile gratuite, fără card, fără obligații. Configurezi serviciile, primești linkul de rezervare și testezi fluxul complet.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup?start=1&tip=psiholog"
              data-cta-location="psiholog_final_primary"
              className="rounded-lg oc-primary px-7 py-3 font-semibold text-white"
            >
              Test gratuit 14 zile
            </Link>
            <Link
              href="/preturi"
              data-cta-location="psiholog_final_preturi"
              className="rounded-lg border oc-border px-7 py-3 font-semibold oc-text hover:oc-badge-bg"
            >
              Vezi prețul complet
            </Link>
          </div>
        </section>

        {/* ── INTERNAL LINKS ── */}
        <nav aria-label="Resurse utile" className="rounded-xl border oc-border bg-white p-5">
          <h2 className="text-xl font-bold">Vezi și:</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {relatedLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

      </div>
    </main>
  );
}
