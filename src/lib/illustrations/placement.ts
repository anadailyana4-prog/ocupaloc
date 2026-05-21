/**
 * Registru imagini OcupaLoc — sursa de adevăr pentru unde merge fiecare fișier.
 * Desktop: ~/Desktop/ocupaloc-illustrations/ (aceeași structură ca publicPath)
 * Site:    public/illustrations/...
 */

export type IllustrationPlacement = {
  id: string;
  /** Cale relativă în public/illustrations și pe Desktop */
  publicPath: string;
  /** Unde apare în UI */
  siteLocation: string;
  /** Rute / componente */
  routes: string[];
  component: string;
  alt: string;
  group: "homepage" | "pentru-cine" | "landing-seo" | "preturi" | "dashboard" | "loading";
};

export const ILLUSTRATION_PLACEMENTS: IllustrationPlacement[] = [
  {
    id: "01-hero",
    publicPath: "homepage/hero-programari-online.png",
    siteLocation: "Homepage — hero (lângă titlu, înlocuiește sau completează cardul demo)",
    routes: ["/"],
    component: "src/components/landing/LandingPage.tsx — secțiune hero grid",
    alt: "Programări online pentru saloane și servicii locale",
    group: "homepage",
  },
  {
    id: "02-client-flow",
    publicPath: "homepage/client-rezervare-mobil.png",
    siteLocation: "Homepage — „Cum funcționează” pasul 2 (client rezervă singur)",
    routes: ["/"],
    component: "LandingPage.tsx — #cum-functioneaza",
    alt: "Client care rezervă programarea de pe telefon",
    group: "homepage",
  },
  {
    id: "03-dashboard",
    publicPath: "dashboard/dashboard-profesionist.png",
    siteLocation: "Homepage — social proof / demo + Dashboard loading fallback",
    routes: ["/", "/dashboard"],
    component: "LandingPage.tsx + src/app/(dashboard)/loading.tsx",
    alt: "Panou profesionist OcupaLoc cu programări și KPI",
    group: "dashboard",
  },
  {
    id: "04-pricing",
    publicPath: "preturi/pret-fix-fara-comision.png",
    siteLocation: "Pagina prețuri — lângă planul 59,99 RON",
    routes: ["/preturi"],
    component: "src/app/preturi/page.tsx",
    alt: "Abonament fix fără comision per programare",
    group: "preturi",
  },
  {
    id: "05-share-link",
    publicPath: "homepage/trimite-link-rezervare.png",
    siteLocation: "Homepage — pasul 1 (primești link de rezervare)",
    routes: ["/"],
    component: "LandingPage.tsx — #cum-functioneaza pasul 1",
    alt: "Profesionist care trimite linkul de rezervare clienților",
    group: "homepage",
  },
  {
    id: "niche-saloane",
    publicPath: "pentru-cine/saloane.png",
    siteLocation: "Homepage — card „Saloane” + hero landing SEO salon",
    routes: ["/", "/programari-online-salon"],
    component: "LandingPage.tsx #pentru-cine + programari-online-salon/page.tsx",
    alt: "Programări online pentru saloane beauty",
    group: "pentru-cine",
  },
  {
    id: "niche-frizerii",
    publicPath: "pentru-cine/frizerii.png",
    siteLocation: "Homepage — card „Frizerii” + hero /aplicatie-programari-frizerie",
    routes: ["/", "/aplicatie-programari-frizerie"],
    component: "LandingPage.tsx + aplicatie-programari-frizerie/page.tsx",
    alt: "Aplicație programări pentru frizerii",
    group: "pentru-cine",
  },
  {
    id: "niche-coafor",
    publicPath: "pentru-cine/coafor.png",
    siteLocation: "Homepage — card „Coafor” + hero /programari-online-coafor",
    routes: ["/", "/programari-online-coafor"],
    component: "LandingPage.tsx + programari-online-coafor/page.tsx",
    alt: "Programări online pentru coafor",
    group: "pentru-cine",
  },
  {
    id: "niche-manichiura",
    publicPath: "pentru-cine/manichiura.png",
    siteLocation: "Homepage — card „Manichiură” + hero /software-programari-manichiura",
    routes: ["/", "/software-programari-manichiura"],
    component: "LandingPage.tsx + software-programari-manichiura/page.tsx",
    alt: "Software programări manichiură",
    group: "pentru-cine",
  },
  {
    id: "niche-cosmetica",
    publicPath: "pentru-cine/cosmetica.png",
    siteLocation: "Homepage — card „Cosmetică” + hero /programari-online-cosmetica",
    routes: ["/", "/programari-online-cosmetica"],
    component: "LandingPage.tsx + programari-online-cosmetica/page.tsx",
    alt: "Programări online cosmetică și tratamente",
    group: "pentru-cine",
  },
  {
    id: "niche-psihologi",
    publicPath: "pentru-cine/psihologi.png",
    siteLocation: "Homepage — card „Psihologi” + hero /programari-online-psiholog",
    routes: ["/", "/programari-online-psiholog"],
    component: "LandingPage.tsx + programari-online-psiholog/page.tsx",
    alt: "Programări online cabinet psihologie",
    group: "pentru-cine",
  },
  {
    id: "niche-nutritionisti",
    publicPath: "pentru-cine/nutritionisti.png",
    siteLocation: "Homepage — card „Nutriționiști” + hero /programari-online-nutritionist",
    routes: ["/", "/programari-online-nutritionist"],
    component: "LandingPage.tsx + programari-online-nutritionist/page.tsx",
    alt: "Programări online nutriționist",
    group: "pentru-cine",
  },
  {
    id: "niche-clinici",
    publicPath: "pentru-cine/clinici.png",
    siteLocation: "Homepage — card „Clinici” (fără landing SEO dedicat încă)",
    routes: ["/"],
    component: "LandingPage.tsx #pentru-cine",
    alt: "Programări online pentru clinici și cabinete",
    group: "pentru-cine",
  },
  {
    id: "niche-spa-masaj",
    publicPath: "landing-seo/spa-masaj.png",
    siteLocation: "Hero /programari-online-spa-masaj (nu e în grid homepage)",
    routes: ["/programari-online-spa-masaj"],
    component: "programari-online-spa-masaj/page.tsx",
    alt: "Programări online spa și masaj",
    group: "landing-seo",
  },
  {
    id: "loading-brand",
    publicPath: "loading/ocupaloc-brand.png",
    siteLocation: "Loading global app / auth / signup",
    routes: ["/login", "/signup", "/demo"],
    component: "src/app/loading.tsx (root)",
    alt: "Se încarcă OcupaLoc",
    group: "loading",
  },
  {
    id: "loading-slots",
    publicPath: "loading/sloturi.png",
    siteLocation: "Loading la încărcarea sloturilor în BookingCard / pagini publice slug",
    routes: ["/demo-interactiv", "/pagina-publica-rezervare"],
    component: "BookingCard.tsx + src/app/[slug]/loading.tsx",
    alt: "Se încarcă sloturile disponibile",
    group: "loading",
  },
  {
    id: "loading-confirm",
    publicPath: "loading/confirmare.png",
    siteLocation: "Loading după submit programare (API /book)",
    routes: ["/pagina-publica-rezervare"],
    component: "BookingCard.tsx — stare submitting",
    alt: "Se confirmă programarea",
    group: "loading",
  },
];

export function illustrationSrc(publicPath: string): string {
  return `/illustrations/${publicPath}`;
}

export function placementById(id: string): IllustrationPlacement | undefined {
  return ILLUSTRATION_PLACEMENTS.find((p) => p.id === id);
}
