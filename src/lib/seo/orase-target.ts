/** Orașe cu pagină landing `/[oras]` — trebuie să fie în sync cu `ORASE` din sitemap. */
export const ORASE_TARGET = [
  "bucuresti",
  "cluj-napoca",
  "timisoara",
  "iasi",
  "constanta",
  "brasov",
  "sibiu",
  "oradea",
  "craiova",
  "galati",
  "ploiesti",
  "buzau",
  "satu-mare",
  "bacau",
  "pitesti"
] as const;

export type OrasTarget = (typeof ORASE_TARGET)[number];
