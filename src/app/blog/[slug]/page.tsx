import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

type Post = {
  slug: string;
  title: string;
  description: string;
  content: string;
  publishedDate: string;
  relatedLandingLinks: Array<{ href: string; label: string }>;
};

const POSTS: Post[] = [
  {
    slug: "ghid-seo-saloane-romania",
    title: "SEO pentru saloane: cum să apari pe Google în 2025",
    description: "Ghid complet de SEO local pentru saloane beauty din România. Optimizare Google Business, keywords și strategii de conținut.",
    publishedDate: "2026-05-20",
    relatedLandingLinks: [
      { href: "/ghid-programari-salon", label: "Ghid complet programări" },
      { href: "/programari-online-salon", label: "Programări online salon" }
    ],
    content: `
SEO local este cel mai puternic instrument gratuit pentru atragerea clienților noi. Când cineva caută "frizerie aproape de mine" sau "manichiură [cartier]", Google arată rezultate locale prioritizate. Iată cum să optimizezi prezența salonului tău.

Primul pas este Google Business Profile. Completează toate câmpurile: nume, adresă exactă, număr de telefon, program, website și categorii. Adaugă minimum 10 poze de calitate — interior, exterior, echipa, servicii. Postează actualizări săptămânale cu oferte sau noutăți.

Al doilea pas este gestionarea recenziilor. Răspunde la TOATE recenziile, pozitive și negative. Mulțumește clienților mulțumiți și oferă soluții celor nemulțumiți. Recenziile sunt factorul #1 pentru ranking local.

Al treilea pas este conținutul pe site. Creează pagini dedicate pentru fiecare serviciu și locație. Exemple: "Tuns barbati București", "Manichiură cu gel Cluj", "Cosmetică facială Timișoara". Fiecare pagină trebuie să aibă minim 500 cuvinte, title optimizat și meta description.

Al patrulea pas sunt listările locale (citations). Asigură-te că datele salonului (Nume, Adresă, Telefon) sunt identice peste tot: Facebook, Instagram, Directoare locale, Pagini Aurii. Consistența contează enorm pentru Google.

Al cincilea pas este link building local. Colaborează cu bloguri locale, participă la evenimente comunitare și obține mențiuni în presa locală. Un link de la un site .ro relevant valorează mai mult decât 10 linkuri de pe site-uri străine.

Rezultatele SEO nu apar peste noapte. Dă-i 3-6 luni de optimizare consecventă. Dar odată ce ajungi în top 3, traficul și clienții devin organici și practic gratuiti.

Monitorizează progresul cu Google Search Console (gratuit). Vezi pentru ce cuvinte cheie apari, CTR-ul și poziția medie. Optimizează paginile cu bounce rate mare și extinde conținutul pentru cuvintele unde ești pe pagina 2 (pozițiile 11-20).

SEO local e un maraton, nu un sprint. Dar e cel mai bun ROI pe termen lung pentru orice salon.
`,
  },
  {
    slug: "cum-sa-cresti-salon-fara-buget",
    title: "Cum să crești un salon fără buget de marketing",
    description: "Strategii gratuite și tacticile eficiente pentru creșterea unui salon cu buget zero.",
    publishedDate: "2026-05-18",
    relatedLandingLinks: [
      { href: "/ghid-programari-salon", label: "Ghid complet" },
      { href: "/demo-interactiv", label: "Demo gratuit" }
    ],
    content: `
Creșterea unui salon nu necesită întotdeauna investiții mari în reclame. Iată strategii testate și gratuite care funcționează în România.

Strategia 1: Referral loops. Oferă 10% discount la următoarea vizită pentru clienții care recomandă un prieten. Cel mai bun marketing e cel făcut de clienții mulțumiți. Implementează un card de fidelitate simplu: la 5 vizite, a 6-a cu 50% reducere.

Strategia 2: Parteneriate locale. Identifică 5 business-uri complementare din zonă: cafenele, florării, magazine de cosmetice, săli de fitness, spații de coworking. Propune cross-promotion: pune-ți flyere la ei, ei pun la tine. Oferă discount reciproc clienților.

Strategia 3: Content organic. Postează înainte/după pe Instagram și Facebook (cu acordul clientului). Arată procesul, nu doar rezultatul. Folosește hashtag-uri locale: #[oraș] #[cartier] #[serviciu][oraș]. Consistența bate perfecțiunea — 3 postări/săptămână moderate > 1 postare perfectă/lună.

Strategia 4: Zile deschise și evenimente. Organizează o dată pe lună o "Zi a Frumuseții" cu consultații gratuite și demo-uri. Invită influenceri locali mici (micro-influenceri cu 1k-10k followers). Cost: doar timpul tău.

Strategia 5: Email marketing (gratuit cu Resend sau Brevo). Colectează emailuri de la clienți și trimite lunar un newsletter cu tips, oferte exclusive și noutăți. Segmentează lista: clienți noi vs. clienți inactivi vs. clienți fideli.

Strategia 6: Optimizarea programului. Analizează orele aglomerate și cele goale. Oferă discounturi mici (10-15%) pentru sloturile slabe (luni dimineață, după-amiaza de marți). Astfel crești volumul fără să reducem prețul la orele de vârf.

Strategia 7: Upsell și cross-sell natural. „Doriti și o manichiură? Avem o oră disponibilă.” Sau: „Pentru doar 20 lei în plus, putem adăuga și tratamentul de hidratare.” 30% din clienți acceptă când oferta e făcută natural, la momentul potrivit.

Măsoară tot. Urmărește de unde vin clienții noi (întreabă-i la fiecare vizită). Dublează ce funcționează, abandonează ce nu aduce rezultate. Creșterea e suma tacticilor mici care funcționează, nu a unei strategii miraculoase.
`,
  },
  {
    slug: "retentie-clienti-salon",
    title: "Retenția clienților: cum să îi faci să revină",
    description: "Strategii pentru creșterea ratei de returență a clienților în salonul tău.",
    publishedDate: "2026-05-15",
    relatedLandingLinks: [
      { href: "/programari-online-salon", label: "Programări salon" },
      { href: "/preturi", label: "Prețuri" }
    ],
    content: `
A păstra un client existent costă de 5-25 ori mai puțin decât a atrage unul nou. Iată cum să maximizezi returența în salonul tău.

Principiul 1: Experiența contează mai mult decât serviciul. Clienții uită ce serviciu au primit, dar nu uită cum s-au simțit. Salut cald, ofertă de băutură, conversație autentică, la revedere cu zâmbet. Detaliile mici fac diferența.

Principiul 2: Programarea următoare înainte de plecare. &quot;Când vrei să ne revedem?&quot; e mult mai eficient decât a aștepta ca ei să sune. 60% din clienți acceptă să programeze imediat. Folosește programări online pentru a face procesul instant.

Principiul 3: Reminder-e personale. &quot;Bună [Nume], au trecut 6 săptămâni de la ultima vopsire. E timpul pentru retușuri?&quot; Mesaje personalizate, nu generice. Folosește istoricul din software-ul de programări.

Principiul 4: Program de fidelitate simplu. Nu complica: &quot;La a 6-a vizită, 50% reducere&quot; sau &quot;Recomandă un prieten, primiți amândoi 10% la următoarea vizită&quot;. Recompensează comportamentul dorit.

Principiul 5: Surprinde plăcut. O cafea gratuită, un eșantion de produs, o ședință rapidă de masaj capilar bonus. Cost mic, impact emoțional mare. Oamenii vorbesc despre experiențele pozitive neașteptate.

Principiul 6: Gestionează nemulțumirile imediat. Un client nemulțumit care primește soluție rapidă devine mai loial decât unul care n-a avut niciodată problemă. Oferă re-programare gratuită, discount sau serviciu bonus. Recunoaște greșeala.

Principiul 7: Segmentare și comunicare diferențiată. Clienți noi primesc &quot;bun venit&quot; și tips. Clienți fideli primesc acces exclusiv la noutăți. Clienți inactivi (3+ luni) primesc &quot;Te-am pierdut?&quot; cu ofertă specială.

Principiul 8: Creează comunitate. Grup de WhatsApp sau Facebook cu clienții fideli unde postezi tips, behind-the-scenes și oferte exclusive. Oamenii se simt speciali când fac parte dintr-un &quot;club&quot;.

Măsoară retenția: ce procent din clienții din luna trecută au revenit în luna curentă? Target: 40-50% pentru saloanele bune. Dacă e sub 30%, undeva există o problemă în experiență.

Retenția e motorul profitabilității. Focusează-te pe ea înainte să arunci bani în atragerea de clienți noi.
`,
  },
  {
    slug: "ghid-fiscal-salon-romania",
    title: "Ghid fiscal pentru saloane în România 2025",
    description: "Tot ce trebuie să știi despre taxe, impozite și obligații fiscale pentru salonul tău.",
    publishedDate: "2026-05-12",
    relatedLandingLinks: [
      { href: "/preturi", label: "Prețuri OcupaLoc" },
      { href: "/software-programari-clinica", label: "Software clinică" }
    ],
    content: `
Aspectele fiscale sunt adesea neglijate de antreprenorii din beauty, dar ele determină viabilitatea pe termen lung. Iată ce trebuie să știi în 2025.

Forme de organizare:

1. PFA (Persoană Fizică Autorizată): Cel mai simplu pentru început. Contribuții: CAS 25%, CASS 10%, impozit pe venit 10% pe diferența dintre venituri și cheltuieli deductibile. Contabilitate simplificată.

2. SRL cu asociat unic: Mai multă flexibilitate, separare clară între patrimoniu personal și business. Impozit pe profit 16%, dividende 8%, CAS/CASS pe salarii. Recomandat de la cifre de afaceri medii în sus.

3. SRL cu impozit pe venit (microîntreprindere): 1% sau 3% pe venituri (în funcție de numărul de angajați). Avantajos până la ~500.000 RON/an, apoi obligatoriu trecerea la impozit pe profit.

Cheltuieli deductibile în salon:
- Chirie și utilități (proporțional cu suprafața folosită)
- Produse și consumabile (șampon, vopsea, lac, etc.)
- Echipamente și mobilier (amortizare în 3-5 ani)
- Training și cursuri (100% deductibil)
- Software și abonamente (inclusiv OcupaLoc la 59.99 RON/lună)
- Marketing și publicitate
- Transport și diurne (pentru evenimente, training)

Cheltuieli NEDUCTIBILE:
- Amenzi și penalități
- Cheltuieli de protocol (decontări cu deducere limitată)
- Îmbrăcăminte personală (decât dacă e obligatorie uniformă cu logo)

TVA: Obligatoriu înregistrare la 300.000 RON/an. Opțională înainte. Majoritatea saloanelor mici nu sunt plătitoare de TVA, ceea ce simplifică contabilitatea.

Salarii și angajați:
- Contract de muncă: Brut = Net + CAS (25%) + CASS (10%) + Impozit (10% pe brut - CAS - CASS - deducere personală)
- Venituri din activități independente: Angajații care vin cu clienții lor pot avea contracte PFA separate.

Documente obligatorii:
- Registru de evidență a salariaților
- Fișe de post pentru fiecare angajat
- Echipamente de protecție (mănuși, halate)
- Autorizație sanitară de funcționare (de la DSP)
- Aviz ISU (pentru spații >200 mp sau cu public numeros)

Software-ul de programări te ajută fiscal:
- Evidență electronică a încasărilor (jurnal obligatoriu pentru ANAF)
- Rapoarte de venituri pe servicii, angajați, perioade
- Export date pentru contabil
- Reducerea erorilor de evidență

Recomandare: Angajează un contabil sau colaborează cu o firmă de contabilitate (200-500 RON/lună). Economiile fiscale și evitarea problemelor merită investiția.

Nu lăsa fiscalitatea pe ultimul loc. Un salon bine organizat fiscal supraviețuiește și în perioade dificile.
`,
  },
  {
    slug: "fresha-cat-costa-romania",
    title: "Cât te costă platformele cu comision și ce variantă e mai sănătoasă",
    description: "Analiză de cost, marjă și profit pentru saloane care folosesc programari online.",
    publishedDate: "2025-03-10",
    relatedLandingLinks: [
      { href: "/preturi", label: "Prețuri OcupaLoc" },
      { href: "/programari-online-salon", label: "Programări online salon" }
    ],
    content: `
Multe saloane aleg platforme pe comision pentru programari online fiindcă par simple la început. Problema apare când volumul crește, iar costul variabil începe să consume marja. În România, unde costurile operaționale cresc constant, predictibilitatea este critică.

Un software salon pe comision taxează performanța. Cu cât ai mai multe rezervări, cu atât plătești mai mult. Dacă faci 60 de programări și comisionul mediu este în jur de 10 RON, ajungi la aproximativ 600 RON lunar. Dacă urci la 120 programări, costul aproape se dublează. În modelul cu 59,99 RON fără comision, costul rămâne fix.

Diferența de cost nu este doar contabilă, ci strategică. Banii economisiți pot susține training, marketing local sau investiții în experiența din salon. Asta înseamnă creștere care rămâne în business, nu într-o taxă care crește odată cu succesul.

Mai există costuri ascunse: timp pierdut pe clarificări, lipsă de suport local și fricțiuni de comunicare. Când ai software salon adaptat pieței locale, cu suport în română și plăți în RON, operaționalul devine mai simplu.

Din perspectiva brandului, programari online ar trebui să consolideze relația directă cu clientul. Dacă procesul de rezervare este clar și coerent cu identitatea salonului, fidelizarea crește și clientul revine mai ușor.

Migrarea poate fi făcută etapizat: setezi serviciile principale, configurezi programul, publici link-ul în canalele active și imporți baza de clienți. În două săptămâni, de regulă, fluxul devine stabil.

Pe termen lung, diferența dintre comision și abonament fix poate însemna mii de lei economisiți anual. Aceste sume pot fi reinvestite în proiecte cu impact real. Pentru multe saloane, modelul 59,99 RON fără comision este o alegere de business mai sănătoasă.

Concluzia este clară: dacă vrei control financiar și creștere sustenabilă, programari online cu cost fix și software salon local reprezintă o fundație mai bună decât un model taxat per rezervare.

În practică, saloanele care fac această tranziție observă nu doar economie, ci și mai mult control. Când știi exact costul lunar, poți planifica mai bine campanii, bugete și obiective.

Alegerea platformei nu este doar o decizie tehnică. Este o alegere de model economic: plătești mai mult când crești, sau păstrezi valoarea creată în salonul tău.
`,
  },
  {
    slug: "cum-sa-reduci-anularile",
    title: "Cum să reduci anulările și no-show-urile în salon",
    description: "Ghid practic pentru reducerea no-show-urilor cu programari online.",
    publishedDate: "2025-03-24",
    relatedLandingLinks: [
      { href: "/programari-online-salon", label: "Programări online salon" },
      { href: "/programari-online-cosmetica", label: "Programări online cosmetică" }
    ],
    content: `
Anulările și no-show-urile afectează direct încasările și ritmul zilei. Nu pierzi doar un slot, ci și predictibilitatea agendei. De aceea, obiectivul nu este doar volum mare de programari online, ci rezervări confirmate și stabile.

Primul pas este claritatea serviciilor. Clientul trebuie să vadă din prima ce rezervă, cât durează și cât costă. Când aceste informații sunt neclare, apar anulări. Un software salon bine configurat reduce această problemă.

Al doilea pas este confirmarea imediată. După rezervare, clientul trebuie să primească detalii complete. Reminderul cu 24h înainte și cel din ziua programării reduc semnificativ uitarea.

Politica de anulare trebuie afișată simplu, fără ambiguitate. Când regulile sunt clare și consecvente, clienții respectă mai ușor programul.

Confirmarea activă funcționează foarte bine: un mesaj scurt la care clientul răspunde. Astfel crește responsabilitatea și ai timp să recuperezi slotul dacă apare anulare.

Analiza datelor este esențială. Urmărește ce intervale au cele mai multe anulări și ajustează programul. Programari online nu înseamnă doar rezervare, ci și optimizare continuă.

Poți aplica reguli diferențiate: flexibilitate pentru clienții corecți, confirmare mai strictă pentru cei cu istoric de no-show. Acest echilibru protejează venitul fără să afecteze experiența bună.

Impactul financiar este mare. O reducere modestă a no-show-urilor poate adăuga mii de lei anual. Dacă ai și model fără comision la 59,99 RON, păstrezi și mai mult din valoarea fiecărei rezervări.

Pe termen lung, consistența operațională devine avantaj competitiv. Clienții apreciază punctualitatea, iar echipa lucrează cu mai puțin stres.

Reducerea anulărilor este un sistem, nu o setare: servicii clare, confirmări, reminder, politică transparentă și analiză constantă.
`,
  },
  {
    slug: "telefon-vs-programari-online",
    title: "Telefon vs programări online: ce aduce mai multe încasări",
    description: "Comparație între modelul clasic pe telefon și modelul digital.",
    publishedDate: "2025-04-07",
    relatedLandingLinks: [
      { href: "/aplicatie-programari-frizerie", label: "Aplicație programări frizerie" },
      { href: "/software-programari-manichiura", label: "Software programări manichiură" }
    ],
    content: `
Telefonul funcționează pentru început, dar devine limitativ când numărul de clienți crește. În orele aglomerate, apelurile întrerup activitatea și reduc calitatea experienței.

Programari online rezolvă această limitare prin disponibilitate 24/7. Clientul rezervă când are timp, fără să depindă de răspunsul echipei.

Un avantaj major este standardizarea informațiilor. În software salon, clientul vede serviciu, durată și preț înainte de rezervare. La telefon, aceste detalii pot fi interpretate diferit.

Din perspectiva timpului, diferența este mare. Minutele consumate pe apeluri repetitive se transformă în ore pe lună. Programari online eliberează resurse pentru activități cu valoare directă.

Conversia crește când traseul este scurt: alegere serviciu, alegere interval, confirmare. În modelul pe telefon, clientul poate amâna sau abandona.

Costul platformei contează. Dacă există comision per rezervare, marja scade odată cu creșterea. Cu cost fix 59,99 RON și fără comision, păstrezi predictibilitatea.

Telefonul poate rămâne canal secundar pentru excepții, dar fluxul principal merită mutat în digital. Clienții se adaptează rapid când procesul este comunicat clar.

Pe termen lung, programari online aduc mai mult control: mai puține erori, mai puține întreruperi și agendă mai stabilă.

Pentru saloanele care vor creștere sustenabilă, modelul digital este fundația corectă. În piața actuală, procesele bune fac diferența.
`,
  },
  {
    slug: "alternativa-booksy-romania",
    title: "Alternativă Booksy în România: ce să alegi dacă vrei cost fix, nu comision",
    description:
      "Compară modelele de business pentru programări online: marketplace cu comision versus SaaS local cu abonament predictibil.",
    publishedDate: "2026-02-10",
    relatedLandingLinks: [
      { href: "/comparativ/booksy", label: "Comparativ Booksy" },
      { href: "/alternativa-fresha-romania", label: "Alternativă Fresha România" },
      { href: "/preturi", label: "Prețuri OcupaLoc" }
    ],
    content: `
Marketplace-urile mari pentru programări sunt utile când vrei vizibilitate în aplicația lor. Costul real nu este doar taxa lunară, ci și comisionul care crește odată cu volumul. Pentru un salon sau cabinet care are deja clienți și canale proprii, modelul devine mai puțin atrăgător pe măsură ce te dezvolți.

O alternativă sănătoasă este software-ul tip SaaS: plătești un abonament fix, păstrezi relația directă cu clientul și controlezi mesajele, reminder-ele și politica de anulare. În România contează și limba română pentru suport și facturare clară în RON.

Dacă obiectivul tău este predictibilitate financiară, merită să calculezi cât plătești astăzi per programare și ce înseamnă același volum peste șase luni. Diferența dintre comision variabil și cost fix se vede rapid în marjă.

Migrarea este practică: definești serviciile, pui programul, generezi linkul de rezervare și îl distribui pe WhatsApp sau rețelele unde deja comunici cu clienții. Nu ai nevoie de audiență nouă ca să validezi fluxul.

Indiferent de platformă, succesul depinde de disciplină operațională: confirmări clare, reminder-e și o pagină de rezervare coerentă cu brandul tău. Un instrument bun amplifică aceste obiceiuri.

Pentru echipe mici din România, un SaaS fără comision per programare poate fi decizia care lasă mai mulți bani în business pentru training, marketing local sau investiții în experiența din locație.
`,
  },
  {
    slug: "programari-online-fara-comision",
    title: "Programări online fără comision: de ce contează pentru saloane și cabinete",
    description:
      "Cum îți protejezi marja când crește numărul de rezervări și ce înseamnă un model cu abonament fix în România.",
    publishedDate: "2026-02-18",
    relatedLandingLinks: [
      { href: "/programari-online-salon", label: "Programări online salon" },
      { href: "/demo-interactiv", label: "Demo interactiv" },
      { href: "/preturi", label: "Prețuri" }
    ],
    content: `
Comisionul per programare pare mic la început, dar se adună: fiecare lună aglomerată îți taie din profit exact când ai cele mai multe încasări. Modelul fără comision îți permite să planifici: știi costul platformei indiferent de sezon.

Pentru saloane și cabinete, programările online nu sunt doar „website”, ci reduc apelurile repetitive și erorile de comunicare. Clientul vede serviciul, durata și prețul înainte să rezerve, iar tu primești un istoric clar.

Fără comision nu înseamnă fără valoare: înseamnă că succesul tău nu este taxat în procente. Banii economisiți pot merge către campanii locale, recomandări sau îmbunătățirea experienței în locație.

Implementarea corectă include politică de anulare afișată clar, confirmări automate și link unic pe care îl promovezi peste tot: Instagram, WhatsApp, Google Business. Consistența canalului de rezervare crește încrederea.

Pe termen mediu, diferența între abonament fix și comision variabil devine un avantaj compus: reinvestești suma care altfel ar fi ieșit din marjă mereu când crești.

Alege instrumentul care îți lasă controlul asupra relației cu clientul și al datelor operaționale — nu doar acces la o listă de rezervări într-o aplicație agregatoare.
`,
  },
  {
    slug: "software-programari-cabinet-medic",
    title: "Software programări pentru cabinet: agendă clară fără comision per vizită",
    description:
      "Ce au nevoie clinicile și cabinetele mici din România pentru programări online simple și conforme fluxului zilnic.",
    publishedDate: "2026-03-02",
    relatedLandingLinks: [
      { href: "/software-programari-clinica", label: "Software programări clinică" },
      { href: "/demo-interactiv", label: "Demo fără cont" },
      { href: "/preturi", label: "Prețuri OcupaLoc" }
    ],
    content: `
Într-un cabinet mic sau clinică cu mai puține locații, haosul nu vine din lipsa clienților, ci din fragmentarea programărilor: telefon, mesaje, email. Un singur link de rezervare reduce fricțiunea pentru pacient și pentru recepție.

Cerințele reale sunt simple: servicii clar definite, durată realistă a sloturilor, pauze între consultații și confirmări care reduc neprezentările. Software-ul trebuie să reflecte programul tău, nu invers.

Modelul cu abonament fix fără comision per vizită ajută la bugetare: nu &quot;crești taxa&quot; odată cu succesul operațional. În sănătate și servicii conexe, predictibilitatea costurilor susține investițiile în echipament sau personal.

Pacienții apreciază transparența: văd disponibilitatea reală, aleg ora potrivită și primesc email de confirmare. Tu păstrezi controlul asupra politicii de reprogramare și anulare.

Siguranța și calitatea înseamnă și proces intern bun: statusuri clare în dashboard, reminder-e automate acolo unde sunt utile și istoric pentru fiecare programare.

Indiferent de verticală, obiectivul este același: mai puțin timp pierdut pe coordonare manuală și mai multă siguranță că agenda reflectă realitatea din ziua de lucru.
`,
  },
];

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((item) => item.slug === slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://ocupaloc.ro/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `https://ocupaloc.ro/blog/${post.slug}`,
      publishedTime: post.publishedDate,
      authors: ["OcupaLoc"]
    }
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS.find((item) => item.slug === slug);
  if (!post) notFound();

  const paragraphs = post.content.trim().split("\n\n");

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedDate,
    dateModified: post.publishedDate,
    author: { "@type": "Organization", name: "OcupaLoc", url: "https://ocupaloc.ro" },
    publisher: {
      "@type": "Organization",
      name: "OcupaLoc",
      logo: { "@type": "ImageObject", url: "https://ocupaloc.ro/og-image.svg" }
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://ocupaloc.ro/blog/${post.slug}` }
  };

  return (
    <main className="min-h-screen oc-bg px-6 py-14 oc-text">
      <Script id={`article-schema-${post.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          <p className="oc-secondary-text">{post.description}</p>
          <time dateTime={post.publishedDate} className="text-sm oc-secondary-text">
            {new Date(post.publishedDate).toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })}
          </time>
        </header>

        <section className="space-y-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 30)} className="leading-relaxed oc-text">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="rounded-xl border oc-border bg-white p-5">
          <h2 className="text-2xl font-bold">Încearcă produsul</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/demo-interactiv" className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
              Demo fără cont
            </Link>
            <Link href="/preturi" className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
              Prețuri
            </Link>
            {post.relatedLandingLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border oc-border px-4 py-2 text-sm hover:oc-badge-bg">
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border oc-border oc-primary p-6 text-center">
          <h3 className="text-xl font-semibold">Vrei programări online fără comision?</h3>
          <p className="mt-2 text-sm oc-text">Vezi demo-ul fără cont sau creează profilul cu 14 zile gratuite.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/demo-interactiv" data-cta-location={`blog_${post.slug}_demo`} className="inline-flex rounded-lg border oc-border bg-white px-5 py-2.5 font-medium oc-accent">
              Demo fără cont
            </Link>
            <Link href="/signup?start=1" data-cta-location={`blog_${post.slug}_cta`} className="inline-flex rounded-lg oc-primary px-5 py-2.5 font-medium text-white">
              Creează cont gratuit
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
