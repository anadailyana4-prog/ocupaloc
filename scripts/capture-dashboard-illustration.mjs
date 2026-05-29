#!/usr/bin/env node
/**
 * Capturează dashboard mock HTML → PNG fidel (culori din globals.css).
 * Usage: node scripts/capture-dashboard-illustration.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(__dirname, "dashboard-screenshot-mock.html");
const OUT = path.join(os.homedir(), "Desktop", "ocupaloc-illustrations", "dashboard", "dashboard-profesionist.png");

async function main() {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  await page.goto(`file://${HTML}`);
  await page.waitForTimeout(500);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.screenshot({ path: OUT, fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 1100 } });
  await browser.close();
  console.log(`✅ Dashboard fidel salvat: ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
