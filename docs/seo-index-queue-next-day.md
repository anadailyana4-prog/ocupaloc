# SEO Index Queue - Next Day

Scop: folosim eficient cota zilnica de URL Inspection in Google Search Console pe URL-uri care pot genera leaduri comerciale.

## Confirmate in sesiunea curenta
- https://ocupaloc.ro/blog/cum-sa-reduci-anularile
- https://ocupaloc.ro/blog/fresha-cat-costa-romania
- https://ocupaloc.ro/blog/telefon-vs-programari-online
- https://ocupaloc.ro/brasov/frizerie
- https://ocupaloc.ro/brasov/salon

## Trimise 22 mai 2026 (batch 10 URL)
1. https://ocupaloc.ro/blog/cum-sa-angajezi-frizeri — solicitat
2. https://ocupaloc.ro/blog/design-interior-salon — solicitat
3. https://ocupaloc.ro/cluj-napoca/frizerie — solicitat (Descoperită – nu indexată)
4. https://ocupaloc.ro/cluj-napoca/salon — solicitat (deja indexată, re-crawl)
5. https://ocupaloc.ro/timisoara/frizerie — solicitat (deja indexată, re-crawl)
6. https://ocupaloc.ro/timisoara/salon — solicitat (Google nu cunoaște URL)
7. https://ocupaloc.ro/iasi/frizerie — solicitat (deja indexată, re-crawl)
8. https://ocupaloc.ro/iasi/salon — solicitat (Descoperită – nu indexată)
9. https://ocupaloc.ro/constanta/frizerie — solicitat (Descoperită – nu indexată)
10. https://ocupaloc.ro/constanta/salon — solicitat (Descoperită – nu indexată)

## După deploy (22 Mai 2026) — indexare GSC

| URL | Status GSC |
|-----|------------|
| https://ocupaloc.ro/blog/produse-profesionale-salon | ✅ **Indexare solicitată** (25 Mai 2026) |
| https://ocupaloc.ro/blog/cost-deschidere-salon-romania | ✅ **Indexare solicitată** (25 Mai 2026, proprietate `sc-domain:ocupaloc.ro`) |

Producție: ambele articole **200** după deploy `a3f4227`.

## Batch prioritar pentru ziua urmatoare
1. https://ocupaloc.ro/bucuresti/frizerie — ✅ deja indexată în GSC (25 Mai)
2. https://ocupaloc.ro/bucuresti/salon — ✅ **Indexare solicitată** (25 Mai 2026)
3. https://ocupaloc.ro/cluj-napoca/manichiura — ✅ **Indexare solicitată** (25 Mai 2026)
4. https://ocupaloc.ro/timisoara/manichiura — ✅ **Indexare solicitată** (25 Mai 2026)
5. https://ocupaloc.ro/iasi/manichiura — ⏸ reia mâine (inspecție GSC; cotă aproape)
6. https://ocupaloc.ro/constanta/manichiura — ✅ **Indexare solicitată** (25 Mai 2026)
7. https://ocupaloc.ro/bucuresti/manichiura — ✅ **Indexare solicitată** (25 Mai 2026, „Google nu cunoaște URL”)
8. https://ocupaloc.ro/brasov/frizerie (re-verificare dacă nu e încă în SERP)
9. https://ocupaloc.ro/brasov/salon
10. https://ocupaloc.ro/blog/produse-profesionale-salon — **după deploy Ziua 8**

