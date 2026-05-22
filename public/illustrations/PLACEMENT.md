# OcupaLoc — harta ilustrații (Desktop ↔ site)

Structura de mai jos este **identică** cu `public/illustrations/` din proiect.
Când muți o imagine pe site: copiază din Desktop în același `publicPath`.

| ID | Fișier (publicPath) | Unde pe site | Rute | Componentă |
|----|---------------------|--------------|------|------------|
| `01-hero` | `homepage/hero-programari-online.png` | Homepage — hero (lângă titlu, înlocuiește sau completează cardul demo) | `/` | `src/components/landing/LandingPage.tsx — secțiune hero grid` |
| `02-client-flow` | `homepage/client-rezervare-mobil.png` | Homepage — „Cum funcționează” pasul 2 (client rezervă singur) | `/` | `LandingPage.tsx — #cum-functioneaza` |
| `03-dashboard` | `dashboard/dashboard-profesionist.png` | Homepage — social proof / demo + Dashboard loading fallback | `/`, `/dashboard` | `LandingPage.tsx + src/app/(dashboard)/loading.tsx` |
| `04-pricing` | `preturi/pret-fix-fara-comision.png` | Pagina prețuri — lângă planul 59,99 RON | `/preturi` | `src/app/preturi/page.tsx` |
| `05-share-link` | `homepage/trimite-link-rezervare.png` | Homepage — pasul 1 (primești link de rezervare) | `/` | `LandingPage.tsx — #cum-functioneaza pasul 1` |
| `niche-saloane` | `pentru-cine/saloane.png` | Homepage — card „Saloane” + hero landing SEO salon | `/`, `/programari-online-salon` | `LandingPage.tsx #pentru-cine + programari-online-salon/page.tsx` |
| `niche-frizerii` | `pentru-cine/frizerii.png` | Homepage — card „Frizerii” + hero /aplicatie-programari-frizerie | `/`, `/aplicatie-programari-frizerie` | `LandingPage.tsx + aplicatie-programari-frizerie/page.tsx` |
| `niche-coafor` | `pentru-cine/coafor.png` | Homepage — card „Coafor” + hero /programari-online-coafor | `/`, `/programari-online-coafor` | `LandingPage.tsx + programari-online-coafor/page.tsx` |
| `niche-manichiura` | `pentru-cine/manichiura.png` | Homepage — card „Manichiură” + hero /software-programari-manichiura | `/`, `/software-programari-manichiura` | `LandingPage.tsx + software-programari-manichiura/page.tsx` |
| `niche-cosmetica` | `pentru-cine/cosmetica.png` | Homepage — card „Cosmetică” + hero /programari-online-cosmetica | `/`, `/programari-online-cosmetica` | `LandingPage.tsx + programari-online-cosmetica/page.tsx` |
| `niche-psihologi` | `pentru-cine/psihologi.png` | Homepage — card „Psihologi” + hero /programari-online-psiholog | `/`, `/programari-online-psiholog` | `LandingPage.tsx + programari-online-psiholog/page.tsx` |
| `niche-nutritionisti` | `pentru-cine/nutritionisti.png` | Homepage — card „Nutriționiști” + hero /programari-online-nutritionist | `/`, `/programari-online-nutritionist` | `LandingPage.tsx + programari-online-nutritionist/page.tsx` |
| `niche-clinici` | `pentru-cine/clinici.png` | Homepage — card „Clinici” (fără landing SEO dedicat încă) | `/` | `LandingPage.tsx #pentru-cine` |
| `niche-spa-masaj` | `pentru-cine/spa-masaj.png` | Hero /programari-online-spa-masaj (nu e în grid homepage) | `/programari-online-spa-masaj` | `programari-online-spa-masaj/page.tsx` |
| `loading-brand` | `loading/ocupaloc-brand.png` | Loading global app / auth / signup | `/login`, `/signup`, `/demo` | `src/app/loading.tsx (root)` |
| `loading-slots` | `loading/sloturi.png` | Loading la încărcarea sloturilor în BookingCard / pagini publice slug | `/demo-interactiv`, `/pagina-publica-rezervare` | `BookingCard.tsx + src/app/[slug]/loading.tsx` |
| `loading-confirm` | `loading/confirmare.png` | Loading după submit programare (API /book) | `/pagina-publica-rezervare` | `BookingCard.tsx — stare submitting` |

## Foldere

- **dashboard/** — 1 imagini
- **homepage/** — 3 imagini
- **loading/** — 3 imagini
- **pentru-cine/** — 8 imagini
- **preturi/** — 1 imagini

## Flux recomandat

1. Generezi → salvezi în `~/Desktop/ocupaloc-illustrations/<publicPath>`
2. Verifici în PLACEMENT.md că ID-ul e corect
3. Copiezi batch: `pnpm illustrations:deploy` (sau manual în `public/illustrations/`)
