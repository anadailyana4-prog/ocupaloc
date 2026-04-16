# Cloudflare Pages Deploy Checklist

## Recuperare după probleme (ștergeri, site „mort”, token OK)

Nu există un singur buton „repară tot” în Cloudflare. Ordinea recomandată:

1. **Diagnostic din repo** (token API creat în dashboard — **nu** un cuvânt din tutorial; pune valoarea reală în `export`):
   ```bash
   export CLOUDFLARE_API_TOKEN="<valoare din Create Token>"
   npm run cf:repair-status
   ```
   Îți spune dacă proiectul Pages `ocupaloc` există, domeniile și pașii următori.

2. **Dacă proiectul Pages lipsește**: `npx wrangler pages project create ocupaloc` apoi `npm run deploy:pages`, apoi **Pages → Settings → Environment variables** (vezi `.env.example`).

3. **Dacă 403 pe www / domeniu**: vezi secțiunea *HTTP 403* de mai jos (Access / WAF), nu e reparabil doar din Next.

4. **Cache**: *Caching* → **Purge Everything** după schimbări DNS sau env.

**Notă:** Alt proiect (ex. Scanmasa) nu trebuie atins când lucrezi la Ocupaloc; scripturile de mai sus listează doar și, la `cf:remove-ocupaloc-pages`, șterg explicit proiectul `ocupaloc`.

---

- [ ] Variabile setate în Cloudflare Pages (Supabase, `NEXT_PUBLIC_SITE_URL`, etc.)
- [ ] Domeniu **apex** `ocupaloc.ro` legat de proiectul Pages (producție)
- [ ] **www** → vezi secțiunea de mai jos (nu depinde de tichet dacă folosești redirect)
- [ ] Test login/signup
- [ ] Test dashboard
- [ ] Test booking flow
- [ ] Analytics activ

## `www.ocupaloc.ro` fără să „agăți” www pe Pages (recomandat)

1. **În cod** (deja făcut): `next.config.ts` redirecționează host `www.ocupaloc.ro` → `https://ocupaloc.ro` (301). Când cererea **ajunge** la deploy-ul Next, `www` cade pe apex.

2. **În Cloudflare DNS** (zona `ocupaloc.ro`):
   - Înregistrare **CNAME** `www` → `@` (sau către ținta indicată de CF), **proxied** (nor portocaliu), ca `www` să rezolve prin Cloudflare.

3. **Redirect Rule (opțional dar solid)**: dacă `www` nu ajunge la același worker sau vrei redirect înainte de app:
   - **Rules** → **Redirect Rules** → *Create rule*
   - **If** `Hostname` *equals* `www.ocupaloc.ro`
   - **Then** *Dynamic* redirect la `https://ocupaloc.ro${uri}` sau path static cu păstrare path-ului — 301/308.

4. După modificări: **Caching** → *Purge Everything* (dacă vezi comportament vechi).

5. **În cod (fără tichet):** `middleware.ts` redirecționează `www` → `https://ocupaloc.ro` imediat; `next.config` are același redirect + headere de securitate. **Dacă tot vezi 403 înainte de a ajunge la site**, cauza nu e în Next — e la Cloudflare.

## HTTP 403 pe `www.ocupaloc.ro` („Nu ești autorizat(ă)”)

Asta **nu se repară din repo**: cererea este oprită la **Cloudflare Access / Zero Trust** sau **WAF**, înainte de aplicație.

1. **Zero Trust** → **Access** → **Applications** — șterge sau dezactivează politica care protejează `www.ocupaloc.ro` sau `*.ocupaloc.ro` pentru site public.
2. **Security** → **WAF** → **Custom rules** — nu lăsa **Block** pe `www` fără să fie intenționat.
3. După schimbare: **Purge Everything** și test în fereastră incognito.

Când 403 dispare, redirecturile din cod și din DNS de mai sus vor funcționa.

## Verificări rapide după deploy

- URL preview Cloudflare răspunde cu 200
- `curl -sI https://www.ocupaloc.ro` arată `301` sau `308` către `https://ocupaloc.ro/...`
- `/login` și `/signup` funcționează
- `/dashboard` redirecționează corect când nu ești autentificat
- `/api/auth/signout` răspunde fără erori
- `sitemap.xml` și `robots.txt` servite corect
