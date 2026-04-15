import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Post = {
  slug: string;
  title: string;
  description: string;
  content: string;
  relatedLandingLinks: Array<{ href: string; label: string }>;
};

const POSTS: Post[] = [
  {
    slug: "fresha-cat-costa-romania",
    title: "Fresha în România: cât costă cu adevărat și ce alternative ai",
    description: "Analiză de cost, marjă și profit pentru saloane care folosesc programari online.",
    relatedLandingLinks: [
      { href: "/alternativa-fresha-romania", label: "Alternativă Fresha România" },
      { href: "/programari-online-salon", label: "Programări online salon" }
    ],
    content: `
Multe saloane aleg platforme pe comision pentru programari online fiindcă par simple la început. Problema apare când volumul crește, iar costul variabil începe să consume marja. În România, unde costurile operaționale cresc constant, predictibilitatea este critică.

Un software salon pe comision taxează performanța. Cu cât ai mai multe rezervări, cu atât plătești mai mult. Dacă faci 60 de programări și comisionul mediu este în jur de 10 RON, ajungi la aproximativ 600 RON lunar. Dacă urci la 120 programări, costul aproape se dublează. În modelul cu 99,99 RON fără comision, costul rămâne fix.

Diferența de cost nu este doar contabilă, ci strategică. Banii economisiți pot susține training, marketing local sau investiții în experiența din salon. Asta înseamnă creștere care rămâne în business, nu într-o taxă care crește odată cu succesul.

Mai există costuri ascunse: timp pierdut pe clarificări, lipsă de suport local și fricțiuni de comunicare. Când ai software salon adaptat pieței locale, cu suport în română și plăți în RON, operaționalul devine mai simplu.

Din perspectiva brandului, programari online ar trebui să consolideze relația directă cu clientul. Dacă procesul de rezervare este clar și coerent cu identitatea salonului, fidelizarea crește și clientul revine mai ușor.

Migrarea poate fi făcută etapizat: setezi serviciile principale, configurezi programul, publici link-ul în canalele active și imporți baza de clienți. În două săptămâni, de regulă, fluxul devine stabil.

Pe termen lung, diferența dintre comision și abonament fix poate însemna mii de lei economisiți anual. Aceste sume pot fi reinvestite în proiecte cu impact real. Pentru multe saloane, modelul 99,99 RON fără comision este o alegere de business mai sănătoasă.

Concluzia este clară: dacă vrei control financiar și creștere sustenabilă, programari online cu cost fix și software salon local reprezintă o fundație mai bună decât un model taxat per rezervare.

În practică, saloanele care fac această tranziție observă nu doar economie, ci și mai mult control. Când știi exact costul lunar, poți planifica mai bine campanii, bugete și obiective.

Alegerea platformei nu este doar o decizie tehnică. Este o alegere de model economic: plătești mai mult când crești, sau păstrezi valoarea creată în salonul tău.
`,
  },
  {
    slug: "cum-sa-reduci-anularile",
    title: "Cum să reduci anulările și no-show-urile în salon",
    description: "Ghid practic pentru reducerea no-show-urilor cu programari online.",
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

Impactul financiar este mare. O reducere modestă a no-show-urilor poate adăuga mii de lei anual. Dacă ai și model fără comision la 99,99 RON, păstrezi și mai mult din valoarea fiecărei rezervări.

Pe termen lung, consistența operațională devine avantaj competitiv. Clienții apreciază punctualitatea, iar echipa lucrează cu mai puțin stres.

Reducerea anulărilor este un sistem, nu o setare: servicii clare, confirmări, reminder, politică transparentă și analiză constantă.
`,
  },
  {
    slug: "telefon-vs-programari-online",
    title: "Telefon vs programări online: ce aduce mai multe încasări",
    description: "Comparație între modelul clasic pe telefon și modelul digital.",
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

Costul platformei contează. Dacă există comision per rezervare, marja scade odată cu creșterea. Cu cost fix 99,99 RON și fără comision, păstrezi predictibilitatea.

Telefonul poate rămâne canal secundar pentru excepții, dar fluxul principal merită mutat în digital. Clienții se adaptează rapid când procesul este comunicat clar.

Pe termen lung, programari online aduc mai mult control: mai puține erori, mai puține întreruperi și agendă mai stabilă.

Pentru saloanele care vor creștere sustenabilă, modelul digital este fundația corectă. În piața actuală, procesele bune fac diferența.
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
  return { title: post.title, description: post.description };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS.find((item) => item.slug === slug);
  if (!post) notFound();

  const paragraphs = post.content.trim().split("\n\n");

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <article className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
          <p className="text-zinc-400">{post.description}</p>
        </header>

        <section className="space-y-4">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 30)} className="leading-relaxed text-zinc-300">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-2xl font-bold">Vezi și:</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {post.relatedLandingLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 text-center">
          <h3 className="text-xl font-semibold">Vrei mai multe rezervări fără comision?</h3>
          <p className="mt-2 text-sm text-zinc-300">Începe cu un software salon la 99,99 RON și mută toate programările în online.</p>
          <Link href="/signup" data-cta-location={`blog_${post.slug}_cta`} className="mt-4 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500">
            Creează cont gratuit
          </Link>
        </div>
      </article>
    </main>
  );
}
