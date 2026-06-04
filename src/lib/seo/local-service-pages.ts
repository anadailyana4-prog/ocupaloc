import { ORASE_TARGET } from "@/lib/seo/orase-target";

/** Orașe cu landing `/[oras]/[serviciu]` — aliniat la sitemap și `ORASE_TARGET`. */
export const LOCAL_SERVICE_CITIES = ORASE_TARGET;

export const LOCAL_SERVICES = ["frizerie", "salon", "manichiura", "cosmetica", "barber"] as const;

export type LocalServiceCity = (typeof LOCAL_SERVICE_CITIES)[number];
export type LocalServiceSlug = (typeof LOCAL_SERVICES)[number];

const detailedCityCopy: Partial<Record<LocalServiceCity, [string, string]>> = {
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

export function cityDisplay(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function serviceDisplay(slug: string): string {
  const labels: Record<string, string> = {
    frizerie: "frizerie",
    salon: "salon",
    manichiura: "manichiură",
    cosmetica: "cosmetică",
    barber: "barber"
  };
  return labels[slug] ?? slug;
}

export function cityServiceCopy(slug: LocalServiceCity): [string, string] {
  const existing = detailedCityCopy[slug];
  if (existing) return existing;
  const oras = cityDisplay(slug);
  return [
    `Saloanele și frizeriile din ${oras} trec tot mai des la programări online pentru a reduce apelurile și golurile din agendă.`,
    `Clienții din ${oras} așteaptă rezervare rapidă din telefon; un link clar de programare îți crește conversia și imaginea profesională.`
  ];
}

export function isLocalServiceCity(slug: string): slug is LocalServiceCity {
  return (LOCAL_SERVICE_CITIES as readonly string[]).includes(slug);
}

export function isLocalServiceSlug(serviciu: string): serviciu is LocalServiceSlug {
  return (LOCAL_SERVICES as readonly string[]).includes(serviciu);
}
