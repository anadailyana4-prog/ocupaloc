#!/usr/bin/env node
/**
 * Verifică status HTTP pentru toate URL-urile din sitemap.xml live.
 * Usage: node scripts/audit-sitemap-production.mjs
 */
const SITEMAP_URL = process.env.SITEMAP_URL ?? "https://ocupaloc.ro/sitemap.xml";

async function fetchUrls() {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function status(url) {
  const res = await fetch(url, { redirect: "follow" });
  return res.status;
}

async function main() {
  const urls = await fetchUrls();
  const bad = [];
  for (const url of urls) {
    const code = await status(url);
    if (code !== 200) bad.push({ url, code });
  }
  console.log(`Checked ${urls.length} URLs from ${SITEMAP_URL}`);
  if (!bad.length) {
    console.log("All URLs return 200.");
    return;
  }
  console.log(`\n${bad.length} non-200:`);
  for (const row of bad) console.log(`  ${row.code} ${row.url}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
