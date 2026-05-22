# Ziua 11 — Schema markup upgrade (31 Mai 2026)

**Plan:** [SEO_PLAN_120_ZILE.md — Ziua 11](../SEO_PLAN_120_ZILE.md#ziua-11-31-mai--schema-markup-upgrade)

---

## Implementat

| Schema | Unde | Tip |
|--------|------|-----|
| **LocalBusiness** | Homepage `/` | Nou — cerință Ziua 11 |
| **SoftwareApplication** | Homepage `/` | Păstrat (ofertă 59,99 RON) |
| Organization + WebSite | `layout.tsx` | Global (existent) |

---

## LocalBusiness (homepage)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "OcupaLoc",
  "url": "https://ocupaloc.ro",
  "logo": "https://ocupaloc.ro/og-image.svg",
  "description": "Software românesc de programări pentru saloane",
  "priceRange": "RON",
  "areaServed": { "@type": "Country", "name": "Romania" }
}
```

Sursă unică: `src/lib/seo/homepage-schemas.ts`

---

## Fișiere

- `src/lib/seo/homepage-schemas.ts` — LocalBusiness + SoftwareApplication
- `src/app/page.tsx` — injectare JSON-LD

---

## După deploy

- [ ] [Rich Results Test](https://search.google.com/test/rich-results?url=https://ocupaloc.ro)
- [ ] Schema Markup Validator — verifică `LocalBusiness` pe homepage
- [ ] GSC → Inspect URL `https://ocupaloc.ro/` (re-crawl opțional)

---

## Următorul pas (Ziua 12)

Blog pillar: `/blog/cost-deschidere-salon-romania`
