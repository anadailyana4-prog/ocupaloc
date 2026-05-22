# Ziua 12 — Blog post #5 (1 Iun 2026)

**Plan:** [SEO_PLAN_120_ZILE.md — Ziua 12](../SEO_PLAN_120_ZILE.md#ziua-12-1-iun--blog-post-5)

---

## Articol publicat

| Câmp | Valoare |
|------|---------|
| **Titlu** | Cât costă să deschizi un salon în România 2025 |
| **URL** | https://ocupaloc.ro/blog/cost-deschidere-salon-romania |
| **Slug** | `cost-deschidere-salon-romania` |
| **Data** | 1 iunie 2026 |
| **Lungime** | ~1.650 cuvinte (pillar micro) |

---

## SEO checklist

| Cerință plan | Status |
|--------------|--------|
| 1500+ cuvinte | ✅ |
| Breakdown: chirie, utilități, echipamente, licențe | ✅ tabel investiție + recurent |
| ROI calcul | ✅ exemplu numeric + formulă break-even |
| Link `/preturi` | ✅ `relatedLandingLinks` + mențiune în text |
| Schema Article JSON-LD | ✅ existent |
| Sitemap + index blog | ✅ |

---

## Fișiere

- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/page.tsx`
- `src/app/sitemap.ts`

---

## După deploy

- [ ] Verifică 200: `curl -sI https://ocupaloc.ro/blog/cost-deschidere-salon-romania`
- [ ] GSC → Solicită indexarea
- [ ] `pnpm seo:audit-sitemap`

---

## Următorul pas (Ziua 13)

FAQ expansion pe `/intrebari-frecvente` — 10 întrebări noi
