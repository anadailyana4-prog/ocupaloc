import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LOCAL_SERVICE_CITIES,
  LOCAL_SERVICES,
  cityDisplay,
  cityServiceCopy,
  isLocalServiceCity,
  isLocalServiceSlug,
  serviceDisplay
} from "@/lib/seo/local-service-pages";
import { createSupabasePublicClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ slug: string; serviciu: string }> };

// Pagini SEO statice, reîmprospătate o dată pe zi (ISR). Fără cookies => cacheabil.
export const revalidate = 86400;
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCAL_SERVICE_CITIES.flatMap((oras) =>
    LOCAL_SERVICES.map((serviciu) => ({ slug: oras, serviciu }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, serviciu } = await params;
  if (!isLocalServiceCity(slug) || !isLocalServiceSlug(serviciu)) {
    return { robots: { index: false, follow: false } };
  }
  const orasTitle = cityDisplay(slug);
  const serviciuTitle = serviceDisplay(serviciu);
  const canonical = `https://ocupaloc.ro/${slug}/${serviciu}`;
  const title = `Programări online ${serviciuTitle} ${orasTitle}`;
  const description = `Programări online pentru ${serviciuTitle} în ${orasTitle}. Preț fix 59,99 RON/lună, fără comision.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function LocalServicePage({ params }: PageProps) {
  const { slug, serviciu } = await params;

  if (!isLocalServiceCity(slug) || !isLocalServiceSlug(serviciu)) {
    return notFound();
  }

  const orasName = cityDisplay(slug);
  const serviciuName = serviceDisplay(serviciu);
  const canonical = `https://ocupaloc.ro/${slug}/${serviciu}`;
  const copy = cityServiceCopy(slug);
  let salons: Array<{ id: string; business_name: string | null; slug: string | null }> = [];
  try {
    const supabase = createSupabasePublicClient();
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

  const faq: Array<{ q: string; a: string }> = [
    {
      q: `Cât costă un sistem de programări online pentru ${serviciuName} în ${orasName}?`,
      a: `OcupaLoc are un preț fix de 59,99 RON pe lună, fără comision pe rezervare și fără costuri ascunse. Plătești același abonament indiferent câte programări primești în ${orasName}.`
    },
    {
      q: `Cum primesc programări online pentru salonul meu de ${serviciuName} din ${orasName}?`,
      a: `Îți creezi cont gratuit, adaugi serviciile și programul, apoi primești un link public pe care îl distribui clienților din ${orasName} pe Instagram, WhatsApp sau Google. Clienții rezervă singuri, în timp real.`
    },
    {
      q: `Clienții din ${orasName} pot rezerva fără să sune?`,
      a: `Da. Clientul alege serviciul de ${serviciuName}, vede intervalele libere și confirmă programarea în mai puțin de 30 de secunde, fără apel telefonic și fără mesaje rămase necitite.`
    },
    {
      q: `Trebuie să instalez o aplicație?`,
      a: `Nu. OcupaLoc funcționează direct în browser, pe telefon și pe calculator. Nici tu, nici clienții din ${orasName} nu trebuie să instalați nimic.`
    }
  ];

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Programări online ${serviciuName} ${orasName}`,
    url: canonical,
    numberOfItems: salons.length,
    itemListElement: salons
      .filter((salon) => Boolean(salon.slug))
      .map((salon, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://ocupaloc.ro/${salon.slug}`,
        name: salon.business_name ?? "Salon local"
      }))
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Acasă", item: "https://ocupaloc.ro" },
      { "@type": "ListItem", position: 2, name: orasName, item: `https://ocupaloc.ro/${slug}` },
      { "@type": "ListItem", position: 3, name: `${serviciuName} ${orasName}`, item: canonical }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  };

  const otherServices = LOCAL_SERVICES.filter((s) => s !== serviciu);
  const otherCities = LOCAL_SERVICE_CITIES.filter((o) => o !== slug).slice(0, 5);

  return (
    <main className="min-h-screen bg-white px-6 py-14 oc-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="mx-auto max-w-4xl space-y-10">
        <nav aria-label="Breadcrumb" className="text-sm oc-secondary-text">
          <Link href="/" className="hover:underline">
            Acasă
          </Link>
          <span className="px-1.5">/</span>
          <Link href={`/${slug}`} className="hover:underline">
            {orasName}
          </Link>
          <span className="px-1.5">/</span>
          <span className="oc-text">{serviciuName}</span>
        </nav>

        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Programări online {serviciuName} {orasName}
          </h1>
          <p className="text-lg oc-text">{copy[0]}</p>
          <p className="oc-secondary-text">{copy[1]}</p>
          <Link
            href="/signup?start=1"
            className="inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white hover:bg-[#D97706]"
          >
            Creează cont gratuit
          </Link>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">De ce folosesc saloanele de {serviciuName} din {orasName} programări online</h2>
          <p className="leading-relaxed oc-secondary-text">
            Un salon de {serviciuName} din {orasName} pierde zilnic timp prețios răspunzând la telefon și la mesaje pe Instagram sau
            WhatsApp. Cu un sistem de rezervări online, clienții din {orasName} văd intervalele libere și confirmă singuri programarea,
            în timp real, fără să te întrerupă din lucru. Rezultatul: mai puține goluri în agendă, mai puține anulări în ultimul moment
            și o imagine mai profesionistă în fața clienților.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Rezervări 24/7, chiar și când saloul e închis",
              "Reamintiri automate care reduc neprezentările",
              "Preț fix 59,99 RON/lună, fără comision pe programare",
              "Link public de partajat pe Instagram și Google"
            ].map((benefit) => (
              <li key={benefit} className="rounded-xl border oc-border bg-white p-4 text-sm oc-text">
                {benefit}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Saloane de {serviciuName} în {orasName}</h2>
          {salons.length > 0 ? (
            salons.map((salon) => (
              <Link
                key={salon.id}
                href={salon.slug ? `/${salon.slug}` : "#"}
                className="block rounded-xl border oc-border bg-white p-4 hover:bg-white"
              >
                <p className="font-semibold">{salon.business_name ?? "Salon local"}</p>
                <p className="text-sm oc-secondary-text">{orasName}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-xl border oc-border bg-white p-4 oc-secondary-text">
              Fii primul salon de {serviciuName} din {orasName} cu programări online.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Întrebări frecvente</h2>
          <div className="space-y-3">
            {faq.map((item) => (
              <details key={item.q} className="rounded-xl border oc-border bg-white p-4">
                <summary className="cursor-pointer font-semibold oc-text">{item.q}</summary>
                <p className="mt-2 text-sm leading-relaxed oc-secondary-text">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t oc-border pt-6">
          <h2 className="text-lg font-semibold">Programări online în {orasName}</h2>
          <div className="flex flex-wrap gap-2">
            {otherServices.map((s) => (
              <Link
                key={s}
                href={`/${slug}/${s}`}
                className="rounded-full border oc-border bg-white px-4 py-2 text-sm oc-text hover:underline"
              >
                {serviceDisplay(s)} {orasName}
              </Link>
            ))}
          </div>
          <h2 className="pt-2 text-lg font-semibold">{serviceDisplay(serviciu)} în alte orașe</h2>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((o) => (
              <Link
                key={o}
                href={`/${o}/${serviciu}`}
                className="rounded-full border oc-border bg-white px-4 py-2 text-sm oc-text hover:underline"
              >
                {serviceDisplay(serviciu)} {cityDisplay(o)}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border oc-border oc-badge-bg p-6 text-center">
          <p className="mb-3 text-lg font-semibold">Ai un salon de {serviciuName} în {orasName}?</p>
          <Link
            href="/signup?start=1"
            className="inline-flex rounded-lg oc-primary px-6 py-3 font-semibold text-white hover:bg-[#D97706]"
          >
            Adaugă salonul tău gratuit
          </Link>
        </section>
      </div>
    </main>
  );
}
