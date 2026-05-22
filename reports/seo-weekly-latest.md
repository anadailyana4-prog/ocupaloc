# SEO Weekly Check — 2026-05-22

**Plan:** Ziua 14 — Google Search Console · [ziua-14-weekly-check.md](../docs/seo-progress/ziua-14-weekly-check.md)

## Rezumat

| Indicator | Valoare | WoW / trend |
| --- | ---: | --- |
| URL-uri în sitemap (live) | **99** | — |
| Pagini indexate (GSC) | 25 | ⚠️ sub țintă (30) |
| Neindexate (GSC) | 54 | — |
| Clicuri (7 zile) | 14 | +0.0% → |
| Impresii (7 zile) | 44 | +0.0% → |
| CTR mediu | 31.8% | +0.0% |
| Poziție medie | 13.3 | → |

## Performanță (7 zile vs. 7 zile anterioare)

| Metrică | Săptămâna curentă | Săptămâna trecută | Δ % |
| --- | ---: | ---: | ---: |
| Clicuri | 14 | 14 | +0.0% |
| Impresii | 44 | 44 | +0.0% |
| CTR mediu | 31.8% | 31.8% | +0.0% |
| Poziție medie | 13.3 | 13.3 | — |
| Pagini indexate | 25 | 25 | +0.0% |

### Top 3 pagini după clicuri

| Pagină | Clicuri | Impresii |
| --- | ---: | ---: |
| https://ocupaloc.ro/ | 11 | 20 |
| https://ocupaloc.ro/demo | 2 | 6 |
| https://ocupaloc.ro/blog | 1 | 12 |

### Keywords în top 10 (poziție 1–10)

- ocupaloc
- programari online salon
- software programari salon

## Acțiuni săptămâna viitoare

- [ ] Indexare: 5–10 URL din [seo-index-queue-next-day.md](../docs/seo-index-queue-next-day.md)
- [ ] Deploy articole blog nepublicate (404 pe producție dacă lipsesc)
- [ ] `pnpm seo:audit-sitemap` după deploy
- [ ] Ziua 15: guest post outreach (5 bloguri beauty)

## Comandă (actualizează cifrele)

```bash
pnpm seo:weekly-check -- --plan-day=14 \
  --indexed-pages=N --indexed-pages-prev=N --not-indexed=N \
  --clicks=N --clicks-prev=N --impressions=N --impressions-prev=N \
  --ctr=N --ctr-prev=N --position=N --position-prev=N \
  --top-pages="https://ocupaloc.ro/|11|20,https://ocupaloc.ro/demo|2|6" \
  --keywords="programari online salon,ocupaloc"
```
