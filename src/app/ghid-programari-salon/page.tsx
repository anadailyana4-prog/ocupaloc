import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Ghid Complet Programări Salon [2025] | Software Românesc Fără Comision",
  description:
    "Ghid complet pentru digitalizarea programărilor în salon: cum să alegi software, cum să reduci no-show-urile, marketing gratuit și creștere fără comision. Tutorial pas cu pas.",
  alternates: { canonical: "https://ocupaloc.ro/ghid-programari-salon" },
  openGraph: {
    url: "https://ocupaloc.ro/ghid-programari-salon",
    title: "Ghid Complet Programări Salon | Software Românesc 2025",
    description: "Tutorial complet pentru digitalizarea programărilor. Fără comision, 59.99 RON/lună."
  }
};

const tableOfContents = [
  { id: "intro", title: "De ce programări online în 2025?" },
  { id: "alegere", title: "Cum alegi software-ul potrivit" },
  { id: "implementare", title: "Implementare pas cu pas" },
  { id: "reducere-noshow", title: "Cum reduci no-show-urile cu 70%" },
  { id: "marketing", title: "Marketing gratuit pentru saloane" },
  { id: "comparatie", title: "Comparație: comision vs abonament fix" },
  { id: "faq", title: "Întrebări frecvente" }
];

const relatedLinks = [
  { href: "/aplicatie-programari-frizerie", label: "Programări frizerie" },
  { href: "/software-programari-manichiura", label: "Software manichiură" },
  { href: "/programari-online-cosmetica", label: "Programări cosmetică" },
  { href: "/preturi", label: "Prețuri OcupaLoc" },
  { href: "/demo-interactiv", label: "Demo interactiv" }
];

