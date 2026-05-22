#!/usr/bin/env node
/**
 * Weekly SEO check (Ziua 7, 14, 21…): sitemap + GSC metrics template.
 *
 * Usage:
 *   pnpm seo:weekly-check
 *   pnpm seo:weekly-check -- --plan-day=14 --indexed-pages=25 --clicks=14 ...
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP_URL = "https://ocupaloc.ro/sitemap.xml";
const INDEXED_TARGET = 30;

function readFlagValue(flag) {
  const eq = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  const next = process.argv[index + 1];
  if (next == null || next.startsWith("--")) return null;
  return next;
}

function parseArg(flag) {
  const raw = readFlagValue(flag);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseStringArg(flag) {
  return readFlagValue(flag);
}

function deltaPercent(current, previous) {
  if (previous == null) return "—";
  if (previous === 0) return current === 0 ? "0.0%" : "n/a";
  const value = ((current - previous) / previous) * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function trendLabel(current, previous) {
  if (previous == null || current == null) return "—";
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

function statusIndexed(count) {
  if (count == null) return "⏸ completează din GSC";
  if (count >= INDEXED_TARGET) return `✅ ≥ ${INDEXED_TARGET}`;
  return `⚠️ sub țintă (${INDEXED_TARGET})`;
}

function parseTopPages(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [url, clicks, impressions] = entry.split("|").map((s) => s.trim());
      return { url, clicks: clicks ?? "—", impressions: impressions ?? "—" };
    });
}

async function fetchSitemapUrlCount() {
  const res = await fetch(SITEMAP_URL, { headers: { "User-Agent": "ocupaloc-seo-weekly-check" } });
  if (!res.ok) throw new Error(`sitemap fetch ${res.status}`);
  const xml = await res.text();
  return (xml.match(/<loc>/g) ?? []).length;
}

async function run() {
  const reportDate = new Date().toISOString().slice(0, 10);
  const planDay = parseArg("--plan-day") ?? 7;
  const sitemapUrls = await fetchSitemapUrlCount();

  const indexedPages = parseArg("--indexed-pages");
  const indexedPagesPrev = parseArg("--indexed-pages-prev");
  const notIndexed = parseArg("--not-indexed");
  const impressions = parseArg("--impressions");
  const impressionsPrev = parseArg("--impressions-prev");
  const clicks = parseArg("--clicks");
  const clicksPrev = parseArg("--clicks-prev");
  const ctr = parseArg("--ctr");
  const ctrPrev = parseArg("--ctr-prev");
  const position = parseArg("--position");
  const positionPrev = parseArg("--position-prev");
  const keywordsRaw = parseStringArg("--keywords");
  const topPagesRaw = parseStringArg("--top-pages");
  const keywords = keywordsRaw
    ? keywordsRaw
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : [];
  const topPages = parseTopPages(topPagesRaw);

  const docLink =
    planDay === 14
      ? "[ziua-14-weekly-check.md](../docs/seo-progress/ziua-14-weekly-check.md)"
      : "[ziua-07-weekly-check.md](../docs/seo-progress/ziua-07-weekly-check.md)";

  const lines = [
    `# SEO Weekly Check — ${reportDate}`,
    "",
    `**Plan:** Ziua ${planDay} — Google Search Console · ${docLink}`,
    "",
    "## Rezumat",
    "",
    `| Indicator | Valoare | WoW / trend |`,
    `| --- | ---: | --- |`,
    `| URL-uri în sitemap (live) | **${sitemapUrls}** | — |`,
    `| Pagini indexate (GSC) | ${indexedPages ?? "—"} | ${statusIndexed(indexedPages)} |`,
    `| Neindexate (GSC) | ${notIndexed ?? "—"} | — |`,
    `| Clicuri (7 zile) | ${clicks ?? "—"} | ${deltaPercent(clicks ?? 0, clicksPrev)} ${trendLabel(clicks, clicksPrev)} |`,
    `| Impresii (7 zile) | ${impressions ?? "—"} | ${deltaPercent(impressions ?? 0, impressionsPrev)} ${trendLabel(impressions, impressionsPrev)} |`,
    `| CTR mediu | ${ctr != null ? `${ctr}%` : "—"} | ${deltaPercent(ctr ?? 0, ctrPrev)} |`,
    `| Poziție medie | ${position ?? "—"} | ${positionPrev != null && position != null ? (position < positionPrev ? "↑ mai bun" : position > positionPrev ? "↓ mai slab" : "→") : "—"} |`,
    "",
    "## Performanță (7 zile vs. 7 zile anterioare)",
    "",
    "| Metrică | Săptămâna curentă | Săptămâna trecută | Δ % |",
    "| --- | ---: | ---: | ---: |",
    `| Clicuri | ${clicks ?? "—"} | ${clicksPrev ?? "—"} | ${deltaPercent(clicks ?? 0, clicksPrev)} |`,
    `| Impresii | ${impressions ?? "—"} | ${impressionsPrev ?? "—"} | ${deltaPercent(impressions ?? 0, impressionsPrev)} |`,
    `| CTR mediu | ${ctr != null ? `${ctr}%` : "—"} | ${ctrPrev != null ? `${ctrPrev}%` : "—"} | ${deltaPercent(ctr ?? 0, ctrPrev)} |`,
    `| Poziție medie | ${position ?? "—"} | ${positionPrev ?? "—"} | — |`,
    `| Pagini indexate | ${indexedPages ?? "—"} | ${indexedPagesPrev ?? "—"} | ${deltaPercent(indexedPages ?? 0, indexedPagesPrev)} |`,
    "",
    "### Top 3 pagini după clicuri",
    "",
    topPages.length
      ? [
          "| Pagină | Clicuri | Impresii |",
          "| --- | ---: | ---: |",
          ...topPages.slice(0, 3).map((p) => `| ${p.url} | ${p.clicks} | ${p.impressions} |`)
        ].join("\n")
      : "_Completează cu `--top-pages=\"url|clicks|impressions,...\"` din GSC → Performanță → Pagini._",
    "",
    "### Keywords în top 10 (poziție 1–10)",
    "",
    keywords.length
      ? keywords.map((k) => `- ${k}`).join("\n")
      : "_Copiază din GSC → Performanță → Interogări (poziție ≤ 10)._",
    "",
    "## Acțiuni săptămâna viitoare",
    "",
    "- [ ] Indexare: 5–10 URL din [seo-index-queue-next-day.md](../docs/seo-index-queue-next-day.md)",
    "- [ ] Deploy articole blog nepublicate (404 pe producție dacă lipsesc)",
    "- [ ] `pnpm seo:audit-sitemap` după deploy",
    "- [ ] Ziua 15: guest post outreach (5 bloguri beauty)",
    "",
    "## Comandă (actualizează cifrele)",
    "",
    "```bash",
    `pnpm seo:weekly-check -- --plan-day=${planDay} \\`,
    "  --indexed-pages=N --indexed-pages-prev=N --not-indexed=N \\",
    "  --clicks=N --clicks-prev=N --impressions=N --impressions-prev=N \\",
    "  --ctr=N --ctr-prev=N --position=N --position-prev=N \\",
    '  --top-pages="https://ocupaloc.ro/|11|20,https://ocupaloc.ro/demo|2|6" \\',
    '  --keywords="programari online salon,ocupaloc"',
    "```",
    ""
  ];

  const reportPath = path.join(ROOT, "reports", `seo-weekly-${reportDate}.md`);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, lines.join("\n"), "utf8");

  const latestPath = path.join(ROOT, "reports", "seo-weekly-latest.md");
  await writeFile(latestPath, lines.join("\n"), "utf8");

  console.log(`Plan day: ${planDay}`);
  console.log(`Sitemap URLs: ${sitemapUrls}`);
  console.log(`Indexed: ${indexedPages ?? "not set"} | Not indexed: ${notIndexed ?? "?"}`);
  console.log(`Clicks WoW: ${clicks ?? "?"} vs ${clicksPrev ?? "?"} → ${deltaPercent(clicks ?? 0, clicksPrev)}`);
  console.log(`Impressions WoW: ${impressions ?? "?"} vs ${impressionsPrev ?? "?"} → ${deltaPercent(impressions ?? 0, impressionsPrev)}`);
  console.log(`CTR: ${ctr ?? "?"}% | Position: ${position ?? "?"}`);
  console.log(`Saved: ${reportPath}`);
  console.log(`Saved: ${latestPath}`);

  if (indexedPages == null || clicks == null) {
    console.log("\nNext: GSC → Performanță (7 zile), copiază metricile, re-rulează cu flag-uri.");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
