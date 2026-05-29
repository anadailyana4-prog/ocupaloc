#!/usr/bin/env node
/**
 * Generează ilustrații aliniate site → ~/Desktop/ocupaloc-illustrations/<publicPath>
 *
 * Modele (APIYI):
 *   gpt-image-2-vip     — $0.03/img, size fix (default)
 *   gpt-image-2-all     — $0.03/img, text RO bun, ~30–60s
 *   gpt-image-2         — oficial; quality=medium ~$0.04/img 1536×1024, mai consistent
 *
 * Preview:  APIYI_API_KEY=sk-... node scripts/generate-ocupaloc-illustrations.mjs --only=01-hero
 * Batch:     OCUPALOC_IMAGES_CONFIRM=1 APIYI_API_KEY=sk-... node scripts/...
 *
 * Model mai bun fără să explodeze bugetul (17 img):
 *   APIYI_IMAGE_MODEL=gpt-image-2 APIYI_IMAGE_QUALITY=medium ...
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ILLUSTRATIONS } from "./illustrations-config.mjs";

const API_BASE = process.env.APIYI_BASE_URL ?? "https://api.apiyi.com/v1";
const MODEL = process.env.APIYI_IMAGE_MODEL ?? "gpt-image-2-vip";
const QUALITY = process.env.APIYI_IMAGE_QUALITY ?? "medium";
const OUT_DIR =
  process.env.OCUPALOC_ILLUSTRATIONS_DIR ??
  path.join(os.homedir(), "Desktop", "ocupaloc-illustrations");

const ESTIMATED_USD = {
  "gpt-image-2-vip": 0.03,
  "gpt-image-2-all": 0.03,
  "gpt-image-2": { low: 0.005, medium: 0.041, high: 0.165 },
};

function parseArg(prefix) {
  const arg = process.argv.find((a) => a.startsWith(`${prefix}=`));
  if (!arg) return null;
  return arg.slice(prefix.length + 1).trim();
}

function filterList() {
  const only = parseArg("--only");
  const group = parseArg("--group");
  let list = ILLUSTRATIONS;
  if (only) {
    list = list.filter((i) => i.id === only || i.publicPath.includes(only));
  }
  if (group) {
    list = list.filter((i) => i.group === group);
  }
  return list;
}

function estimateCost(count) {
  const m = ESTIMATED_USD[MODEL];
  if (typeof m === "number") return m * count;
  if (m && typeof m === "object") return (m[QUALITY] ?? m.medium) * count;
  return null;
}

function buildBody(item) {
  const base = { model: MODEL, prompt: item.prompt, n: 1 };
  if (MODEL === "gpt-image-2") {
    return { ...base, size: item.size, quality: QUALITY };
  }
  return { ...base, size: item.size };
}

async function generateOne(apiKey, item) {
  const res = await fetch(`${API_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildBody(item)),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON (${res.status}): ${text.slice(0, 400)}`);
  }
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
  }
  const item0 = json?.data?.[0];
  const b64 = item0?.b64_json;
  if (b64) {
    const raw = String(b64).replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(raw, "base64");
  }
  const url = item0?.url;
  if (url) {
    const img = await fetch(url);
    if (!img.ok) throw new Error(`Image download ${img.status}`);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error("Missing data[0].b64_json or url");
}

async function main() {
  const apiKey = process.env.APIYI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Lipsește APIYI_API_KEY → https://api.apiyi.com/token");
    process.exit(1);
  }

  const list = filterList();
  if (list.length > 1 && !process.env.OCUPALOC_IMAGES_CONFIRM) {
    const est = estimateCost(list.length);
    console.error(
      `Batch: ${list.length} imagini, model=${MODEL}` +
        (est != null ? `, estimat ~$${est.toFixed(2)}` : "") +
        "\nMai întâi: --only=01-hero\nApoi: OCUPALOC_IMAGES_CONFIRM=1 ..."
    );
    process.exit(1);
  }
  if (list.length === 0) {
    console.error("Niciun asset pentru --only / --group");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];
  const est = estimateCost(list.length);

  console.log(`\n📁 ${OUT_DIR}`);
  console.log(`🤖 ${MODEL}${MODEL === "gpt-image-2" ? ` (quality=${QUALITY})` : ""}`);
  if (est != null) console.log(`💰 Estimat batch: ~$${est.toFixed(2)} (${list.length} img)\n`);

  for (const item of list) {
    const outPath = path.join(OUT_DIR, item.publicPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    console.log("─".repeat(60));
    console.log(`🖼️  ${item.titleRo}`);
    console.log(`    Site: public/illustrations/${item.publicPath}`);

    try {
      const buf = await generateOne(apiKey, item);
      fs.writeFileSync(outPath, buf);
      console.log(`    ✅ ${outPath} (${(buf.length / 1024).toFixed(0)} KB)`);
      manifest.push({ ...item, desktopPath: outPath, model: MODEL, ok: true });
    } catch (err) {
      console.error(`    ❌ ${err.message}`);
      manifest.push({ ...item, desktopPath: outPath, model: MODEL, ok: false, error: err.message });
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, "last-generation.json"), JSON.stringify(manifest, null, 2));
  console.log("\nGata. Verifică PNG pe Desktop, apoi aprobă înainte de următoarea.\n");
}

main();
