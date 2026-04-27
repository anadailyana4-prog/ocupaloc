import type { Metadata } from "next";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ slug: string; serviciu: string }> };

const orase = ["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "oradea", "sibiu"] as const;
const servicii = ["frizerie", "salon", "manichiura", "cosmetica", "barber"] as const;

const cityCopy: Record<(typeof orase)[number], [string, string]> = {
  bucuresti: [
    "Peste 2000 de saloane din București folosesc deja programări online pentru a reduce apelurile și a crește conversia din Instagram.",
    "Într-o piață aglomerată ca Bucureștiul, un flux simplu de rezervare te ajută să păstrezi clienții aproape și agenda plină."
  ],
  "cluj-napoca": [
    "Cluj-Napoca, orașul tech al României, adoptă rapid soluțiile digitale inclusiv în beauty, unde rezervarea online devine standard.",
    "Clienții din Cluj caută experiențe rapide și clare, iar un sistem de programări bine organizat face diferența."
  ],
  timisoara: [
    "Timișoara are o comunitate urbană activă, iar saloanele care oferă programări online câștigă timp și predictibilitate.",
    "Într-un oraș cu ritm alert, disponibilitatea 24/7 la rezervare aduce conversii în afara orelor clasice."
  ],
  iasi: [
    "Iași este un centru universitar mare, cu clienți care preferă rezervarea rapidă direct din telefon.",
    "Pentru saloanele din Iași, digitalizarea procesului de programare înseamnă mai puține goluri și mai mult control."
  ],
  constanta: [
    "Constanța are sezonalitate ridicată, iar agenda online ajută la gestionarea vârfurilor de cerere din perioadele aglomerate.",
    "Un sistem clar de rezervări îți permite să ajustezi rapid disponibilitatea și să menții experiența clientului constantă."
  ],
  brasov: [
    "Brașov combină clienți locali cu flux turistic, ceea ce face programările online foarte utile pentru organizare.",
    "Saloanele din Brașov care simplifică rezervarea direct pe link câștigă încredere și ritm operațional."
  ],
  oradea: [
    "Oradea are tot mai multe business-uri beauty care investesc în digitalizare și procese eficiente.",
    "Programările online ajută saloanele din Oradea să reducă timpul pierdut pe mesaje și să crească retenția."
  ],
  sibiu: [
    "Sibiul are o piață locală competitivă, iar rezervarea online oferă un avantaj clar în experiența clientului.",
    "Cu un sistem predictibil, saloanele din Sibiu pot menține agenda stabilă și pot răspunde mai bine cererii sezoniere."
  ]
};

function cityDisplay(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function serviceDisplay(slug: string): string {
  const labels: Record<string, string> = {
    frizerie: "frizerie",
    salon: "salon",
    manichiura: "manichiură",
    cosmetica: "cosmetică",
    barber: "barber"
  };
  return labels[slug] ?? slug;
}

export function generateStaticParams() {
  return orase.flatMap((oras) => servicii.map((serviciu) => ({ slug: oras, serviciu })));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, serviciu } = await params;
  const orasTitle = cityDisplay(slug);
  const serviciuTitle = serviceDisplay(serviciu);

  return {
    title: `Programări online ${serviciuTitle} ${orasTitle}`,
    description: `Programări online pentru ${serviciuTitle} în ${orasTitle}. Preț fix 59,99 RON/lună, fără comision.`
  };
}

export default async function LocalServicePage({ params }: PageProps) {
  const { slug, serviciu } = await params;

  if (!orase.includes(slug as (typeof orase)[number]) || !servicii.includes(serviciu as (typeof servicii)[number])) {
    return null;
  }

  const orasName = cityDisplay(slug);
  const serviciuName = serviceDisplay(serviciu);
  const copy = cityCopy[slug as (typeof orase)[number]];
  let salons: Array<{ id: string; business_name: string | null; slug: string | null }> = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("profesionisti_public")
      .select("id,business_name:nume_business,slug")
      .ilike("oras", `%${orasName}%`)
      .limit(6);
    if (data) {
      salons = data;
    }
  } catch {
    // credentials unavailable (e.g. CI build without secrets); render empty list
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-14 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Programări online {serviciuName} {orasName}</h1>
          <p className="text-zinc-300">{copy[0]}</p>
          <p className="text-zinc-400">{copy[1]}</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Saloane în {orasName}</h2>
          {salons.length > 0 ? (
            salons.map((salon) => (
              <Link
                key={salon.id}
                href={salon.slug ? `/${salon.slug}` : "#"}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:bg-zinc-900"
              >
                <p className="font-semibold">{salon.business_name ?? "Salon local"}</p>
                <p className="text-sm text-zinc-400">{orasName}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-zinc-400">Fii primul salon din {orasName}</p>
          )}
        </section>

        <Link href="/signup?start=1" className="inline-flex rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
          Adaugă salonul tău din {orasName}
        </Link>
      </div>
    </main>
  );
}

