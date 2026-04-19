import { copyFileSync, cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const openNextRoot = ".open-next";
const publishRoot = "open-next-dist";
const workerPath = join(openNextRoot, "worker.js");
const pagesWorkerPath = join(openNextRoot, "_worker.js");
const assetsDir = ".open-next/assets";
const cssDir = join(assetsDir, "_next/static/css");
const indexPath = join(assetsDir, "index.html");

// Cloudflare Pages expects _worker.js in the output root.
if (existsSync(workerPath) && !existsSync(pagesWorkerPath)) {
  copyFileSync(workerPath, pagesWorkerPath);
  console.log("Created .open-next/_worker.js from worker.js");
}

// Pages serves static files from publish root; mirror assets there.
if (existsSync(assetsDir)) {
  cpSync(assetsDir, openNextRoot, { recursive: true });
  console.log("Mirrored .open-next/assets into .open-next root");
}

if (!existsSync(cssDir) || !existsSync(indexPath)) {
  process.exit(0);
}

const cssFiles = readdirSync(cssDir).filter((f) => f.endsWith(".css"));
if (cssFiles.length === 0) {
  process.exit(0);
}

const html = readFileSync(indexPath, "utf8");
const matches = [...html.matchAll(/\/_next\/static\/css\/([a-z0-9]+\.css)/g)].map((m) => m[1]);
if (matches.length === 0) {
  process.exit(0);
}

const fallbackSource = join(cssDir, cssFiles[0]);
for (const fileName of new Set(matches)) {
  const target = join(cssDir, fileName);
  if (!existsSync(target)) {
    copyFileSync(fallbackSource, target);
    console.log(`Fixed missing CSS asset: ${fileName}`);
  }
}

// Cloudflare Pages can be strict with dot-prefixed publish dirs. Mirror final output to non-dot dir.
rmSync(publishRoot, { recursive: true, force: true });
cpSync(openNextRoot, publishRoot, { recursive: true });
console.log("Mirrored .open-next to open-next-dist for Cloudflare publish");
