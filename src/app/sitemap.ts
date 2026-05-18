import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

const ORASE = ["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "sibiu", "oradea"] as const;
const BLOG_SLUGS = [
  "fresha-cat-costa-romania",
  "cum-sa-reduci-anularile",
  "telefon-vs-programari-online"
] as const;
const COMPARATIV_SLUGS = ["fresha", "treatwell", "booksy", "stailer"] as const;
const ORASE_LOCALE = ["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "oradea", "sibiu"] as const;
const SERVICII_LOCALE = ["frizerie", "salon", "manichiura", "cosmetica", "barber"] as const;
const STATIC_LAST_MODIFIED = new Date("2026-05-18");

type SitemapEntry = {
  route: string;
  priority: number;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
};

const MONEY_PAGES = [
  "/programari-online-salon",
  "/alternativa-fresha-romania",
  "/software-programari-manichiura",
  "/aplicatie-programari-frizerie",
  "/programari-online-cosmetica",
  "/programari-online-psiholog",
  "/software-programari-clinica",
  "/programari-online-coafor",
  "/programari-online-spa-masaj",
  "/programari-online-nutritionist"
] as const;

function staticEntry(route: string): SitemapEntry {
  if (route === "") {
    return { route, priority: 1, changeFrequency: "weekly" };
  }

  if ((MONEY_PAGES as readonly string[]).includes(route)) {
    return { route, priority: 0.9, changeFrequency: "weekly" };
  }

  if (route.startsWith("/comparativ/")) {
    return { route, priority: 0.85, changeFrequency: "weekly" };
  }

  if (route.startsWith("/blog/")) {
    return { route, priority: 0.75, changeFrequency: "monthly" };
  }

  if (route.split("/").length === 3 && ORASE_LOCALE.some((oras) => route.startsWith(`/${oras}/`))) {
    return { route, priority: 0.8, changeFrequency: "weekly" };
  }

  if ((ORASE as readonly string[]).some((oras) => route === `/${oras}`)) {
    return { route, priority: 0.75, changeFrequency: "weekly" };
  }

  return { route, priority: 0.6, changeFrequency: "monthly" };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/preturi",
    "/despre",
    "/suport",
    "/confidentialitate",
    "/termeni",
    "/cookies",
    "/gdpr",
    "/blog",
    "/demo-interactiv",
    "/programari-online-salon",
    "/alternativa-fresha-romania",
    "/software-programari-manichiura",
    "/aplicatie-programari-frizerie",
    "/programari-online-cosmetica",
    "/programari-online-psiholog",
    "/software-programari-clinica",
    "/programari-online-coafor",
    "/programari-online-spa-masaj",
    "/programari-online-nutritionist",
    ...COMPARATIV_SLUGS.map((slug) => `/comparativ/${slug}`),
    ...ORASE_LOCALE.flatMap((oras) => SERVICII_LOCALE.map((serviciu) => `/${oras}/${serviciu}`)),
    ...BLOG_SLUGS.map((slug) => `/blog/${slug}`),
    ...ORASE.map((oras) => `/${oras}`)
  ];

  const staticPages: MetadataRoute.Sitemap = routes.map(staticEntry).map((entry) => ({
    url: `${SITE_URL}${entry.route}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    return staticPages;
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: rows } = await supabase.from("profesionisti_public").select("slug, created_at").not("slug", "is", null);

  const profilPages: MetadataRoute.Sitemap = (rows ?? [])
    .filter((item) => Boolean(item.slug))
    .map((item) => ({
      url: `${SITE_URL}/${item.slug}`,
      lastModified: item.created_at ? new Date(item.created_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.9
    }));

  return [...staticPages, ...profilPages];
}
