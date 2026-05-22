#!/usr/bin/env node
/**
 * Ziua 2 SEO — pregătește 10 imagini pentru upload în Google Business Profile.
 * Output: marketing/gbp-upload/*.png (gitignored)
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "marketing", "gbp-upload");

const assets = [
  ["01-logo-brand", "public/illustrations/loading/ocupaloc-brand.png"],
  ["02-hero-programari", "public/illustrations/homepage/hero-programari-online.png"],
  ["03-dashboard", "public/illustrations/dashboard/dashboard-profesionist.png"],
  ["04-client-mobil", "public/illustrations/homepage/client-rezervare-mobil.png"],
  ["05-link-rezervare", "public/illustrations/homepage/trimite-link-rezervare.png"],
  ["06-pret-fix", "public/illustrations/preturi/pret-fix-fara-comision.png"],
  ["07-saloane", "public/illustrations/pentru-cine/saloane.png"],
  ["08-frizerii", "public/illustrations/pentru-cine/frizerii.png"],
  ["09-manichiura", "public/illustrations/pentru-cine/manichiura.png"],
  ["10-coafor", "public/illustrations/pentru-cine/coafor.png"]
];

mkdirSync(outDir, { recursive: true });

for (const [name, rel] of assets) {
  const src = join(root, rel);
  const dest = join(outDir, `${name}.png`);
  if (!existsSync(src)) {
    console.error(`Lipsește sursa: ${rel}`);
    process.exit(1);
  }
  copyFileSync(src, dest);
  console.log(`✓ ${name}.png`);
}

console.log(`\nGata: ${outDir}`);
console.log("Urcă fișierele în Google Business → Fotografii (ordinea din nume).");
