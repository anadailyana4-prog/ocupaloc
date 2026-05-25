# GSC — acțiuni 25 Mai 2026

**Proprietate:** `https://ocupaloc.ro/`  
**Sitemap live:** 101 URL, toate **200** (`pnpm seo:audit-sitemap`)

---

## Stare citită din Search Console (azi)

| Indicator | Valoare |
|-----------|--------:|
| Pagini indexate | **25** |
| Neindexate | **54** (2 motive) |
| Clicuri (7 zile) | **11** |
| Impresii (7 zile) | **52** |
| CTR mediu | **21,2%** |
| Poziție medie | **15,2** |

### Motive neindexare

1. **Eroare redirecționare** — **1 URL**: `https://ocupaloc.ro/business-demo`. **Fix deployat** (308 → `/demo-interactiv`, scos din sitemap). **Validare GSC:** „Validarea începută” (25 Mai 2026).
2. **Descoperită – nu este indexată** — **53 URL** (validare **Începută**; normal după deploy masiv — continuă 1 inspecție/zi)

### Sitemaps

- `/sitemap.xml` — **Succes**, trimis 20 mai, citit 22 mai

---

## Făcut în sesiune (browser GSC)

| Acțiune | Rezultat |
|---------|----------|
| Proprietate **`sc-domain:ocupaloc.ro`** verificată (TXT DNS) | ✅ Acces complet |
| Sitemap trimis pe proprietatea domeniu | ✅ `https://ocupaloc.ro/sitemap.xml` |
| `/blog/produse-profesionale-salon` — solicită indexarea | ✅ (sesiune anterioară) |
| `/blog/cost-deschidere-salon-romania` — solicită indexarea | ✅ (proprietate domeniu) |
| Deploy producție Vercel | ✅ https://ocupaloc.ro — `dpl_HYgFBb21do8WUiNHM2bdedPVGujA` |
| Validare remediere redirect GSC | ✅ Începută (25 Mai) |
| `/bucuresti/salon` — solicită indexarea | ✅ |
| `pnpm seo:audit-sitemap` post-deploy | ✅ 100 URL, toate 200 |

**Notă:** GSC raportează „Nu s-au detectat sitemap-uri de recomandare” la inspecție individuală — uneori apare chiar dacă sitemapul general e Succes; important e că URL-ul e în `sitemap.xml`.

---

## Prioritate ta (1 URL/zi, max ~10/zi)

1. `https://ocupaloc.ro/blog/cost-deschidere-salon-romania`
2. `https://ocupaloc.ro/bucuresti/frizerie`
3. `https://ocupaloc.ro/bucuresti/salon`
4. `https://ocupaloc.ro/cluj-napoca/manichiura`
5. `https://ocupaloc.ro/comparativ/fresha`
6. `https://ocupaloc.ro/alternativa-fresha-romania`

Lista completă: [seo-index-queue-next-day.md](../seo-index-queue-next-day.md)

---

## Ce mai poți face în GSC (fără cod)

| Acțiune | De ce |
|---------|--------|
| Deschide **Eroare redirecționare (1)** | Un singur URL stricat poate pierde încredere la crawl |
| **Performanță → Pagini** | URL-uri cu multe impresii, 0 clicuri → rescrie title/meta |
| **Performanță → Interogări** | Optimizează paginile pentru interogări poziție 11–20 |
| Așteaptă validarea GSC redirect (~câteva zile) | Status: Validarea începută |
| **git push** `main` (3 commituri locale) | Deploy Vercel făcut din CLI; push GitHub eșuat aici (credențiale) — rulează local: `git push origin main` |
| **Îmbunătățiri → FAQ** | Verifică că schema FAQ e validă (deja în plan) |

---

## Automat în proiect (opțional)

Dacă pe Vercel ai `GOOGLE_INDEXING_CLIENT_EMAIL` + `GOOGLE_INDEXING_PRIVATE_KEY`:

- Cron zilnic `/api/jobs/google-indexing` (12 URL/zi din sitemap)
- Reduce dependența de inspecție manuală

---

## Țintă săptămâna viitoare

- **Indexate ≥ 30** (de la 25)
- **2 bloguri noi** în SERP
- **≥1 pagină oraș** cu impresii pe interogare comercială

Actualizează raportul:

```bash
pnpm seo:weekly-check -- --plan-day=14 \
  --indexed-pages=25 --not-indexed=54 \
  --clicks=11 --impressions=52 --ctr=21.2 --position=15.2
```
