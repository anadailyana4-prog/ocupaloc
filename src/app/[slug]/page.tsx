import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { BookingCard } from "@/components/booking/BookingCard";
import { isMissingProfesionistiColumn } from "@/lib/supabase/profesionisti-fallback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ slug: string }> };
const ORASE_TARGET = ["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "sibiu", "oradea"] as const;

function displayInitial(name: string): string {
  const t = name.trim();
  return t ? t.charAt(0).toLocaleUpperCase("ro-RO") : "?";
}

function tipLabel(tip: string | null | undefined): string | null {
  if (!tip) return null;
  const m: Record<string, string> = {
    frizerie: "Frizerie",
    manichiura: "Manichiură",
    coafor: "Coafor",
    altul: "Altul"
  };
  return m[tip] ?? tip;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if ((ORASE_TARGET as readonly string[]).includes(slug)) {
    const orasTitle = slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return {
      title: `Programare online frizer ${orasTitle}`,
      description: `Găsește frizeri și saloane în ${orasTitle} cu programare online. Rezervă în 30 secunde, fără telefon.`
    };
  }
  const supabase = await createSupabaseServerClient();
  const { data: prof } = await supabase
    .from("profesionisti_public")
    .select("nume_business, description, tip_activitate, oras, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  const name = prof?.nume_business?.trim() || slug;
  const descRaw = (prof as { description?: string | null } | null)?.description?.trim();
  const tip = tipLabel(prof?.tip_activitate);
  const tipBit = tip ? ` · ${tip}` : "";
  const city = (prof as { oras?: string | null } | null)?.oras?.trim();
  const image = (prof as { logo_url?: string | null } | null)?.logo_url?.trim() || "/default-salon.svg";
  const description =
    descRaw && descRaw.length > 0
      ? descRaw.length > 160
        ? `${descRaw.slice(0, 157)}…`
        : descRaw
      : `Programează-te online la ${name}${tipBit}${city ? ` în ${city}` : ""}. Vezi servicii și disponibilitate în timp real.`;

  return {
    title: `${name} - Programare online`,
    description,
    openGraph: {
      title: `${name}`,
      description,
      type: "website",
      images: [image]
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} - Programare online`,
      description,
      images: [image]
    }
  };
}

export async function generateStaticParams() {
  return ORASE_TARGET.map((oras) => ({ slug: oras }));
}

export default async function PublicSalonSlugPage({ params }: PageProps) {
  const { slug } = await params;
  if ((ORASE_TARGET as readonly string[]).includes(slug)) {
    const orasName = slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    let profesionisti:
      | Array<{ slug: string | null; nume_business: string | null; tip_activitate: string | null; description: string | null }>
      | null = null;

    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase
        .from("profesionisti_public")
        .select("slug, nume_business, tip_activitate, description")
        .ilike("oras", `%${orasName}%`)
        .not("slug", "is", null)
        .limit(10);
      profesionisti = data;
    } catch {
      profesionisti = null;
    }

    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-4xl space-y-10 px-6 py-14">
          <header className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Frizeri în {orasName} cu programare online</h1>
            <p className="text-base leading-relaxed text-zinc-300">
              Dacă vrei o programare rapidă fără apeluri și fără mesaje rămase în seen, aici găsești profesioniști din {orasName} care lucrează
              cu rezervare online. Vezi serviciile, durata și intervalele disponibile direct din telefon, în timp real. Pentru clienți e simplu:
              alegi ora și primești confirmare imediat. Pentru profesioniști, avantajul e și mai mare: mai puține goluri în program, mai puține
              anulări în ultimul moment și mai mult control asupra zilei de lucru. În loc să pierzi timp cu zeci de conversații pe WhatsApp, poți
              trimite un singur link și clienții rezervă singuri. Rezultatul este o experiență mai clară, mai profesionistă și mai predictibilă
              atât pentru frizer, cât și pentru client. Dacă ești în {orasName} și cauți un salon modern, lista de mai jos este un punct bun de
              pornire.
            </p>
          </header>

          <section className="space-y-3">
            {(profesionisti ?? []).slice(0, 10).map((prof) => (
              <Link
                key={prof.slug}
                href={`/${prof.slug}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4 transition hover:border-zinc-600 hover:bg-zinc-900"
              >
                <p className="text-lg font-semibold text-white">{prof.nume_business}</p>
                <p className="text-sm text-zinc-400">{tipLabel(prof.tip_activitate) ?? "Programare online disponibilă"}</p>
              </Link>
            ))}
            {(profesionisti ?? []).length === 0 ? (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
                Lucrăm la extinderea listei pentru {orasName}. Revino în curând sau caută un profesionist după recomandări.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 text-center">
            <p className="mb-3 text-lg font-semibold">Ești frizer în {orasName}? Creează cont gratuit</p>
            <Link href="/signup" className="inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500">
              Creează cont gratuit
            </Link>
          </section>
        </div>
      </main>
    );
  }
  const supabase = await createSupabaseServerClient();
  type PublicProf = {
    id: string;
    slug: string;
    nume_business: string;
    tip_activitate: string | null;
    description: string | null;
    oras: string | null;
    logo_url: string | null;
    telefon?: string | null;
    whatsapp?: string | null;
    lucreaza_acasa: boolean;
    adresa_publica: string | null;
    program: Record<string, unknown> | null;
  };

  const selectAttempts = [
    "id,slug,nume_business,tip_activitate,description,oras,logo_url,telefon,whatsapp,lucreaza_acasa,adresa_publica,program",
    "id,slug,nume_business,tip_activitate,description,oras,logo_url,telefon,lucreaza_acasa,adresa_publica,program"
  ] as const;

  let prof: PublicProf | null = null;
  let error: { message?: string | null } | null = null;
  for (const columns of selectAttempts) {
    const result = await supabase.from("profesionisti_public").select(columns).eq("slug", slug).maybeSingle<PublicProf>();
    if (!result.error) {
      prof = result.data;
      error = null;
      break;
    }

    if (isMissingProfesionistiColumn(result.error, "whatsapp")) {
      error = result.error;
      continue;
    }

    error = result.error;
    break;
  }

  if (error || !prof) {
    notFound();
  }

  const { data: servicii } = await supabase
    .from("servicii")
    .select("id,nume,durata_minute,pret,culoare,activ,ordine")
    .eq("profesionist_id", prof.id)
    .eq("activ", true)
    .order("ordine", { ascending: true });

  if (!servicii?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-50">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{prof.nume_business}</h1>
          <p className="max-w-md text-zinc-300">Pagina de programări este în configurare. Revenim foarte curând cu serviciile disponibile online.</p>
          {prof.telefon ? (
            <a
              href={`tel:${String(prof.telefon).replace(/\s+/g, "")}`}
              className="inline-flex items-center justify-center rounded-full bg-zinc-800/90 px-8 py-3 text-sm font-semibold text-white ring-1 ring-zinc-600/80 transition hover:bg-zinc-800 hover:ring-zinc-500"
            >
              Sună: {String(prof.telefon)}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const telefon = (prof.telefon as string | null)?.trim() ?? "";
  const whatsapp = ((prof.whatsapp as string | null)?.trim() || telefon).trim();
  const telHref = telefon ? telefon.replace(/\s+/g, "") : "";
  const waHref = whatsapp ? whatsapp.replace(/\D+/g, "") : "";
  const publicDescription = ((prof as { description?: string | null }).description ?? "").trim();
  const tip = tipLabel(prof.tip_activitate as string | undefined);
  const city = ((prof as { oras?: string | null }).oras ?? "").trim();
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: String(prof.nume_business ?? ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: city || "România",
      streetAddress: String((prof as { adresa_publica?: string | null }).adresa_publica ?? "")
    },
    telephone: telefon,
    url: `https://ocupaloc.ro/${slug}`
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-black text-zinc-50">
      <Script id={`local-business-schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <div className="mx-auto max-w-3xl space-y-14 px-6 py-14 md:space-y-16 md:py-20">
        <header className="flex flex-col items-center gap-8 text-center">
          {prof.logo_url ? (
            <Image
              src={prof.logo_url as string}
              alt={`Logo ${String(prof.nume_business ?? "salon")}`}
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 rounded-full border border-zinc-800 object-cover shadow-lg"
            />
          ) : (
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-4xl font-bold tracking-tight text-white shadow-xl shadow-indigo-600/30 ring-4 ring-white/5"
              aria-hidden
            >
              {displayInitial((prof.nume_business as string) || slug)}
            </div>
          )}
          <div className="max-w-xl space-y-5">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{prof.nume_business}</h1>
            {tip ? (
              <p className="inline-flex rounded-full border border-zinc-700/90 bg-zinc-900/70 px-5 py-2 text-sm font-medium text-zinc-300">
                {tip}
              </p>
            ) : null}
            {publicDescription ? (
              <p className="max-w-lg text-base leading-relaxed text-zinc-400">{publicDescription}</p>
            ) : null}
            {prof.lucreaza_acasa ? (
              <p className="text-sm text-zinc-500">Locația exactă o primești pe WhatsApp după confirmare.</p>
            ) : prof.adresa_publica ? (
              <p className="text-sm text-zinc-400">{prof.adresa_publica as string}</p>
            ) : null}
            {telefon || whatsapp ? (
              <div className="flex flex-wrap justify-center gap-3 pt-1">
                {telefon ? (
                  <a
                    href={`tel:${telHref}`}
                    className="inline-flex items-center justify-center rounded-full bg-zinc-800/90 px-8 py-3 text-sm font-semibold text-white ring-1 ring-zinc-600/80 transition hover:bg-zinc-800 hover:ring-zinc-500"
                  >
                    {telefon}
                  </a>
                ) : null}
                {waHref ? (
                  <a
                    href={`https://wa.me/${waHref}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600/90 px-8 py-3 text-sm font-semibold text-white ring-1 ring-emerald-400/60 transition hover:bg-emerald-500"
                  >
                    WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <BookingCard
          variant="live"
          slug={slug}
          publicBase={site || "https://ocupaloc.ro"}
          businessName={prof.nume_business as string}
          services={servicii ?? []}
        />
      </div>
    </div>
  );
}
