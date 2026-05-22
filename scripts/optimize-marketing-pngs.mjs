#!/usr/bin/env node
/**
 * Resize + compress marketing PNGs under public/illustrations/.
 * Safe to re-run; overwrites files in place after a size check.
 */
import { readdir, stat, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ILLUSTRATIONS_DIR = path.join(ROOT, "public", "illustrations");
const MAX_WIDTH = 1400;

async function* walkPngs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkPngs(full);
    } else if (entry.isFile() && entry.name.endsWith(".png")) {
      yield full;
    }
  }
}

async function optimizeFile(filePath) {
  const before = (await stat(filePath)).size;
  const tmp = `${filePath}.opt.tmp`;

  await sharp(filePath)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 82, effort: 10 })
    .toFile(tmp);

  const after = (await stat(tmp)).size;
  if (after >= before) {
    await unlink(tmp);
    return { filePath, before, after: before, skipped: true };
  }

  await rename(tmp, filePath);
  return { filePath, before, after, skipped: false };
}

async function main() {
  const results = [];
  for await (const filePath of walkPngs(ILLUSTRATIONS_DIR)) {
    results.push(await optimizeFile(filePath));
  }

  const saved = results.reduce((sum, r) => sum + Math.max(0, r.before - r.after), 0);
  console.log(`Optimized ${results.length} PNG(s), saved ${(saved / 1024 / 1024).toFixed(2)} MiB`);
  for (const r of results) {
    const rel = path.relative(ROOT, r.filePath);
    const beforeKb = (r.before / 1024).toFixed(0);
    const afterKb = (r.after / 1024).toFixed(0);
    console.log(
      r.skipped ? `  skip ${rel} (${beforeKb} KiB)` : `  ok   ${rel} ${beforeKb} → ${afterKb} KiB`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
