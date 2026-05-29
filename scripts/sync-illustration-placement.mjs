#!/usr/bin/env node
/**
 * Creează pe Desktop structura de foldere + PLACEMENT.md + manifest.json
 * (fără a genera imagini). Rulează după generare sau manual:
 *   node scripts/sync-illustration-placement.mjs
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { ILLUSTRATIONS } from "./illustrations-config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DESKTOP_DIR = path.join(os.homedir(), "Desktop", "ocupaloc-illustrations");
const PUBLIC_DIR = path.join(ROOT, "public", "illustrations");

const placementPath = path.join(ROOT, "src/lib/illustrations/placement.ts");
const src = fs.readFileSync(placementPath, "utf8");

/** @type {{ id: string; publicPath: string; siteLocation: string; routes: string[]; component: string; group: string }[]} */
const placements = [];
const blockRe =
  /\{\s*id:\s*"([^"]+)"[\s\S]*?publicPath:\s*"([^"]+)"[\s\S]*?siteLocation:\s*"([^"]+)"[\s\S]*?routes:\s*\[([^\]]*)\][\s\S]*?component:\s*"([^"]+)"[\s\S]*?group:\s*"([^"]+)"/g;
let m;
while ((m = blockRe.exec(src)) !== null) {
  const routes = [...m[4].matchAll(/"([^"]+)"/g)].map((r) => r[1]);
  placements.push({
    id: m[1],
    publicPath: m[2],
    siteLocation: m[3],
    routes,
    component: m[5],
    group: m[6],
  });
}

for (const img of ILLUSTRATIONS) {
  if (!placements.find((p) => p.id === img.id)) {
    console.warn(`⚠️  ${img.id} în illustrations-config dar lipsește din placement.ts`);
  }
}

function ensureDirForFile(base, relativeFile) {
  fs.mkdirSync(path.dirname(path.join(base, relativeFile)), { recursive: true });
}

function writePlaceholder(base, relativeFile) {
  const full = path.join(base, relativeFile);
  if (fs.existsSync(full)) return;
  const dir = path.dirname(full);
  fs.mkdirSync(dir, { recursive: true });
  const keep = path.join(dir, ".gitkeep");
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, "");
}

function buildPlacementMd() {
  const lines = [
    "# OcupaLoc — harta ilustrații (Desktop ↔ site)",
    "",
    "Structura de mai jos este **identică** cu `public/illustrations/` din proiect.",
    "Când muți o imagine pe site: copiază din Desktop în același `publicPath`.",
    "",
    "| ID | Fișier (publicPath) | Unde pe site | Rute | Componentă |",
    "|----|---------------------|--------------|------|------------|",
  ];
  for (const p of placements) {
    lines.push(
      `| \`${p.id}\` | \`${p.publicPath}\` | ${p.siteLocation} | ${p.routes.map((r) => `\`${r}\``).join(", ")} | \`${p.component}\` |`
    );
  }
  lines.push("", "## Foldere", "");
  const groups = [...new Set(placements.map((p) => p.group))].sort();
  for (const g of groups) {
    lines.push(`- **${g}/** — ${placements.filter((p) => p.group === g).length} imagini`);
  }
  lines.push("", "## Flux recomandat", "", "1. Generezi → salvezi în `~/Desktop/ocupaloc-illustrations/<publicPath>`", "2. Verifici în PLACEMENT.md că ID-ul e corect", "3. Copiezi batch: `pnpm illustrations:deploy` (sau manual în `public/illustrations/`)", "");
  return lines.join("\n");
}

function main() {
  fs.mkdirSync(DESKTOP_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  for (const p of placements) {
    writePlaceholder(DESKTOP_DIR, p.publicPath);
    writePlaceholder(PUBLIC_DIR, p.publicPath);
    ensureDirForFile(DESKTOP_DIR, p.publicPath);
    ensureDirForFile(PUBLIC_DIR, p.publicPath);
  }

  const manifest = placements.map((p) => ({
    id: p.id,
    group: p.group,
    desktopPath: path.join(DESKTOP_DIR, p.publicPath),
    publicPath: p.publicPath,
    siteUrl: p.routes[0] === "/" ? "https://ocupaloc.ro/" : `https://ocupaloc.ro${p.routes.find((r) => r !== "/") ?? p.routes[0]}`,
    siteLocation: p.siteLocation,
    routes: p.routes,
    component: p.component,
    existsOnDesktop: fs.existsSync(path.join(DESKTOP_DIR, p.publicPath)),
  }));

  fs.writeFileSync(path.join(DESKTOP_DIR, "PLACEMENT.md"), buildPlacementMd());
  fs.writeFileSync(path.join(DESKTOP_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(PUBLIC_DIR, "PLACEMENT.md"), buildPlacementMd());

  console.log(`✅ Desktop: ${DESKTOP_DIR}`);
  console.log(`✅ Public mirror: ${PUBLIC_DIR}`);
  console.log(`📋 ${placements.length} sloturi definite în PLACEMENT.md + manifest.json`);
}

main();
