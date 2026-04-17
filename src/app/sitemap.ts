import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const ORASE = ["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "sibiu", "oradea"] as const;
const BLOG_SLUGS = [
  "fresha-cat-costa-romania",
  "cum-sa-reduci-anularile",
  "telefon-vs-programari-online"
] as const;
const COMPARATIV_SLUGS = ["fresha", "treatwell", "booksy", "stailer"] as const;
const ORASE_LOCALE = ["bucuresti", "cluj-napoca", "timisoara", "iasi", "constanta", "brasov", "oradea", "sibiu"] as const;
const SERVICII_LOCALE = ["frizerie", "salon", "manichiura", "cosmetica", "barber"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ocupaloc.ro";

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/signup",
    "/login",
    "/preturi",
    "/despre",
    "/blog",
    "/demo-interactiv",
    "/programari-online-salon",
    "/alternativa-fresha-romania",
    "/software-programari-manichiura",
    "/aplicatie-programari-frizerie",
    "/programari-online-cosmetica",
    ...COMPARATIV_SLUGS.map((slug) => `/comparativ/${slug}`),
    ...ORASE_LOCALE.flatMap((oras) => SERVICII_LOCALE.map((serviciu) => `/${oras}/${serviciu}`)),
    ...BLOG_SLUGS.map((slug) => `/blog/${slug}`),
    ...ORASE.map((oras) => `/${oras}`)
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority:
      route === ""
        ? 1
        : [
              "/programari-online-salon",
              "/alternativa-fresha-romania",
              "/software-programari-manichiura",
              "/aplicatie-programari-frizerie",
              "/programari-online-cosmetica"
            ].includes(route)
          ? 0.9
          : 0.8
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    return staticPages;
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: rows } = await supabase.from("profesionisti").select("slug, created_at").not("slug", "is", null);

  const profilPages: MetadataRoute.Sitemap = (rows ?? [])
    .filter((item) => Boolean(item.slug))
    .map((item) => ({
      url: `${baseUrl}/${item.slug}`,
      lastModified: item.created_at ? new Date(item.created_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.9
    }));

  return [...staticPages, ...profilPages];
}
