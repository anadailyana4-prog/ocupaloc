#!/usr/bin/env node
/**
 * Video promo local (ffmpeg) din ilustrațiile OcupaLoc — preview pe Desktop.
 * Folosește când APIYI Sora nu e activ pe token (grup Sora2Official lipsește).
 *
 *   node scripts/build-ocupaloc-promo-video-ffmpeg.mjs
 *
 * Output: ~/Desktop/ocupaloc-illustrations/loading/ocupaloc-promo.mp4
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";

const OUT_DIR =
  process.env.OCUPALOC_ILLUSTRATIONS_DIR ??
  path.join(os.homedir(), "Desktop", "ocupaloc-illustrations");
const OUT_FILE = path.join(OUT_DIR, "loading", "ocupaloc-promo.mp4");
const TMP = path.join(OUT_DIR, "loading", "_video-build");

const SLIDES = [
  { file: "homepage/trimite-link-rezervare.png", sec: 3.5, label: "Pasul 1 — link de rezervare" },
  { file: "homepage/client-rezervare-mobil.png", sec: 3.5, label: "Pasul 2 — clientul rezervă" },
  { file: "dashboard/dashboard-profesionist.png", sec: 4, label: "Pasul 3 — tot în contul tău" },
  { file: "preturi/pret-fix-fara-comision.png", sec: 4, label: "CTA — 59,99 RON, Încearcă gratuit" }
];

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed: ${r.stderr || r.stdout}`);
  }
}

function buildSlideClip(src, out, durationSec) {
  const vf = [
    "scale=1280:720:force_original_aspect_ratio=increase",
    "crop=1280:720",
    `zoompan=z='min(1+0.0008*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=24`,
    `trim=duration=${durationSec}`,
    "setpts=PTS-STARTPTS"
  ].join(",");

  run("ffmpeg", ["-y", "-loop", "1", "-i", src, "-vf", vf, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", out]);
}

function main() {
  for (const s of SLIDES) {
    const p = path.join(OUT_DIR, s.file);
    if (!fs.existsSync(p)) {
      console.error(`Lipsește ${p}`);
      process.exit(1);
    }
  }

  fs.mkdirSync(TMP, { recursive: true });
  const clips = [];

  SLIDES.forEach((s, i) => {
    const src = path.join(OUT_DIR, s.file);
    const clip = path.join(TMP, `slide-${i}.mp4`);
    console.log(`🎞️  ${s.label}`);
    buildSlideClip(src, clip, s.sec);
    clips.push(clip);
  });

  const listFile = path.join(TMP, "concat.txt");
  fs.writeFileSync(listFile, clips.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join("\n"));

  console.log("🔗 Concat + fade audio…");
  run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    OUT_FILE
  ]);

  console.log(`\n✅ ${OUT_FILE}\n`);
}

main();
