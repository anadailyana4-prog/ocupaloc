# Ziua 7 — Weekly check GSC (27 Mai 2026)

**Plan:** [SEO_PLAN_120_ZILE.md — Ziua 7](../SEO_PLAN_120_ZILE.md#ziua-7-27-mai--weekly-check)

---

## Ce măsori (Google Search Console)

Cont: **balascanuanamaria1@gmail.com** · proprietate **https://ocupaloc.ro**

| Metrică | Unde în GSC | Țintă plan |
|---------|-------------|------------|
| Pagini indexate | **Indexare** → Pagini | **> 30** |
| Clicuri 7 zile | **Performanță** → ultima săptămână | vs. săptămâna trecută |
| Impresii 7 zile | La fel | vs. săptămâna trecută |
| Keywords top 10 | **Performanță** → Interogări, poziție ≤ 10 | listă nouă / în creștere |

**Raportează:** creștere % față de săptămâna precedentă (WoW).

---

## Automat în repo (fără login GSC)

```bash
pnpm seo:weekly-check
```

Generează:
- `reports/seo-weekly-YYYY-MM-DD.md`
- `reports/seo-weekly-latest.md`

Include **număr URL-uri în sitemap live** (verificat: **97** URL-uri — peste ținta de 30 de pagini „de indexat” din plan).

---

## Completează cifrele din GSC

1. Deschide https://search.google.com/search-console  
2. **Performanță** → interval **Ultimele 7 zile** → notează **Clicuri** și **Impresii**  
3. Schimbă la **7 zile anterioare** (sau compară în UI) → notează valorile precedente  
4. **Indexare** → **Pagini** → „În Google” (total indexate)  
5. **Performanță** → **Interogări** → filtrează poziția **≤ 10** → copiază 3–10 interogări relevante  

Rulează din nou:

```bash
pnpm seo:weekly-check -- \
  --indexed-pages=12 \
  --indexed-pages-prev=8 \
  --clicks=45 \
  --clicks-prev=30 \
  --impressions=1200 \
  --impressions-prev=900 \
  --keywords="programari online salon,software programari salon,programari frizerie"
```

(opțional, cu Supabase local/Vercel env) și metrici produs:

```bash
pnpm report:growth:weekly -- \
  --indexed-pages=12 --clicks=45 --impressions=1200 \
  --clicks-prev=30 --impressions-prev=900 \
  --keywords="programari online salon,..."
```

---

## Raport săptămâna 1 (SEO) — citit din GSC (22 Mai 2026)

**Proprietate activă:** `https://ocupaloc.ro/` (prefix URL) · cont `balascanuanamaria1@gmail.com`  
**Notă:** `sc-domain:ocupaloc.ro` cere confirmare DNS (Cloudflare) — folosește prefix URL până verifici domeniul.

| Indicator | Valoare | Țintă / WoW |
|-----------|--------:|-------------|
| URL-uri sitemap | **97** | >30 ✅ |
| Pagini indexate (GSC) | **25** | țintă >30 ⚠️ (54 neindexate) |
| Clicuri (7 zile) | **14** | vs. 0 săpt. ant. → **n/a** (de la zero) |
| Impresii (7 zile) | **44** | vs. 0 săpt. ant. → creștere vizibilă |
| CTR mediu (7 zile) | **31,8%** | — |
| Poziție medie (7 zile) | **13,3** | — |
| Poziție medie (28 zile) | **3,9** | multe interogări de brand în top 10 |

**Keywords (7 zile, volum mic):** ocupaloc, programari online salon, software programari — de rafinat în GSC → Interogări.

Fișier: [reports/seo-weekly-latest.md](../../reports/seo-weekly-latest.md)

---

## Cele 2 motive GSC (54 neindexate)

| Motiv | Remediere în repo |
|-------|-------------------|
| **Pagină alternativă cu etichetă canonică** | Normal — Google consolidează pe canonical |
| **Nu a fost găsită (404)** | ✅ 7 orașe în sitemap fără pagină — `ORASE_TARGET` extins la 15 orașe |

**404 pe producție (pre-deploy):** `/craiova`, `/galati`, `/ploiesti`, `/buzau`, `/satu-mare`, `/bacau`, `/pitesti` + bloguri noi.

După deploy: `pnpm seo:audit-sitemap` (toate URL-urile → 200).

## Indexare prioritară (continuare)

Listă URL: [seo-index-queue-next-day.md](../seo-index-queue-next-day.md) — 5–10 inspecții/zi, respectă cota GSC.

Articole noi de indexat după deploy:
- `/blog/cum-sa-angajezi-frizeri`
- `/blog/design-interior-salon`

---

## Următorul pas (Ziua 8)

Blog #3: `/blog/produse-profesionale-salon` — produse profesionale vs retail.
