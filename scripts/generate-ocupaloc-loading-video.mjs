#!/usr/bin/env node
/**
 * Video promo OcupaLoc via APIYI (chat/completions + sora_video2*) → Desktop.
 *
 * Usage:
 *   APIYI_API_KEY=sk-... node scripts/generate-ocupaloc-loading-video.mjs
 *   APIYI_API_KEY=sk-... node scripts/generate-ocupaloc-loading-video.mjs --from-dashboard
 *
 * Modele (grup default APIYI):
 *   sora_video2-landscape-15s  — 15s landscape 1280×704 (~$0.12)
 *   sora_video2-landscape      — 10s landscape
 *
 * Output: ~/Desktop/ocupaloc-illustrations/loading/ocupaloc-promo.mp4
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const API_BASE = process.env.APIYI_BASE_URL ?? "https://api.apiyi.com/v1";
const MODEL = process.env.APIYI_VIDEO_MODEL ?? "sora_video2-landscape-15s";

const OUT_DIR =
  process.env.OCUPALOC_ILLUSTRATIONS_DIR ??
  path.join(os.homedir(), "Desktop", "ocupaloc-illustrations");
const OUT_FILE = path.join(OUT_DIR, "loading", "ocupaloc-promo.mp4");

const DASHBOARD_SRC = path.join(OUT_DIR, "dashboard", "dashboard-profesionist.png");
const REF_1280 = path.join(OUT_DIR, "loading", "_ref-dashboard-1280x720.png");

const PROMPT_STORY = `Realistic product marketing video for Romanian SaaS OcupaLoc — online appointment booking for salons and local businesses.
Warm cream UI (#FAF9F7), teal accents (#0D9488), amber CTA buttons (#D97706). Photorealistic, NOT cartoon.
Storyboard 15 seconds landscape:
Scene A: Close-up smartphone — OcupaLoc booking only 3 steps in Romanian: "1. Serviciu" "2. Data" "3. Oră", amber button "Confirmă programarea".
Scene B: Salon owner on laptop sees dashboard with appointment list and week calendar, calm modern office daylight.
Scene C: End card readable Romanian text: "59,99 RON/lună" "Fără comision per programare" "14 zile gratuite" and big amber button "Încearcă gratuit".
Smooth cinematic transitions, trustworthy startup ad to drive subscriptions.`;

const PROMPT_DASHBOARD = `Animate this OcupaLoc dashboard UI screenshot with subtle realistic motion: gentle scroll, soft highlight on one booking row, professional SaaS advertisement.
Keep exact UI layout and cream/teal colors. End with Romanian text overlay: "Încearcă gratuit — 14 zile" on amber button style. No cartoon distortion.`;

function parseArgs() {
  return { fromDashboard: process.argv.includes("--from-dashboard") };
}

function ensureRef1280x720() {
  if (!fs.existsSync(DASHBOARD_SRC)) {
    throw new Error(`Lipsește ${DASHBOARD_SRC}`);
  }
  fs.mkdirSync(path.dirname(REF_1280), { recursive: true });
  const sips = spawnSync(
    "sips",
    ["-z", "720", "1280", DASHBOARD_SRC, "--out", REF_1280],
    { encoding: "utf8" }
  );
  if (sips.status !== 0 || !fs.existsSync(REF_1280)) {
    throw new Error(`Redimensionare 1280×720 eșuată: ${sips.stderr}`);
  }
  return REF_1280;
}

function pngToDataUrl(filePath) {
  const b64 = fs.readFileSync(filePath).toString("base64");
  return `data:image/png;base64,${b64}`;
}

function extractVideoUrl(text) {
  const md = text.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+\.mp4[^)\s]*)\)/i);
  if (md) return md[1];
  const direct = text.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/i);
  if (direct) return direct[0].replace(/[)\],.]+$/, "");
  const any = text.match(/https?:\/\/[^\s"'<>]+/g);
  if (any) {
    const mp4 = any.find((u) => /\.mp4|video|download|file/i.test(u));
    if (mp4) return mp4;
  }
  return null;
}

async function submitChatVideo(apiKey, prompt, imageDataUrl = null) {
  const content = [{ type: "text", text: prompt }];
  if (imageDataUrl) {
    content.push({ type: "image_url", image_url: { url: imageDataUrl } });
  }

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [{ role: "user", content }]
    })
  });

  if (!res.ok) {
    const t = await res.text();
    if (res.status === 503 && /无可用渠道|no available channel/i.test(t)) {
      throw new Error(
        `APIYI: tokenul tău nu are grup Sora activ.\n` +
          `→ https://api.apiyi.com/token — token NOU cu grup「Sora2Official」+ facturare「按量」\n` +
          `→ Apoi: APIYI_API_KEY=sk-... node scripts/generate-ocupaloc-loading-video.mjs\n` +
          `→ Preview acum (fără Sora): node scripts/build-ocupaloc-promo-video-ffmpeg.mjs`
      );
    }
    throw new Error(`Chat video ${res.status}: ${t.slice(0, 500)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const piece = json?.choices?.[0]?.delta?.content;
        if (piece) {
          fullText += piece;
          process.stdout.write(piece);
        }
      } catch {
        /* ignore partial SSE */
      }
    }
  }

  console.log("\n");
  const url = extractVideoUrl(fullText);
  if (!url) {
    throw new Error(
      `Nu am găsit URL video în răspuns. Fragment:\n${fullText.slice(-800)}`
    );
  }
  return url;
}

async function downloadFromUrl(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status} from ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

async function main() {
  const apiKey = process.env.APIYI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Lipsește APIYI_API_KEY → https://api.apiyi.com/token");
    process.exit(1);
  }

  const { fromDashboard } = parseArgs();
  console.log(`\n🎬 OcupaLoc promo video`);
  console.log(`   Model: ${MODEL} (~$0.12)`);
  console.log(`   Mod: ${fromDashboard ? "image→video (dashboard)" : "text→video (story)"}`);
  console.log(`   Așteptare: ~3–5 minute\n`);

  let imageDataUrl = null;
  let prompt = PROMPT_STORY;
  if (fromDashboard) {
    const ref = ensureRef1280x720();
    imageDataUrl = pngToDataUrl(ref);
    prompt = PROMPT_DASHBOARD;
  }

  console.log("📤 Generare…\n");
  const videoUrl = await submitChatVideo(apiKey, prompt, imageDataUrl);
  console.log(`🔗 ${videoUrl}\n⬇️  Descărcare…`);

  const bytes = await downloadFromUrl(videoUrl, OUT_FILE);
  console.log(`\n✅ ${OUT_FILE} (${(bytes / 1024 / 1024).toFixed(2)} MB)\n`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}\n`);
  process.exit(1);
});
