# SEO Runbook OcupaLoc

Acest runbook standardizeaza operatiunile SEO pentru indexare, monitorizare si recuperare rapida atunci cand apar blocaje in Google Search Console.

## Obiective
- Crestere constanta a numarului de pagini indexate.
- Reducerea URL-urilor din categoria "Descoperita - nu este indexata".
- Prioritizarea URL-urilor comerciale cu impact pe intentia de cumparare.

## Prioritati URL
Ordinea de lucru ramane fixa:
1. Money pages: `/programari-online-salon`, `/alternativa-fresha-romania`, `/software-programari-manichiura`, `/aplicatie-programari-frizerie`, `/preturi`.
2. Blog list + articole cu intentie comerciala: `/blog`, `/blog/fresha-cat-costa-romania`, `/blog/cum-sa-reduci-anularile`, `/blog/telefon-vs-programari-online`.
3. Pagini locale (oras/serviciu) doar dupa ce lotul de mai sus este stabil.

## Rutina zilnica (5-10 minute)
1. Search Console -> Indexarea paginilor.
2. Verifica trendul "Neindexate" si motivul dominant.
3. URL Inspection pentru primele 3 URL-uri neindexate din lotul prioritar.
4. Daca status este "URL nu este pe Google" si nu exista blocaj tehnic, trimite "Solicita indexarea".
5. Search Console -> Sitemaps: confirma status `Succes` pentru `/sitemap.xml`.

## Management cota zilnica GSC
- Daca apare mesajul "Cota depasita", opreste trimiterea manuala in ziua curenta.
- Nu re-trimite acelasi URL de mai multe ori in aceeasi zi; nu creste prioritatea reala.
- Foloseste sloturile disponibile pe URL-uri comerciale care nu au fost inca trimise.
- Dupa atingerea cotei, pregateste lista pentru ziua urmatoare in ordinea impactului comercial.

## Regula de prioritizare cand cota este mica
1. Pagini comerciale nationale (money pages).
2. Pagini locale oras/serviciu cu intentie tranzactionala mare (`frizerie`, `salon`, `manichiura`).
3. Articole blog care trimit intern spre pagini comerciale.

## Rutina saptamanala (20-30 minute)
1. Re-trimite `/sitemap.xml`.
2. Verifica daca au crescut "Pagini indexate" fata de saptamana trecuta.
3. Revizueste intern linking:
- Homepage trebuie sa aiba link spre paginile comerciale principale.
- Blog post pages trebuie sa aiba legaturi catre pagini comerciale relevante.
4. Noteaza 5 URL-uri care raman neindexate > 14 zile pentru analiza separata.

## Criterii de triere pentru URL neindexat
Un URL ramane in sitemap daca:
- are continut util si intentie comerciala clara;
- are canonical corect catre sine;
- este accesibil cu status 200;
- are legaturi interne din pagini puternice.

Un URL este candidat de reducere de prioritate daca:
- este subtire/duplicat semantic;
- nu are trafic, conversie sau intentie clara;
- consuma crawl budget fara valoare de business.

## Checklist tehnic in cod
- `metadataBase` setat in layout global.
- `alternates.canonical` pe paginile comerciale.
- `openGraph.url` aliniat cu canonical pe paginile cheie.
- `sitemap.ts` cu prioritizare realista (nu toate URL-urile la prioritate mare).
- `robots.ts` sa nu blocheze accidental pagini de marketing.

## Semnal de alerta
Escaladeaza imediat daca apare oricare dintre situatiile:
- crestere brusca a URL-urilor "Accesata cu crawlere - nu este indexata";
- multe URL-uri comerciale devin brusc neindexate;
- sitemap intra in status diferit de `Succes`.

## Comenzi locale utile
```bash
pnpm -s eslint src/app/sitemap.ts src/app/robots.ts src/app/blog/page.tsx src/app/blog/[slug]/page.tsx
```

```bash
curl -I https://ocupaloc.ro/sitemap.xml
curl -I https://ocupaloc.ro/robots.txt
curl -I https://ocupaloc.ro/programari-online-salon
```
