import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Programări Online Stomatologie | Software Cabinet Dentar | 59,99 RON",
  description:
    "Software de programări online pentru cabinet stomatologic: agendă clară, reamintiri automate, fără comision. Preț fix 59,99 RON/lună, setup în câteva minute.",
  keywords: [
    "programari online stomatologie",
    "software cabinet stomatologic",
    "programari online dentist",
    "aplicatie programari cabinet dentar",
    "agenda online stomatologie"
  ],
  alternates: { canonical: "https://ocupaloc.ro/programari-online-stomatologie" },
  openGraph: {
    title: "Programări Online Stomatologie | OcupaLoc",
    description: "Software pentru cabinet dentar, fără comision, 59,99 RON/lună.",
    url: "https://ocupaloc.ro/programari-online-stomatologie",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Programări Online Stomatologie | OcupaLoc",
    description: "Software pentru cabinet dentar, fără comision, 59,99 RON/lună."
  }
};

const benefits = [
  { title: "Agendă clară pe medic", text: "Vezi programul fiecărei zile dintr-o privire și eviți suprapunerile dintre consultații și tratamente." },
  { title: "Mai puține neprezentări", text: "Reamintirile automate înainte de programare reduc pacienții care uită — esențial pentru un cabinet aglomerat." },
  { title: "Rezervări 24/7", text: "Pacienții își aleg singuri intervalul liber, inclusiv seara, fără să blocheze recepția cu apeluri." },
  { title: "Durate corecte per tratament", text: "Setezi durata pentru consultație, detartraj, obturație sau tratament de canal, ca agenda să fie realistă." },
  { title: "Fără comision", text: "Preț fix 59,99 RON pe lună, indiferent de numărul de programări. Cost predictibil pentru cabinet." },
  { title: "Recepție degrevată", text: "Mai puțin timp la telefon pentru personal și mai mult timp pentru pacientul din cabinet." }
];

const faqItems = [
  {
    question: "Este potrivit software-ul pentru un cabinet stomatologic cu mai mulți medici?",
    answer:
      "Da. Poți organiza serviciile și programul astfel încât să gestionezi un volum mare de programări și să păstrezi agenda echilibrată pe parcursul zilei."
  },
  {
    question: "Cum ajută la reducerea neprezentărilor?",
    answer:
      "Pacientul primește confirmarea programării, iar reamintirile automate înainte de vizită scad semnificativ numărul celor care uită sau întârzie."
  },
  {
    question: "Pot seta durate diferite pentru fiecare tratament?",
    answer:
      "Da. Fiecare serviciu — de la consultație la tratament de canal — poate avea durata și prețul propriu, astfel încât intervalele oferite pacienților să fie realiste."
  },
  {
    question: "Cât costă și există comision pe programare?",
    answer:
      "Prețul este fix: 59,99 RON pe lună, fără comision per programare și fără costuri ascunse, indiferent de câți pacienți rezervă online."
  },
  {
    question: "Cât durează configurarea cabinetului?",
    answer:
      "Câteva minute. Adaugi serviciile cu durată și preț, setezi programul și primești un link public pe care îl pui pe site, Google și social media."
  }
];

const relatedLinks = [
  { href: "/software-programari-clinica", label: "Software programări clinică" },
  { href: "/programari-online-kinetoterapie", label: "Programări online kinetoterapie" },
  { href: "/aplicatie-programari-salon", label: "Aplicație programări salon" },
  { href: "/preturi", label: "Prețuri OcupaLoc" }
];

export default function ProgramariOnlineStomatologiePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: "https://ocupaloc.ro" },
      { "@type": "ListItem", position: 2, name: "Programări online stomatologie", item: "https://ocupaloc.ro/programari-online-stomatologie" }
    ]
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="faq-schema-stomatologie" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="breadcrumb-schema-stomatologie" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-5xl space-y-10">
        <nav aria-label="Breadcrumb" className="text-sm oc-secondary-text">
          <Link href="/" className="hover:underline">Acasă</Link>
          <span className="px-1.5">/</span>
          <span className="oc-text">Programări online stomatologie</span>
        </nav>

        <section className="rounded-2xl border oc-border bg-white p-8">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Programări online pentru cabinet stomatologic</h1>
          <p className="mt-4 text-lg leading-relaxed oc-text">
            OcupaLoc este software-ul de programări online care pune ordine în agenda cabinetului tău dentar: pacienții rezervă singuri,
            recepția nu mai stă la telefon, iar reamintirile automate reduc neprezentările. Fără comision, 59,99 RON pe lună.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup?start=1" data-cta-location="seo_stomatologie_hero_primary" className="rounded-lg oc-primary px-5 py-3 font-semibold text-white">
              Încearcă gratuit
            </Link>
            <Link href="/demo-interactiv" data-cta-location="seo_stomatologie_hero_secondary" className="rounded-lg border oc-border px-5 py-3 font-semibold oc-text hover:oc-badge-bg">
              Vezi demo
            </Link>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border oc-border bg-white p-8">
          <h2 className="text-3xl font-bold">De ce un cabinet stomatologic are nevoie de programări online</h2>
          <p className="leading-relaxed oc-text">
            Într-un cabinet dentar, timpul este resursa cea mai prețioasă. O programare ratată sau o suprapunere între o consultație și un
            tratament lung dă peste cap toată ziua. Când rezervările vin doar prin telefon, recepția devine un blocaj: pacientul din scaun
            așteaptă, telefonul sună, iar erorile de agendă apar inevitabil. Programările online mută acest proces într-un flux clar, în care
            pacientul alege singur intervalul potrivit și primește confirmare imediată.
          </p>
          <p className="leading-relaxed oc-text">
            Cel mai mare câștig pentru un cabinet stomatologic este reducerea neprezentărilor. Un loc liber neanunțat înseamnă timp de medic
            pierdut, care nu se mai recuperează. Reamintirile automate trimise înainte de vizită scad considerabil numărul pacienților care
            uită sau întârzie. Practic, agenda devine mai predictibilă, iar gradul de ocupare al scaunului crește.
          </p>
          <p className="leading-relaxed oc-text">
            Un al doilea avantaj este precizia duratelor. În stomatologie, serviciile diferă enorm: o consultație durează câteva minute, un
            detartraj ceva mai mult, iar un tratament de canal poate ocupa o oră întreagă. Când fiecare serviciu are durata setată corect,
            intervalele propuse pacienților sunt realiste și eviți întârzierile în lanț. Ziua curge ordonat, fără presiune inutilă pe echipă.
          </p>
          <p className="leading-relaxed oc-text">
            Disponibilitatea non-stop schimbă și ea jocul. Mulți pacienți decid să-și programeze o vizită seara, după program, sau în weekend.
            Dacă singura cale de rezervare este telefonul în orele de lucru, pierzi exact acești pacienți. Cu un link public de programare,
            cabinetul tău primește rezervări la orice oră, fără să implice personalul de la recepție.
          </p>
          <p className="leading-relaxed oc-text">
            Nu în ultimul rând, contează costul predictibil. Modelul fără comision înseamnă că plătești 59,99 RON fix pe lună, indiferent câți
            pacienți rezervă online. Pentru un cabinet care vrea să crească, această claritate financiară este importantă: investești în
            aparatură și echipă, nu în taxe pe fiecare programare.
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
