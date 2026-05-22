import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { BookingCard } from "@/components/booking/BookingCard";
import { parsePublicProfileMedia } from "@/lib/public-profile-media";
import { isMissingProfesionistiColumn } from "@/lib/supabase/profesionisti-fallback";
import { ORASE_TARGET } from "@/lib/seo/orase-target";
import { createSupabaseServerClient, getUser } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ slug: string }> };

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
 const canonical = `https://ocupaloc.ro/${slug}`;
 if ((ORASE_TARGET as readonly string[]).includes(slug)) {
 const orasTitle = slug
 .split("-")
 .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
 .join(" ");
 const title = `Programare online frizer ${orasTitle}`;
 const description = `Găsește frizeri și saloane în ${orasTitle} cu programare online. Rezervă în 30 secunde, fără telefon.`;
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
 alternates: { canonical },
 openGraph: {
 title: `${name}`,
 description,
 type: "website",
 url: canonical,
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
 <main className="min-h-screen bg-white oc-text">
 <div className="mx-auto max-w-4xl space-y-10 px-6 py-14">
 <header className="space-y-4">
 <h1 className="text-4xl font-bold tracking-tight">Frizeri în {orasName} cu programare online</h1>
 <p className="text-base leading-relaxed oc-secondary-text">
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
 className="block rounded-xl border oc-border bg-white px-5 py-4 transition hover:oc-border hover:bg-white"
 >
 <p className="text-lg font-semibold oc-text">{prof.nume_business}</p>
 <p className="text-sm oc-secondary-text">{tipLabel(prof.tip_activitate) ?? "Programare online disponibilă"}</p>
 </Link>
 ))}
 {(profesionisti ?? []).length === 0 ? (
 <p className="rounded-xl border oc-border bg-white p-4 text-sm oc-secondary-text">
 Lucrăm la extinderea listei pentru {orasName}. Revino în curând sau caută un profesionist după recomandări.
 </p>
 ) : null}
 </section>

 <section className="rounded-2xl border oc-border oc-badge-bg p-6 text-center">
 <p className="mb-3 text-lg font-semibold">Ești frizer în {orasName}? Creează cont gratuit</p>
 <Link href="/signup?start=1" className="inline-flex rounded-lg oc-primary px-5 py-2.5 font-medium text-white hover:bg-[#D97706]">
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
 bio?: unknown;
 lucreaza_acasa: boolean;
 adresa_publica: string | null;
 program: Record<string, unknown> | null;
 };

 const selectAttempts = [
 "id,slug,nume_business,tip_activitate,description,oras,logo_url,telefon,whatsapp,bio,lucreaza_acasa,adresa_publica,program",
 "id,slug,nume_business,tip_activitate,description,oras,logo_url,telefon,bio,lucreaza_acasa,adresa_publica,program",
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

 if (isMissingProfesionistiColumn(result.error, "whatsapp") || isMissingProfesionistiColumn(result.error, "bio")) {
 error = result.error;
 continue;
 }

 error = result.error;
 break;
 }

 if (error || !prof) {
 notFound();
 }

 const serviceSelectAttempts = [
 ["id", "nume", "durata_minute", "pret", "culoare", "activ", "ordine", "is_featured"].join(","),
 ["id", "nume", "durata_minute", "pret", "culoare", "activ", "ordine"].join(",")
 ] as const;
 let servicii:
 | Array<{
 id: string;
 nume: string;
 durata_minute: number;
 pret: number;
 culoare: string;
 activ: boolean;
 ordine: number;
 is_featured?: boolean;
 }>
 | null = null;

 for (const columns of serviceSelectAttempts) {
 const result = await supabase
 .from("servicii")
 .select(columns)
 .eq("profesionist_id", prof.id)
 .eq("activ", true)
 .order("ordine", { ascending: true });

 if (!result.error) {
 servicii = (result.data ?? null) as unknown as Array<{
 id: string;
 nume: string;
 durata_minute: number;
 pret: number;
 culoare: string;
 activ: boolean;
 ordine: number;
 is_featured?: boolean;
 }>;
 break;
 }

 if (result.error.message.includes("is_featured")) {
 continue;
 }

 servicii = null;
 break;
 }

 if (!servicii?.length) {
 return (
 <div className="min-h-screen bg-gradient-to-b from-oc-cream via-oc-cream to-oc-teal-soft oc-text">
 <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
 <h1 className="text-3xl font-bold tracking-tight">{prof.nume_business}</h1>
 <p className="max-w-md oc-text">Pagina de programări este în configurare. Revenim foarte curând cu serviciile disponibile online.</p>
 {prof.telefon ? (
 <a
 href={`tel:${String(prof.telefon).replace(/\s+/g, "")}`}
 className="inline-flex items-center justify-center rounded-full oc-badge-bg px-8 py-3 text-sm font-semibold oc-text ring-1 ring-oc-teal/20 transition hover:bg-white hover:ring-oc-teal/20"
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

 // Check if the logged-in user is the owner of this salon
 const currentUser = await getUser();
 let isOwner = false;
 if (currentUser) {
 const supabase2 = await createSupabaseServerClient();
 const { data: ownerProf } = await supabase2
 .from("profesionisti")
 .select("id")
 .eq("user_id", currentUser.id)
 .eq("id", prof.id)
 .maybeSingle();
 isOwner = !!ownerProf;
 }

 const whatsapp = (prof.whatsapp as string | null)?.trim() ?? "";
 const telHref = telefon ? telefon.replace(/\s+/g, "") : "";
 const waHref = whatsapp ? whatsapp.replace(/\D+/g, "") : "";
 const waText = `Bună! Vreau o programare la ${String(prof.nume_business ?? "").trim() || "salon"}.`;
 const publicDescription = ((prof as { description?: string | null }).description ?? "").trim();
 const mediaProfile = parsePublicProfileMedia((prof as { bio?: unknown }).bio);
 const tip = tipLabel(prof.tip_activitate as string | undefined);
 const city = ((prof as { oras?: string | null }).oras ?? "").trim();

 const schemaTypeMap: Record<string, string> = {
 frizerie: "HairSalon",
 manichiura: "BeautySalon",
 coafor: "HairSalon",
 altul: "LocalBusiness"
 };
 const schemaType = schemaTypeMap[prof.tip_activitate as string] ?? "LocalBusiness";

 const localBusinessSchema = {
 "@context": "https://schema.org",
 "@type": schemaType,
 name: String(prof.nume_business ?? ""),
 description: publicDescription || undefined,
 address: {
 "@type": "PostalAddress",
 addressLocality: city || "România",
 addressCountry: "RO",
 streetAddress: String((prof as { adresa_publica?: string | null }).adresa_publica ?? "")
 },
 telephone: telefon || undefined,
 url: `https://ocupaloc.ro/${slug}`
 };

 return (
 <div className="min-h-screen bg-gradient-to-b from-oc-cream via-oc-cream to-oc-teal-soft oc-text">
 <Script id={`local-business-schema-${slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
 {isOwner ? (
 <div className="flex items-center gap-3 border-b oc-border bg-white px-4 py-2">
 <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-md border oc-border oc-badge-bg px-3 py-1.5 text-sm font-medium oc-text transition hover:bg-white">
 ← Înapoi la meniu
 </Link>
 <span className="text-xs oc-secondary-text">Ești pe pagina ta publică</span>
 </div>
 ) : null}
 <div className="mx-auto max-w-3xl space-y-14 px-6 py-14 md:space-y-16 md:py-20">
 <header className="flex flex-col items-center gap-8 text-center">
 {prof.logo_url ? (
 <Image
 src={prof.logo_url as string}
 alt={`Logo ${String(prof.nume_business ?? "salon")}`}
 width={96}
 height={96}
 className="h-24 w-24 rounded-full border oc-border object-cover shadow-lg"
 />
 ) : (
 <div
 className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-oc-amber-light to-oc-teal text-4xl font-bold tracking-tight text-white shadow-xl shadow-[0_12px_28px_-18px_rgba(245,158,11,0.45)] ring-4 ring-oc-teal/15"
 aria-hidden
 >
 {displayInitial((prof.nume_business as string) || slug)}
 </div>
 )}
 <div className="max-w-xl space-y-5">
 <h1 className="text-3xl font-bold tracking-tight oc-text md:text-4xl">{prof.nume_business}</h1>
 {tip ? (
 <p className="inline-flex rounded-full border oc-border bg-white px-5 py-2 text-sm font-medium oc-text">
 {tip}
 </p>
 ) : null}
 {publicDescription ? (
 <p className="max-w-lg text-base leading-relaxed oc-secondary-text">{publicDescription}</p>
 ) : null}
 {prof.lucreaza_acasa ? (
 <p className="text-sm oc-secondary-text">Locația exactă o primești după confirmare.</p>
 ) : prof.adresa_publica ? (
 <p className="text-sm oc-secondary-text">{prof.adresa_publica as string}</p>
 ) : null}
 {telefon || whatsapp ? (
 <div className="flex flex-wrap justify-center gap-3 pt-1">
 {telefon ? (
 <a
 href={`tel:${telHref}`}
 className="inline-flex items-center justify-center rounded-full oc-badge-bg px-8 py-3 text-sm font-semibold oc-text ring-1 ring-oc-teal/20 transition hover:bg-white hover:ring-oc-teal/20"
 >
 {telefon}
 </a>
 ) : null}
 {waHref ? (
 <a
 href={`https://wa.me/${waHref}?text=${encodeURIComponent(waText)}`}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center justify-center rounded-full bg-emerald-600/90 px-8 py-3 text-sm font-semibold text-white ring-1 ring-emerald-400/60 transition hover:bg-emerald-500"
 >
 Scrie pe WhatsApp
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

 {mediaProfile.promoVideoUrl ? (
 <section className="space-y-3">
 <div className="space-y-1 text-center">
 <h2 className="text-2xl font-semibold tracking-tight oc-text">Video prezentare</h2>
 <p className="text-sm oc-secondary-text">Material public furnizat de business.</p>
 </div>
 <div className="overflow-hidden rounded-2xl border oc-border bg-white">
          <video controls preload="metadata" className="h-auto w-full" src={mediaProfile.promoVideoUrl} />
        </div>
 </section>
 ) : null}

 {mediaProfile.trustBadges.length > 0 ? (
 <section className="space-y-3">
 <h2 className="text-center text-2xl font-semibold tracking-tight oc-text">Informații utile</h2>
 <div className="flex flex-wrap justify-center gap-2">
 {mediaProfile.trustBadges.map((badge) => (
 <span key={badge} className="rounded-full border oc-border bg-white px-4 py-2 text-xs font-medium oc-text">
 {badge}
 </span>
 ))}
 </div>
 </section>
 ) : null}
 </div>
 </div>
 );
}
