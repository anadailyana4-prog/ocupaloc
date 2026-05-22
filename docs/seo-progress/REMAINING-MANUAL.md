# Ce rămâne manual (nu poate fi făcut de agent)

## Obligatoriu — tu

| Task | De ce |
|------|--------|
| **Deploy producție** | Blog, CWV, 7 orașe — `git push` sau `pnpm deploy` / Vercel Dashboard |
| **GBP verificare** | SMS/video doar pe telefonul tău (Ziua 2) |
| **GSC inspecție URL** | 5–10 URL/zi din [seo-index-queue-next-day.md](../seo-index-queue-next-day.md) |
| **DNS domeniu GSC** (opțional) | `sc-domain:ocupaloc.ro` → Cloudflare „Începe confirmarea” |

## După deploy — verificare rapidă

```bash
pnpm seo:audit-sitemap
curl -sI https://ocupaloc.ro/blog/cum-sa-angajezi-frizeri | head -1
curl -sI https://ocupaloc.ro/craiova | head -1
```

Ambele trebuie **HTTP/2 200**.

## Ziua 6 (social) — încă nefăcută

Postări Facebook / LinkedIn / Instagram / Pinterest — texte în plan, publicare manuală.