## Trimise 29 mai 2026 (batch 10 URL — pagini comerciale)
1. https://ocupaloc.ro/programari-online-salon — ✅ **Indexare solicitată** (Google nu cunoaște URL)
2. https://ocupaloc.ro/alternativa-fresha-romania — ✅ **Indexare solicitată** (deja indexată, re-crawl)
3. https://ocupaloc.ro/alternativa-booksy-romania — ✅ **Indexare solicitată** (deja indexată, re-crawl)
4. https://ocupaloc.ro/software-programari-manichiura — ✅ **Indexare solicitată** (deja indexată, re-crawl)
5. https://ocupaloc.ro/aplicatie-programari-salon — ✅ **Indexare solicitată** (deja indexată, re-crawl)
6. https://ocupaloc.ro/comparativ/fresha — ✅ **Indexare solicitată** (deja indexată, re-crawl)
7. https://ocupaloc.ro/ghid-programari-salon — ✅ **Indexare solicitată** (deja indexată, re-crawl)
8. https://ocupaloc.ro/preturi — ✅ **Indexare solicitată** (deja indexată, re-crawl)
9. https://ocupaloc.ro/iasi/manichiura — ✅ **Indexare solicitată** (Google nu cunoaște URL; reluat din pauza 25 Mai)
10. https://ocupaloc.ro/brasov/manichiura — ✅ **Indexare solicitată** (deja indexată, re-crawl)

Cotă GSC: **10/10** — fără „Cota depășită”.

## Trimise 31 mai 2026 (batch 10 URL — orașe + comparativ)
1. https://ocupaloc.ro/oradea/frizerie — ✅ **Indexare solicitată** (Descoperită – nu indexată)
2. https://ocupaloc.ro/sibiu/frizerie — ✅ **Indexare solicitată** (Descoperită – nu indexată)
3. https://ocupaloc.ro/cluj-napoca/manichiura — ✅ **Indexare solicitată** (deja indexată, re-crawl)
4. https://ocupaloc.ro/timisoara/manichiura — ✅ **Indexare solicitată** (deja indexată, re-crawl)
5. https://ocupaloc.ro/constanta/manichiura — ✅ **Indexare solicitată** (deja indexată, re-crawl)
6. https://ocupaloc.ro/bucuresti/manichiura — ✅ **Indexare solicitată** (deja indexată, re-crawl)
7. https://ocupaloc.ro/comparativ/booksy — ✅ **Indexare solicitată** (deja indexată, re-crawl)
8. https://ocupaloc.ro/blog/cum-sa-reduci-anularile — ✅ **Indexare solicitată** (deja indexată, re-crawl)
9. https://ocupaloc.ro/brasov/frizerie — ✅ **Indexare solicitată** (deja indexată, re-crawl)
10. https://ocupaloc.ro/brasov/salon — ✅ **Indexare solicitată** (deja indexată, re-crawl)

Cotă GSC: **10/10** — fără „Cota depășită”.

## Batch următor (prioritate)

> După deploy: `/craiova/*`, `/galati/*` etc. returnează **200** (nu 404). Solicită indexarea după deploy.

1. https://ocupaloc.ro/oradea/salon
2. https://ocupaloc.ro/sibiu/salon
3. https://ocupaloc.ro/oradea/manichiura
4. https://ocupaloc.ro/sibiu/manichiura
5. https://ocupaloc.ro/craiova/frizerie
6. https://ocupaloc.ro/craiova/salon
7. https://ocupaloc.ro/blog/fresha-cat-costa-romania (re-crawl)
8. https://ocupaloc.ro/blog/telefon-vs-programari-online (re-crawl)
9. https://ocupaloc.ro/blog/cum-sa-angajezi-frizeri (re-crawl)
10. https://ocupaloc.ro/demo

## Batch secundar (dupa cele de mai sus)
1. https://ocupaloc.ro/cluj-napoca/manichiura
2. https://ocupaloc.ro/timisoara/manichiura
3. https://ocupaloc.ro/iasi/manichiura — ✅ trimis 29 Mai
4. https://ocupaloc.ro/constanta/manichiura
5. https://ocupaloc.ro/bucuresti/manichiura

## Procedura rapida
1. URL Inspection pentru fiecare URL.
2. Daca statusul este "Adresa URL nu este pe Google" si butonul este disponibil, trimite "Solicita indexarea".
3. Daca apare "Cota depasita", opreste imediat si reia ziua urmatoare de la urmatorul URL din lista.
4. Nu retrimite in aceeasi zi URL-uri deja confirmate.
