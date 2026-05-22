import { buildPrompt } from "./illustrations-site-brief.mjs";
import { DASHBOARD_ILLUSTRATION_PROMPT } from "./dashboard-illustration-spec.mjs";

/** @type {import('./illustrations-config.mjs').IllustrationConfig[]} */
export const ILLUSTRATIONS = [
  {
    id: "01-hero",
    group: "homepage",
    publicPath: "homepage/hero-programari-online.png",
    size: "1536x1024",
    titleRo: "Hero homepage — natural, realist, BookingCard (1/17)",
    prompt: buildPrompt(
      `Natural realistic editorial photograph-style image for OcupaLoc homepage hero (soft daylight, believable materials, real-world salon, NOT cartoon, NOT plastic 3D).
Scene: modern Romanian beauty salon reception — real mirror with warm bulbs, teal accent chair, cream walls, subtle teal and amber ambient light matching ocupaloc.ro.
Foreground: real tablet on counter showing OcupaLoc booking UI (sharp readable Romanian text):
"ocupaloc.ro/demo-interactiv" + green "Online";
"1. Serviciu" "2. Data" "3. Oră";
card "Serviciu principal" "45 min • 80 lei";
hour chips "10:00" "11:30" "14:00" (one selected teal);
amber button "Confirmă programarea".
Small sign: "Programări online".
Optional: receptionist blurred in background (natural, candid, not posed model glare).
Mood: warm, trustworthy, premium small business. Correct Romanian diacritics. No hex codes, no "OcupaLoc" logo text, no watermark.`,
      "01-hero"
    ),
  },
  {
    id: "03-dashboard",
    group: "dashboard",
    publicPath: "dashboard/dashboard-profesionist.png",
    size: "1536x1024",
    titleRo: "Dashboard — prompt detaliat + paletă cod (4/17)",
    prompt: buildPrompt(DASHBOARD_ILLUSTRATION_PROMPT, "03-dashboard"),
  },
  {
    id: "02-client-flow",
    group: "homepage",
    publicPath: "homepage/client-rezervare-mobil.png",
    size: "1024x1536",
    titleRo: "Mobil — natural, realist, demo-interactiv (2/17)",
    prompt: buildPrompt(
      `Natural realistic photo-style vertical composition: woman's hands holding modern smartphone in a cozy cafe/salon waiting area, soft daylight, shallow depth of field.
Phone screen sharp and readable — exact OcupaLoc booking UI (same as approved hero tablet):
"ocupaloc.ro/demo-interactiv" + green "Online";
"1. Serviciu" "2. Data" "3. Oră";
card "Tuns damă" "45 min • 80 lei" on mint highlight;
mini calendar; time chips with "14:30" selected in teal;
amber button "Confirmă programarea".
Cream/teal brand atmosphere around phone. Believable, not cartoon. Correct Romanian diacritics. No hex codes, no OcupaLoc logo on image.`,
      "02-client-flow"
    ),
  },
  {
    id: "05-share-link",
    group: "homepage",
    publicPath: "homepage/trimite-link-rezervare.png",
    size: "1536x1024",
    titleRo: "Trimite link — natural, realist (3/17)",
    prompt: buildPrompt(
      `Natural realistic lifestyle photo: salon professional at light wood desk, cream/teal atmosphere.
LAPTOP (sharp, main focus): URL "ocupaloc.ro/salon-lumina", header "Salon Lumina" București.
Booking UI must match REAL OcupaLoc product — EXACTLY 3 steps only: "1. Serviciu" "2. Data" "3. Oră".
Show service list or selected service "Tuns + Coafat" "60 min • 180 lei", calendar, time chips, amber "Confirmă programarea".
FORBIDDEN: "Alege specialistul", staff dropdown, employee names (Andreea Popescu etc), 4th step, "Studio Exemplu".
PHONE on desk (small, realistic proportions): WhatsApp "Clientă" → "Programează-te aici: ocupaloc.ro/salon-lumina".
70% laptop / 30% phone on desk. Soft daylight. Correct Romanian diacritics.`,
      "05-share-link"
    ),
  },
  {
    id: "04-pricing",
    group: "preturi",
    publicPath: "preturi/pret-fix-fara-comision.png",
    size: "1024x1024",
    titleRo: "Prețuri — plan 59,99 RON (5/17)",
    prompt: buildPrompt(
      `Centered pricing card on cream background matching /preturi page.
Large readable text: "59,99 RON / lună";
bullets: "Fără comision per programare", "14 zile gratuite", "Programări nelimitate";
amber primary button "Încearcă gratuit".
Clean white card, gray border, teal check icons — no competitor logos.`,
      "04-pricing"
    ),
  },
  {
    id: "niche-saloane",
    group: "pentru-cine",
    publicPath: "pentru-cine/saloane.png",
    size: "1024x1024",
    titleRo: "Nișă Saloane — card homepage + landing salon",
    prompt: buildPrompt(
      `Square marketing tile: salon mirror + chair + phone with OcupaLoc booking UI (3 steps visible).
Badge text: "Saloane". Cream/teal/amber only.`,
      "niche-saloane"
    ),
  },
  {
    id: "niche-frizerii",
    group: "pentru-cine",
    publicPath: "pentru-cine/frizerii.png",
    size: "1024x1024",
    titleRo: "Nișă Frizerii",
    prompt: buildPrompt(
      `Barbershop chair + striped pole + phone showing booking slots in OcupaLoc UI colors. Label "Frizerii".`,
      "niche-frizerii"
    ),
  },
  {
    id: "niche-coafor",
    group: "pentru-cine",
    publicPath: "pentru-cine/coafor.png",
    size: "1024x1024",
    titleRo: "Nișă Coafor",
    prompt: buildPrompt(
      `Square marketing photo matching the first approved Coafor tile layout: coafor station with mirror, hair dryer, color swatches on counter, phone with OcupaLoc booking flow (3 steps), badge "Coafor", cream/teal/amber.
If a client or stylist face appears (e.g. in mirror): must be photorealistic natural human — real skin pores, natural proportions, candid salon moment, NOT drawn/cartoon/illustrated face.`,
      "niche-coafor"
    ),
  },
  {
    id: "niche-manichiura",
    group: "pentru-cine",
    publicPath: "pentru-cine/manichiura.png",
    size: "1024x1024",
    titleRo: "Nișă Manichiură",
    prompt: buildPrompt(
      `Natural realistic editorial photograph: nail studio with UV lamp, polish bottles, smartphone with OcupaLoc booking UI (3 steps), badge "Manichiură", cream/teal/amber. If hands/face visible: photorealistic skin, NOT cartoon illustration.`,
      "niche-manichiura"
    ),
  },
  {
    id: "niche-cosmetica",
    group: "pentru-cine",
    publicPath: "pentru-cine/cosmetica.png",
    size: "1024x1024",
    titleRo: "Nișă Cosmetică",
    prompt: buildPrompt(
      `Natural realistic editorial photograph: cosmetic treatment room, facial bed, serum bottles, tablet with OcupaLoc booking UI (3 steps), badge "Cosmetică", cream/teal/amber. If face visible: photorealistic skin, NOT cartoon illustration.`,
      "niche-cosmetica"
    ),
  },
  {
    id: "niche-psihologi",
    group: "pentru-cine",
    publicPath: "pentru-cine/psihologi.png",
    size: "1024x1024",
    titleRo: "Nișă Psihologi",
    prompt: buildPrompt(
      `Natural realistic editorial photograph: calm psychology cabinet, two armchairs, plant, soft daylight, tablet on side table with OcupaLoc booking UI (3 steps), badge "Psihologi". No brain icons or cartoon symbols. If any person visible: photorealistic natural face, NOT illustrated/cartoon.`,
      "niche-psihologi"
    ),
  },
  {
    id: "niche-nutritionisti",
    group: "pentru-cine",
    publicPath: "pentru-cine/nutritionisti.png",
    size: "1024x1024",
    titleRo: "Nișă Nutriționiști",
    prompt: buildPrompt(`Consult desk, fruit bowl, laptop booking screen. Label "Nutriționiști".`, "niche-nutritionisti"),
  },
  {
    id: "niche-clinici",
    group: "pentru-cine",
    publicPath: "pentru-cine/clinici.png",
    size: "1024x1024",
    titleRo: "Nișă Clinici",
    prompt: buildPrompt(
      `Natural realistic editorial photograph: modern clinic reception, clean desk, kiosk or tablet with OcupaLoc booking slot grid (3-step flow), badge "Clinici", cream/teal/amber. If receptionist or patient visible: photorealistic natural faces, NOT cartoon illustration.`,
      "niche-clinici"
    ),
  },
  {
    id: "niche-spa-masaj",
    group: "pentru-cine",
    publicPath: "pentru-cine/spa-masaj.png",
    size: "1024x1024",
    titleRo: "Nișă Spa & masaj — landing + aliniat cu celelalte nișe",
    prompt: buildPrompt(
      `Square niche tile SAME layout as approved "Frizerii" and "Coafor" cards: massage room, massage table, towels, soft light, phone with OcupaLoc booking UI (3 steps), cream/teal/amber.
MANDATORY TEXT ON IMAGE — large bold readable Romanian badge, exact spelling: Masaje (with e at end). Badge must be obvious, not tiny, not hidden.
WRONG spellings FORBIDDEN: Masaj, Spa, SPA, Massage, Masajă.
Natural realistic photograph, NOT cartoon. Photorealistic skin if people appear.`,
      "niche-spa-masaj"
    ),
  },
  {
    id: "loading-brand",
    group: "loading",
    publicPath: "loading/ocupaloc-brand.png",
    size: "1024x1024",
    titleRo: "Loading app — spinner (logo în CSS)",
    prompt: buildPrompt(
      `Minimal full-screen loader: cream background identical to site body, centered teal ring spinner, generous whitespace. NO wordmark in image.`,
      "loading-brand"
    ),
  },
  {
    id: "loading-slots",
    group: "loading",
    publicPath: "loading/sloturi.png",
    size: "1536x512",
    titleRo: "Loading sloturi BookingCard",
    prompt: buildPrompt(
      `Wide strip: six rounded skeleton pills mimicking empty hour buttons from BookingCard, teal/amber shimmer on cream.`,
      "loading-slots"
    ),
  },
  {
    id: "loading-confirm",
    group: "loading",
    publicPath: "loading/confirmare.png",
    size: "1024x1024",
    titleRo: "Loading confirmare programare",
    prompt: buildPrompt(
      `Centered teal circle with checkmark, small text below: "Confirmăm programarea…" on cream — matches post-booking moment.`,
      "loading-confirm"
    ),
  },
];
