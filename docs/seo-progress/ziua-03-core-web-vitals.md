# Ziua 3 — Core Web Vitals (23 Mai 2026)

**Plan:** [SEO_PLAN_120_ZILE.md — Ziua 3](../SEO_PLAN_120_ZILE.md#ziua-3-23-mai--core-web-vitals)  
**Site:** https://ocupaloc.ro  
**Ținte Google:** LCP &lt; 2,5s · INP &lt; 200ms · CLS &lt; 0,1

---

## Baseline PageSpeed (înainte de deploy optimizări)

| Sursă | Status | Notă |
|--------|--------|------|
| PageSpeed Insights API | ❌ Quota 429 | Limită zilnică epuizată pe proiectul API |
| Lighthouse local (pre-deploy) | ⏸ | Rulează după deploy: `npx lighthouse https://ocupaloc.ro --form-factor=mobile --only-categories=performance` |
| Manual | ✅ Recomandat acum | https://pagespeed.web.dev/analysis?url=https://ocupaloc.ro |

**Pagini de măsurat după deploy:**

1. `/` (homepage — LCP = dashboard hero)
2. `/preturi`
3. `/programari-online-salon`

Notează în tabelul de mai jos scorul Performance + LCP / CLS / TBT (sau INP) din raportul **Mobil**.

| URL | Performance | LCP | CLS | TBT/INP | Data |
|-----|-------------|-----|-----|---------|------|
| `/` (mobil) | **81** | **4,2 s** | **0** | **190 ms** | 22 Mai — *înainte* de deploy optimizări (Lighthouse local) |
| `/` (mobil) | _după deploy_ | | | | |
| `/preturi` | | | | | |
| `/programari-online-salon` | | | | | |

---

## Diagnostic (cod + asset-uri)

### Probleme identificate

1. **PNG-uri marketing foarte mari** (~1,3–1,9 MiB fiecare) în `public/illustrations/` — LCP pe homepage încărca ~1,3 MiB sursă înainte de optimizarea Next (`/_next/image`).
2. **Microsoft Clarity** pe `afterInteractive` — concurează cu hidratarea și crește TBT pe mobil.
3. **LCP hero** — un singur element cu `priority` (corect: `DashboardHeroShowcase`); restul ilustrațiilor fără prioritate.
4. **Homepage client component** (`LandingPage.tsx`) — bundle JS mai mare decât o pagină RSC; acceptabil pentru MVP, de revizuit dacă INP rămâne roșu.

### Deja OK în proiect

- Fonturi Google: `display: "swap"` în `layout.tsx`
- `next/image` cu AVIF/WebP în `next.config.ts`
- GA4: `strategy="afterInteractive"` (necesar pentru evenimente timpurii)
- Hero: `priority` + acum `fetchPriority="high"`

---

## Fix-uri aplicate (repo)

| Acțiune | Fișier / comandă |
|---------|------------------|
| Compresie 14 PNG (max 1400px, palette PNG) | `pnpm seo:optimize-images` → **−14,68 MiB** total |
| LCP: `fetchPriority`, `quality={80}`, `loading` explicit | `MarketingIllustration.tsx`, `DashboardHeroShowcase.tsx` |
| Clarity amânat după load | `layout.tsx` → `strategy="lazyOnload"` |
| Cache long-term ilustrații statice | `next.config.ts` → `/illustrations/*` |
| Script reutilizabil | `scripts/optimize-marketing-pngs.mjs` |

### Dimensiuni după optimizare (exemple)

| Asset | Înainte | După |
|-------|---------|------|
| `dashboard-profesionist.png` | 1,3 MiB | **237 KiB** |
| `hero-programari-online.png` | 1,9 MiB | **434 KiB** |
| `client-rezervare-mobil.png` | 1,9 MiB | **519 KiB** |

După deploy, Next Image va servi și **WebP/AVIF** la ~80% quality — LCP așteptat mult sub 2,5s pe mobil (4G).

---

## După deploy — checklist

- [ ] Deploy producție (Vercel / Cloudflare)
- [ ] PageSpeed mobil pe `/` — notează scorurile în tabelul de mai sus
- [ ] GSC → Experiență → Core Web Vitals (date reale în 28 zile)
- [ ] Dacă LCP &gt; 2,5s: verifică în DevTools ce element e LCP; confirmă că nu sunt 2+ imagini `priority` pe aceeași pagină
- [ ] Dacă CLS &gt; 0,1: verifică font/layout shift la hero sau la `BookingCard` demo
- [ ] Regenerează ilustrații noi cu `illustrations:generate` → rulează din nou `pnpm seo:optimize-images`

---

## Comenzi utile

```bash
# Re-comprimă toate PNG din public/illustrations/
pnpm seo:optimize-images

# Lighthouse local (mobil)
npx lighthouse https://ocupaloc.ro --form-factor=mobile --only-categories=performance --view
```

---

## Următorul pas (Ziua 4)

Articol blog: `/blog/cum-sa-angajezi-frizeri` — vezi [Ziua 4 din plan](../SEO_PLAN_120_ZILE.md#ziua-4-24-mai--blog-post-1).
