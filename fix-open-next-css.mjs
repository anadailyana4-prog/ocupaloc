import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const assetsDir = ".open-next/assets";
const cssDir = join(assetsDir, "_next/static/css");
const indexPath = join(assetsDir, "index.html");

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
