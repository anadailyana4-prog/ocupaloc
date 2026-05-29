#!/usr/bin/env node
/**
 * Copiază doar fișierele .png existente din Desktop → public/illustrations/
 * (respectă aceeași structură de foldere)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.join(os.homedir(), "Desktop", "ocupaloc-illustrations");
const PUBLIC = path.join(__dirname, "..", "public", "illustrations");

function walkPng(dir, base = dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory() && !name.startsWith(".")) {
      out.push(...walkPng(full, base));
    } else if (name.endsWith(".png")) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(DESKTOP)) {
    console.error(`Lipsește folderul: ${DESKTOP}`);
    process.exit(1);
  }

  const files = walkPng(DESKTOP);
  if (files.length === 0) {
    console.error("Niciun .png pe Desktop. Generează mai întâi ilustrațiile.");
    process.exit(1);
  }

  let copied = 0;
  for (const rel of files) {
    const src = path.join(DESKTOP, rel);
    const dest = path.join(PUBLIC, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`✅ public/illustrations/${rel}`);
    copied++;
  }
  console.log(`\n${copied} imagini copiate în proiect.`);
}

main();
