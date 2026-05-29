import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

import { ORASE_TARGET } from "@/lib/seo/orase-target";

const ORASE = ORASE_TARGET;
const BLOG_SLUGS = [
  "cost-deschidere-salon-romania",
  "produse-profesionale-salon",
  "design-interior-salon",
  "cum-sa-angajezi-frizeri",
  "ghid-seo-saloane-romania",
  "cum-sa-cresti-salon-fara-buget",
  "retentie-clienti-salon",
  "ghid-fiscal-salon-romania",
  "fresha-cat-costa-romania",
  "cum-sa-reduci-anularile",
  "telefon-vs-programari-online",
  "alternativa-booksy-romania",
  "programari-online-fara-comision",
  "software-programari-cabinet-medic"
] as const;
const COMPARATIV_SLUGS = ["fresha", "treatwell", "booksy", "stailer"] as const;
const ORASE_LOCALE = ["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "oradea", "sibiu"] as const;
const SERVICII_LOCALE = ["frizerie", "salon", "manichiura", "cosmetica", "barber"] as const;
const HIGH_INTENT_ROUTES = new Set([
  "/demo-interactiv",
  "/programari-online-salon",
  "/alternativa-fresha-romania",
  "/software-programari-manichiura",
  "/aplicatie-programari-frizerie",
  "/aplicatie-programari-salon",
  "/programari-online-cosmetica",
  "/programari-online-psiholog",
  "/software-programari-clinica",
  "/programari-online-coafor",
  "/programari-online-spa-masaj",
  "/programari-online-nutritionist",
  "/preturi",
  "/ghid-programari-salon",
  "/cazuri-de-succes",
  "/intrebari-frecvente",
  "/resurse"
]);

function getStaticPriority(route: string): number {
  if (route === "") return 1;
  if (HIGH_INTENT_ROUTES.has(route)) return 0.9;
  if (route === "/blog" || route.startsWith("/blog/")) return 0.8;
  if (route.startsWith("/comparativ/")) return 0.75;
  if (route.split("/").length === 3) return 0.7;
  if (ORASE.includes(route.replace("/", "") as (typeof ORASE)[number])) return 0.6;
  return 0.5;
}

function getStaticChangeFrequency(route: string): MetadataRoute.Sitemap[number]["changeFrequency"] {
  if (route === "" || HIGH_INTENT_ROUTES.has(route)) return "weekly";
  if (route === "/blog" || route.startsWith("/blog/")) return "weekly";
  if (route.startsWith("/comparativ/") || route.split("/").length === 3) return "weekly";
  if (["/termeni", "/confidentialitate", "/cookies", "/gdpr"].includes(route)) return "monthly";
  return "monthly";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ocupaloc.ro";

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/despre",
    "/termeni",
    "/confidentialitate",
    "/cookies",
    "/changelog",
    "/suport",
    "/demo-interactiv",
    "/blog",
    "/ghid-programari-salon",
    "/cazuri-de-succes",
    "/intrebari-frecvente",
    "/resurse",
    "/calculator-roi",
    "/programari-online-salon",
    "/alternativa-fresha-romania",
    "/software-programari-manichiura",
    "/aplicatie-programari-frizerie",
    "/aplicatie-programari-salon",
    "/programari-online-cosmetica",
    "/programari-online-psiholog",
    "/software-programari-clinica",
    "/programari-online-coafor",
    "/programari-online-spa-masaj",
    "/programari-online-nutritionist",
    "/preturi",
    ...COMPARATIV_SLUGS.map((slug) => `/comparativ/${slug}`),
    ...ORASE_LOCALE.flatMap((oras) => SERVICII_LOCALE.map((serviciu) => `/${oras}/${serviciu}`)),
    ...BLOG_SLUGS.map((slug) => `/blog/${slug}`),
    ...ORASE.map((oras) => `/${oras}`)
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: getStaticChangeFrequency(route),
    priority: getStaticPriority(route)
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRole) {
    return staticPages;
  }

  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
      return staticPages;
    }
  } catch {
    return staticPages;
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: rows } = await supabase
    .from("profesionisti_public")
    .select("id, slug, created_at")
    .not("slug", "is", null);

  // Doar profilele cu cel puțin un serviciu activ ajung în sitemap. Restul sunt
  // pagini „în configurare" (thin content) marcate noindex — nu le trimitem la Google.
  const { data: serviceRows } = await supabase.from("servicii").select("profesionist_id").eq("activ", true);
  const profWithServices = new Set((serviceRows ?? []).map((row) => row.profesionist_id as string));

  const profilPages: MetadataRoute.Sitemap = (rows ?? [])
    .filter((item) => Boolean(item.slug) && profWithServices.has(item.id as string))
    .map((item) => ({
      url: `${baseUrl}/${item.slug}`,
      lastModified: item.created_at ? new Date(item.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.6
    }));

  return [...staticPages, ...profilPages];
}
