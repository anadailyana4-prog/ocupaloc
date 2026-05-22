# Ziua 8 — Blog post #3 (28 Mai 2026)

**Plan:** [SEO_PLAN_120_ZILE.md — Ziua 8](../SEO_PLAN_120_ZILE.md#ziua-8-28-mai--blog-post-3)

---

## Articol publicat

| Câmp | Valoare |
|------|---------|
| **Titlu** | Produse profesionale vs retail: ce să vinzi în salon |
| **URL** | https://ocupaloc.ro/blog/produse-profesionale-salon |
| **Slug** | `produse-profesionale-salon` |
| **Data** | 28 mai 2026 |
| **Lungime** | ~1.050 cuvinte |

---

## SEO checklist

| Cerință plan | Status |
|--------------|--------|
| 900–1100 cuvinte | ✅ |
| Tabel comparativ prețuri / marje | ✅ bloc `{{table}}` în renderer |
| Keywords: produse profesionale salon, retail, marjă | ✅ titlu, description, corp |
| Link intern programări / ghid | ✅ `relatedLandingLinks` |
| Schema Article JSON-LD | ✅ existent în `blog/[slug]/page.tsx` |
| Index blog + sitemap | ✅ `blog/page.tsx` + `sitemap.ts` |

---

## Fișiere modificate

- `src/app/blog/[slug]/page.tsx` — articol + suport tabele HTML
- `src/app/blog/page.tsx` — listare
- `src/app/sitemap.ts` — `BLOG_SLUGS`

---

## După deploy

- [ ] `pnpm seo:audit-sitemap` (verifică 200 pe URL nou)
- [ ] GSC → Inspect URL → Solicită indexarea
- [ ] Opțional: distribuție social (legătură cu Ziua 6)

---

## Următorul pas (Ziua 9)

**Local citations** — catalogul-afacerilor.ro, bizoo.ro, afaceriromania.ro, companii.ro