export default function GhidProgramariSalonPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Ghid Complet Programări Salon 2025",
    description: "Tutorial complet pentru digitalizarea programărilor în salon",
    author: { "@type": "Organization", name: "OcupaLoc" },
    publisher: {
      "@type": "Organization",
      name: "OcupaLoc",
      logo: { "@type": "ImageObject", url: "https://ocupaloc.ro/og-image.svg" }
    },
    datePublished: "2025-01-01",
    dateModified: "2025-01-01"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Cât costă un software de programări pentru salon?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prețurile variază între 0 și 300+ RON/lună. Modelele cu comision per programare pot ajunge la 600+ RON lunar pentru saloane aglomerate. OcupaLoc oferă un abonament fix de 59.99 RON/lună fără comision, indiferent de numărul de programări."
        }
      },
      {
        "@type": "Question",
        name: "Cât durează implementarea programărilor online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Implementarea durează între 30 minute și 2 ore. Configurarea inițială include adăugarea serviciilor, stabilirea programului de lucru și personalizarea paginii de rezervare. După configurare, primele programări pot fi primite imediat."
        }
      },
      {
        "@type": "Question",
        name: "Pot importa clienții existenți?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da, majoritatea platformelor permit importul clienților din Excel sau CSV. OcupaLoc oferă import gratuit al bazei de clienți pentru a facilita tranziția de la agendă fizică sau alte sisteme."
        }
      },
      {
        "@type": "Question",
        name: "Programările online reduc no-show-urile?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Da, programările online pot reduce no-show-urile cu până la 70% prin confirmări automate prin email și reminder-e înainte de programare. Clienții care rezervă online sunt mai angajați și au informațiile clare despre serviciu, oră și locație."
        }
      },
      {
        "@type": "Question",
        name: "Este sigur să folosesc un software românesc?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Software-ul românesc are avantaje clare: suport în limba română, facturare în RON, conformitate cu GDPR și înțelegerea specificului pieței locale. OcupaLoc oferă toate acestea plus servere în UE pentru protecția datelor."
        }
      }
    ]
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id="article-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Script id="faq-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Ghid Complet: Digitalizarea Programărilor în Salon
          </h1>
          <p className="text-xl oc-secondary-text max-w-2xl mx-auto">
            Tot ce trebuie să știi pentru a trece de la agendă fizică la programări online. 
            Fără comision, cu cost fix predictibil.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <Link href="/signup?start=1" className="rounded-lg oc-primary px-6 py-3 font-semibold text-white">
              Începe gratuit 14 zile
            </Link>
            <Link href="/demo-interactiv" className="rounded-lg border oc-border px-6 py-3 font-semibold hover:oc-badge-bg">
              Vezi demo
            </Link>
          </div>
        </header>

        {/* Table of Contents */}
        <nav className="rounded-2xl border oc-border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Cuprins</h2>
          <ol className="space-y-2">
            {tableOfContents.map((item, index) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm hover:oc-accent flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full oc-badge-bg flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Section 1: Intro */}
        <section id="intro" className="space-y-4">
          <h2 className="text-3xl font-bold">De ce programări online în 2025?</h2>
          <p className="leading-relaxed oc-text">
            Piața serviciilor de înfrumusețare s-a schimbat fundamental în ultimii ani. Clienții moderni 
            așteaptă să poată rezerva servicii la fel de ușor cum comandă mâncare sau caută transport. 
            Un salon fără programări online pierde clienți în fiecare zi — nu pentru că serviciile nu sunt bune, 
            ci pentru că procesul de rezervare este prea complicat.
          </p>
          <p className="leading-relaxed oc-text">
            Statisticile arată clar: 78% dintre clienții de saloane preferă să rezerve online 
            în loc să sune. Motivele sunt simple: pot vedea disponibilitatea reală, pot compara servicii și prețuri, 
            și pot rezerva în orice moment, chiar și la miezul nopții când salonul este închis.
          </p>
          <p className="leading-relaxed oc-text">
            Pentru proprietarii de saloane, beneficiile sunt la fel de importante: agendă organizată, 
            mai puține întreruperi telefonice, reduceri no-show și date clare despre performanță. 
            Un software de programări bine ales devine un angajat digital care lucrează 24/7.
          </p>
          <div className="rounded-xl border oc-border oc-badge-bg p-4 mt-4">
            <p className="text-sm font-medium oc-accent">
              💡 Fapt: Saloanele cu programări online procesează în medie cu 35% mai mulți clienți 
              decât cele care funcționează doar pe telefon.
            </p>
          </div>
        </section>

        {/* Section 2: Alegere */}
        <section id="alegere" className="space-y-4">
          <h2 className="text-3xl font-bold">Cum alegi software-ul potrivit</h2>
          
          <h3 className="text-xl font-semibold mt-6">1. Modelul de preț: comision vs abonament</h3>
          <p className="leading-relaxed oc-text">
            Există două modele principale pe piață: platforme cu comision per programare și soluții SaaS 
            cu abonament fix. Alegerea corectă depinde de volumul și specificul salonului tău.
          </p>
          <p className="leading-relaxed oc-text">
            <strong>Platforme cu comision:</strong> Par atractive la început pentru că au intrare gratuită sau 
            cost lunar mic. Dar comisionul de 10-20% per programare crește direct odată cu succesul tău. 
            Dacă treci de la 50 la 150 programări pe lună, costul se triplează. Acest model te taxează 
            tocmai când business-ul merge bine.
          </p>
          <p className="leading-relaxed oc-text">
            <strong>Abonament fix:</strong> Costul este predictibil — 59.99 RON lunar indiferent de câte 
            programări ai. Diferența de cost pe termen mediu poate ajunge la mii de lei anual. 
            Plus că păstrezi datele clienților și controlul brandului.
          </p>

          <h3 className="text-xl font-semibold mt-6">2. Funcționalități esențiale</h3>
          <ul className="space-y-2 list-disc list-inside">
            <li><strong>Program flexibil:</strong> Poți seta intervale diferite pentru fiecare zi și angajat</li>
            <li><strong>Servicii configurabile:</strong> Durate, prețuri, descrieri clare pentru fiecare serviciu</li>
            <li><strong>Confirmări automate:</strong> Email sau SMS la rezervare și reminder înainte de programare</li>
            <li><strong>Blocare clienți:</strong> Posibilitatea de a bloca clienții care nu se prezintă repetat</li>
            <li><strong>Export date:</strong> Poți exporta lista de clienți și istoricul oricând</li>
            <li><strong>Suport în română:</strong> Când ai probleme, comunicarea în limba maternă contează</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">3. Testarea înainte de decizie</h3>
          <p className="leading-relaxed oc-text">
            Orice platformă serioasă oferă perioadă de probă. Folosește aceste 7-14 zile pentru a testa 
            scenarii reale: programează-te ca și cum ai fi client, trimite link-ul unui prieten pentru feedback, 
            verifică cum arată confirmările. Un software bun se simte intuitiv de la prima utilizare.
          </p>
        </section>

        {/* Section 3: Implementare */}
        <section id="implementare" className="space-y-4">
          <h2 className="text-3xl font-bold">Implementare pas cu pas</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full oc-primary flex items-center justify-center text-white font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold">Configurarea profilului</h3>
                <p className="text-sm oc-secondary-text">Adaugă numele salonului, adresa, numărul de telefon și logo. Aceste informații apar în confirmările clienților.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full oc-primary flex items-center justify-center text-white font-bold shrink-0">2</div>
              <div>
                <h3 className="font-semibold">Adăugarea serviciilor</h3>
                <p className="text-sm oc-secondary-text">Pentru fiecare serviciu (tuns, vopsit, manichiură) setează durata realistă, prețul și o descriere clară. Durata trebuie să includă și timpul de pregătire.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full oc-primary flex items-center justify-center text-white font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold">Stabilirea programului</h3>
                <p className="text-sm oc-secondary-text">Setează orele de lucru pentru fiecare zi. Poți adăuga pauze pentru masă și zile libere. Fii realist — mai bine să prelungești un interval decât să întârzii.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full oc-primary flex items-center justify-center text-white font-bold shrink-0">4</div>
              <div>
                <h3 className="font-semibold">Testarea fluxului</h3>
                <p className="text-sm oc-secondary-text">Programează-te singur ca și cum ai fi client. Verifică ce mesaje primești, cum arată confirmările, dacă sloturile sunt calculate corect.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full oc-primary flex items-center justify-center text-white font-bold shrink-0">5</div>
              <div>
                <h3 className="font-semibold">Distribuirea link-ului</h3>
                <p className="text-sm oc-secondary-text">Pune link-ul de rezervare în bio Instagram, pe Facebook, în semnătura email și în mesajele WhatsApp cu clienții noi.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Reducere no-show */}
        <section id="reducere-noshow" className="space-y-4">
          <h2 className="text-3xl font-bold">Cum reduci no-show-urile cu 70%</h2>
          <p className="leading-relaxed oc-text">
            No-show-urile (clienții care nu se prezintă) sunt una dintre cele mai mari pierderi pentru saloane. 
            Un slot liber înseamnă venit pierdut care nu poate fi recuperat. Iată strategiile testate 
            care reduc no-show-urile dramatic:
          </p>

          <h3 className="text-xl font-semibold mt-4">1. Confirmări automate</h3>
          <p className="leading-relaxed oc-text">
            Trimite email de confirmare imediat după rezervare. Mesajul trebuie să conțină toate detaliile: 
            serviciu, dată, oră, adresă și eventual hartă. Când clientul confirmă (click pe un link), 
            angajamentul psihologic crește semnificativ.
          </p>

          <h3 className="text-xl font-semibold mt-4">2. Reminder-e strategice</h3>
          <p className="leading-relaxed oc-text">
            Trimite reminder cu 24 de ore înainte și încă unul cu 2-3 ore înainte. Studiile arată că 
            combinația 24h + 2h reduce no-show-urile cu până la 60%. Mesajul scurt:{' '}
            &ldquo;Mâine la 14:00 ai programare la Salon X pentru serviciul Y. Confirmă sau anulează aici: [link]&rdquo;
          </p>

          <h3 className="text-xl font-semibold mt-4">3. Politică de anulare clară</h3>
          <p className="leading-relaxed oc-text">
            Comunică explicit că anulările trebuie făcute cu minim 24h înainte. Pentru clienții cu 
            istoric de no-show, poți cere confirmare telefonică sau depozit. Nu fi agresiv, dar ferm.
          </p>

          <h3 className="text-xl font-semibold mt-4">4. Lista de așteptare</h3>
          <p className="leading-relaxed oc-text">
            Oferă clienților opțiunea de a se înscrie pe listă de așteptare pentru sloturi ocupate. 
            Când apare o anulare, automat trimite mesaj primului de pe listă. Astfel transformi 
            no-show în oportunitate.
          </p>

          <div className="rounded-xl border oc-border oc-badge-bg p-4 mt-4">
            <p className="text-sm font-medium oc-accent">
              📊 Studiu de caz: Un salon din București a redus no-show-urile de la 18% la 4% 
              în 3 luni folosind confirmări automate + reminder-e + politică de anulare clară.
            </p>
          </div>
        </section>

        {/* Section 5: Marketing */}
        <section id="marketing" className="space-y-4">
          <h2 className="text-3xl font-bold">Marketing gratuit pentru saloane</h2>
          <p className="leading-relaxed oc-text">
            Nu ai nevoie de buget mare pentru a atrage clienți. Iată 5 strategii gratuite 
            care funcționează pentru saloanele mici și mijlocii:
          </p>

          <h3 className="text-xl font-semibold mt-4">1. Optimizarea profilului Google</h3>
          <p className="leading-relaxed oc-text">
            Google Business Profile este cel mai important canal gratuit. Completează toate câmpurile, 
            adaugă poze recente (minim 10), răspunde la toate recenziile și postează actualizări săptămânale. 
            84% dintre clienți caută pe Google înainte să aleagă un salon.
          </p>

          <h3 className="text-xl font-semibold mt-4">2. Recomandări și loyalty</h3>
          <p className="leading-relaxed oc-text">
            Oferă discount 10% la următoarea vizită pentru clienții care recomandă un prieten. 
            Cel mai bun marketing este cel făcut de clienți mulțumiți. Implementează un card de fidelitate 
            simplu: la 5 vizite, a 6-a gratuită sau cu 50% discount.
          </p>

          <h3 className="text-xl font-semibold mt-4">3. Conținut pe social media</h3>
          <p className="leading-relaxed oc-text">
            Postează înainte/după (cu acordul clientului), sfaturi de îngrijire și behind the scenes. 
            Folosește hashtag-uri locale (#frizeriebucuresti, #coaforcluj). Consistența contează mai mult 
            decât calitatea profesională — 3 postări/săptămână moderate bat o postare perfectă pe lună.
          </p>

          <h3 className="text-xl font-semibold mt-4">4. Colaborări locale</h3>
          <p className="leading-relaxed oc-text">
            Parteneriază cu business-uri complementare: florării pentru mame, cafenele pentru locuitori, 
            magazine de haine. Oferte cross-promotion: &ldquo;Prezintă bonul de la [partener] și primești 10% discount&rdquo;.
          </p>

          <h3 className="text-xl font-semibold mt-4">5. SEO local</h3>
          <p className="leading-relaxed oc-text">
            Asigură-te că site-ul salonului (sau pagina de rezervare) conține numele orașului și 
            cartierului. Creează conținut despre &ldquo;tuns în [cartier]&rdquo; sau &ldquo;manichiură aproape de [landmark local]&rdquo;. 
            Google prioritizează rezultatele locale.
          </p>
        </section>

        {/* Section 6: Comparație */}
        <section id="comparatie" className="space-y-4">
          <h2 className="text-3xl font-bold">Comparație: comision vs abonament fix</h2>
          <p className="leading-relaxed oc-text">
            Să facem calculele pentru un salon mediu din România:
          </p>

          <div className="rounded-xl border oc-border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="oc-badge-bg">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Scenariu</th>
                  <th className="px-4 py-3 text-left font-semibold">Platformă cu comision 15%</th>
                  <th className="px-4 py-3 text-left font-semibold">OcupaLoc (59.99 RON fix)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t oc-border">
                  <td className="px-4 py-3">50 programări/lună × 100 RON</td>
                  <td className="px-4 py-3">750 RON comision</td>
                  <td className="px-4 py-3 font-medium oc-accent">59.99 RON</td>
                </tr>
                <tr className="border-t oc-border">
                  <td className="px-4 py-3">100 programări/lună × 100 RON</td>
                  <td className="px-4 py-3">1,500 RON comision</td>
                  <td className="px-4 py-3 font-medium oc-accent">59.99 RON</td>
                </tr>
                <tr className="border-t oc-border">
                  <td className="px-4 py-3">200 programări/lună × 100 RON</td>
                  <td className="px-4 py-3">3,000 RON comision</td>
                  <td className="px-4 py-3 font-medium oc-accent">59.99 RON</td>
                </tr>
                <tr className="border-t oc-border oc-badge-bg font-semibold">
                  <td className="px-4 py-3">Economie anuală (100 prog/lună)</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3 oc-accent">~17,280 RON economisiți</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="leading-relaxed oc-text mt-4">
            Diferența este clară: cu cât salonul crește, cu atât avantajul abonamentului fix devine mai mare. 
            Banii economisiți pot fi reinvestiți în training, marketing sau amenajare — nu în comisioane.
          </p>
        </section>

        {/* Section 7: FAQ */}
        <section id="faq" className="space-y-4">
          <h2 className="text-3xl font-bold">Întrebări frecvente</h2>
          
          <div className="space-y-4">
            <details className="rounded-xl border oc-border bg-white p-5">
              <summary className="font-semibold cursor-pointer">Cât costă un software de programări pentru salon?</summary>
              <p className="mt-3 text-sm oc-secondary-text leading-relaxed">
                Prețurile variază între 0 și 300+ RON/lună. Modelele cu comision per programare pot ajunge la 600+ RON lunar pentru saloane aglomerate. OcupaLoc oferă un abonament fix de 59.99 RON/lună fără comision, indiferent de numărul de programări.
              </p>
            </details>

            <details className="rounded-xl border oc-border bg-white p-5">
              <summary className="font-semibold cursor-pointer">Cât durează implementarea programărilor online?</summary>
              <p className="mt-3 text-sm oc-secondary-text leading-relaxed">
                Implementarea durează între 30 minute și 2 ore. Configurarea inițială include adăugarea serviciilor, stabilirea programului de lucru și personalizarea paginii de rezervare. După configurare, primele programări pot fi primite imediat.
              </p>
            </details>

            <details className="rounded-xl border oc-border bg-white p-5">
              <summary className="font-semibold cursor-pointer">Pot importa clienții existenți?</summary>
              <p className="mt-3 text-sm oc-secondary-text leading-relaxed">
                Da, majoritatea platformelor permit importul clienților din Excel sau CSV. OcupaLoc oferă import gratuit al bazei de clienți pentru a facilita tranziția de la agendă fizică sau alte sisteme.
              </p>
            </details>

            <details className="rounded-xl border oc-border bg-white p-5">
              <summary className="font-semibold cursor-pointer">Programările online reduc no-show-urile?</summary>
              <p className="mt-3 text-sm oc-secondary-text leading-relaxed">
                Da, programările online pot reduce no-show-urile cu până la 70% prin confirmări automate prin email și reminder-e înainte de programare. Clienții care rezervă online sunt mai angajați și au informațiile clare despre serviciu, oră și locație.
              </p>
            </details>

            <details className="rounded-xl border oc-border bg-white p-5">
              <summary className="font-semibold cursor-pointer">Este sigur să folosesc un software românesc?</summary>
              <p className="mt-3 text-sm oc-secondary-text leading-relaxed">
                Software-ul românesc are avantaje clare: suport în limba română, facturare în RON, conformitate cu GDPR și înțelegerea specificului pieței locale. OcupaLoc oferă toate acestea plus servere în UE pentru protecția datelor.
              </p>
            </details>
          </div>
        </section>

        {/* CTA Final */}
        <section className="rounded-2xl border oc-border oc-primary p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Gata să digitalizezi programările?</h2>
          <p className="mb-6 max-w-xl mx-auto">
            Începe cu 14 zile gratuite. Fără comision, fără card, fără obligații. 
            Setup în 15 minute, rezultate imediate.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signup?start=1" className="rounded-lg oc-primary px-6 py-3 font-semibold text-white">
              Creează cont gratuit
            </Link>
            <Link href="/demo-interactiv" className="rounded-lg border oc-border bg-white px-6 py-3 font-semibold hover:oc-badge-bg">
              Vezi demo interactiv
            </Link>
          </div>
        </section>

        {/* Related Links */}
        <section className="rounded-xl border oc-border bg-white p-6">
          <h3 className="text-xl font-bold mb-4">Resurse conexe</h3>
          <div className="flex flex-wrap gap-3">
            {relatedLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
