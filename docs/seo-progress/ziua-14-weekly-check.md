# Ziua 14 — Weekly check GSC (3 Iun 2026)

**Plan:** [SEO_PLAN_120_ZILE.md — Ziua 14](../SEO_PLAN_120_ZILE.md#ziua-14-3-iun--weekly-check)

---

## Ce măsori (față de Ziua 7)

| Metrică | Unde în GSC |
|---------|-------------|
| Impresii trend (WoW %) | Performanță → 7 zile → compară cu perioada anterioară |
| CTR mediu | Card „Valoarea CTR medie” |
| Poziție medie | Card „Poziție medie” |
| Top 3 pagini | Performanță → tab **Pagini** → sortare Clicuri |

---

## Raport citit din GSC (22 Mai 2026)

**Proprietate:** `https://ocupaloc.ro/`

| Indicator | Valoare | WoW |
|-----------|--------:|-----|
| Sitemap (live) | **99** URL | — |
| Indexate | **25** | 0% (stagnant) |
| Neindexate | **54** | — |
| Clicuri (7 zile) | **14** | 0% |
| Impresii (7 zile) | **44** | 0% |
| CTR mediu | **31,8%** | 0% |
| Poziție medie | **13,3** | → |

**Trend impresii (grafic):** activitate redusă 14–17 mai, vârf ~18 mai (clicuri), ușoară scădere spre 20 mai — volum încă mic, normal în faza Foundation.

### Top 3 pagini (clicuri)

| # | URL | Clicuri | Impresii |
|---|-----|--------:|---------:|
| 1 | https://ocupaloc.ro/ | 11 | 20 |
| 2 | https://ocupaloc.ro/demo | 2 | 6 |
| 3 | https://ocupaloc.ro/blog | 1 | 12 |

**Observație:** homepage domină; pagini long-tail (`/aplicatie-programari-frizerie`) au impresii fără clicuri — optimizare title/meta.

### Keywords (7 zile)

- ocupaloc (brand)
- programari online salon
- software programari salon

---

## Producție — blog deploy

| URL | Status producție (22 Mai) |
|-----|---------------------------|
| `/blog/cum-sa-angajezi-frizeri` | **200** ✅ |
| `/blog/produse-profesionale-salon` | **404** — deploy lipsă |
| `/blog/cost-deschidere-salon-romania` | **404** — deploy lipsă |

---

## Automat în repo

```bash
pnpm seo:weekly-check -- --plan-day=14 --indexed-pages=25 ...
```

Raport: [reports/seo-weekly-latest.md](../../reports/seo-weekly-latest.md)

---

## Acțiuni prioritare (săptămâna 15)

1. **Deploy** — blog Ziua 8 + 12 + schema Ziua 11
2. **GSC indexare** — URL-uri 404 după deploy
3. **Indexate > 30** — continuă 5–10 inspecții/zi
4. **Ziua 15** — outreach guest post (5 bloguri beauty)

---

## Următorul pas (Ziua 15)

Guest post outreach — cristinagheorghe.ro, beautybyjules.com, etc.
