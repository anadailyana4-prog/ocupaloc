/**
 * Brief vizual extras din site-ul live OcupaLoc — folosit în prompturi.
 * NU include coduri hex (modelul le desenează pe imagine).
 */

export const SITE_VISUAL = `
OcupaLoc (ocupaloc.ro) visual system — must match the live website:
- Page background: warm cream paper with very subtle teal and amber glow gradients (like the public landing).
- Typography mood: dark slate headings, gray secondary labels, teal accent for links and highlights.
- Primary action buttons: solid amber/orange with white label (same as "Încearcă gratuit" on homepage).
- Cards: white fill, soft gray border, rounded corners (~12px), light mint-tint fill for highlighted rows.
- Public booking widget (BookingCard): ONLY 3 steps — "1. Serviciu", "2. Data", "3. Oră". NEVER show "Alege specialistul", staff picker, therapist names, or a 4th step. One business = one calendar per link (multi-staff = separate accounts/links, not a dropdown on one page).
- Dashboard (logged-in): cream page BUT KPI blocks are dark translucent panels with amber-tinted numbers (lux-card style), week strip Mon–Sun, table "Programări" with status pills.
- Pricing page message: one simple plan "59,99 RON/lună", "fără comision per programare", "14 zile gratuite".
- Language: Romanian UI strings only where text is required; spell diacritics correctly (ă â î ș ț).
- Illustration style: same family as approved marketing art — warm editorial vector, human-friendly, NOT photorealistic faces, NOT robotic 3D.
`.trim();

/** @type {Record<string, string>} */
export const SITE_BINDING = {
  "01-hero":
    "Pairs with homepage hero: headline about clients booking online. Show salon + tablet whose screen mirrors BookingCard step labels (Serviciu → Data → Oră), amber CTA chip, cream page behind.",
  "02-client-flow":
    "Matches #cum-functioneaza step 2 and live BookingCard on /demo-interactiv: phone with the same 3-step booking UI, mint selected service card, grid of hour pills.",
  "05-share-link":
    "Matches step 1 'Primești pagina ta de rezervare': professional shares link ocupaloc.ro/salon-lumina on WhatsApp; laptop shows Salon Lumina booking page.",
  "03-dashboard":
    "Matches /dashboard exactly from src/app/(dashboard): header nav, onboarding checklist, Pulse lux-cards (6 KPIs), week strip Du–Sâ, Programări filters + 8-column table — no simplification.",
  "04-pricing":
    "Matches /preturi: single plan card aesthetic, readable '59,99 RON/lună', 'Fără comision', '14 zile probă' — same tone as pricing table on site.",
  "niche-saloane":
    "Homepage #pentru-cine card 'Saloane' + /programari-online-salon — beauty salon that uses the same booking flow.",
  "niche-frizerii":
    "Card 'Frizerii' + /aplicatie-programari-frizerie — barbershop variant, same OcupaLoc UI colors on a phone.",
  "niche-coafor": "Card 'Coafor' + landing coafor — styling studio, same brand palette.",
  "niche-manichiura": "Card 'Manichiură' + landing manichiură — nail studio.",
  "niche-cosmetica": "Card 'Cosmetică' + landing cosmetică — treatment room.",
  "niche-psihologi": "Card 'Psihologi' + landing psiholog — calm cabinet, discreet booking on tablet.",
  "niche-nutritionisti": "Card 'Nutriționiști' + landing nutritionist — consult desk.",
  "niche-clinici": "Card 'Clinici' — clinic reception with appointment screen in brand colors.",
  "niche-spa-masaj":
    "Card nișă masaje — badge text must read exactly Masaje (like Frizerii/Coafor tiles), hero /programari-online-spa-masaj.",
  "loading-brand":
    "Used in app loading.tsx: cream full screen, teal spinner only — site adds OcupaLoc wordmark in HTML, not in PNG.",
  "loading-slots":
    "BookingCard while fetching slots: row of gray/teal skeleton pills like empty hour buttons.",
  "loading-confirm":
    "After POST /api/book: amber/teal check animation on cream, matches success toast moment.",
};

export function buildPrompt(sceneDetail, id) {
  const binding = SITE_BINDING[id] ?? "";
  const staticNiche =
    id.startsWith("niche-") || id.startsWith("loading-")
      ? " Single static photograph or still frame."
      : "";
  const styleLine =
    id === "03-dashboard"
      ? "Output: pixel-perfect static UI screenshot of /dashboard only — sharp opaque text, no people, no laptop frame, no marketing illustration style."
      : id === "niche-coafor" ||
          id === "niche-manichiura" ||
          id === "niche-cosmetica" ||
          id === "niche-psihologi" ||
          id === "niche-clinici" ||
          id === "niche-spa-masaj"
        ? "Output: natural realistic editorial PHOTOGRAPH (same quality as approved 01-hero): soft daylight, believable Romanian professional space, real skin texture if a person appears. FORBIDDEN: cartoon face, illustrated vector person, anime, Disney/Pixar, plastic 3D doll, oversized stylized eyes."
        : `Illustration style: same family as approved marketing art — warm editorial vector, human-friendly, NOT photorealistic faces, NOT robotic 3D.${staticNiche}`;
  return [
    SITE_VISUAL,
    styleLine,
    binding ? `This asset on site: ${binding}` : "",
    sceneDetail,
    "Forbidden on image: hex codes, color palette lists, watermark, misspelled Romanian, English lorem ipsum, fake statistics.",
  ]
    .filter(Boolean)
    .join(" ");
}
