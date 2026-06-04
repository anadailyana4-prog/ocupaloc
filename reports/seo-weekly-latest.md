# SEO Weekly Check — 2026-05-30

**Plan:** Ziua 14 — Google Search Console · [ziua-14-weekly-check.md](../docs/seo-progress/ziua-14-weekly-check.md)

## Rezumat

| Indicator | Valoare | WoW / trend |
| --- | ---: | --- |
| URL-uri în sitemap (live) | **107** | — |
| Pagini indexate (GSC) | 44 | ✅ ≥ 30 |
| Neindexate (GSC) | 60 | — |
| Clicuri (7 zile) | 1 | -92.9% ↓ |
| Impresii (7 zile) | 63 | +43.2% ↑ |
| CTR mediu | 1.6% | -95.0% |
| Poziție medie | 22 | ↓ mai slab |

## Performanță (7 zile vs. 7 zile anterioare)

| Metrică | Săptămâna curentă | Săptămâna trecută | Δ % |
| --- | ---: | ---: | ---: |
| Clicuri | 1 | 14 | -92.9% |
| Impresii | 63 | 44 | +43.2% |
| CTR mediu | 1.6% | 31.8% | -95.0% |
| Poziție medie | 22 | 13.3 | — |
| Pagini indexate | 44 | 25 | +76.0% |

### Top 3 pagini după clicuri

| Pagină | Clicuri | Impresii |
| --- | ---: | ---: |
| https://ocupaloc.ro/ | 1 | 35 |
| https://ocupaloc.ro/demo | 0 | 8 |
| https://ocupaloc.ro/blog | 0 | 12 |

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
