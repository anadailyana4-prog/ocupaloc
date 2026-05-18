# Platform Production Handoff — Supabase → Vercel → Google Search Console

Data: 2026-05-18  
Proiect: **OcupaLoc** (`ocupaloc.ro`)  
Supabase ref: `tffwoljimpdckvlogyqu` | Vercel project: `ocupaloc`

Acest document este checklist-ul unic pentru închiderea setup-ului de producție **fără a schimba fluxurile aplicației** (booking, auth, billing).

---

## Status rezumat (automat verificat)

| Platformă | Status | Acțiune rămasă |
|-----------|--------|----------------|
| Supabase DB | ✅ Schema + coloane milestone + storage `logos` | Doar Auth redirect URLs (vezi §1.3) — deja 6 URL-uri |
| Supabase SQL 050 | ✅ Rulat | Nimic |
| Vercel producție | ✅ Live `https://ocupaloc.ro` | Adaugă env SEO/Google dacă activezi job indexing |
| GSC | ⏳ Manual | Proprietate + sitemap + indexare priorități |

Comenzi locale:

```bash
pnpm run ops:supabase-audit
pnpm run ops:milestone-backfill
pnpm exec tsx scripts/vercel-production-audit.ts
```

---

## 1. Supabase

### 1.1 Confirmare proiect

- Dashboard: https://supabase.com/dashboard/project/tffwoljimpdckvlogyqu
- URL API trebuie să fie: `https://tffwoljimpdckvlogyqu.supabase.co` (identic cu Vercel `NEXT_PUBLIC_SUPABASE_URL`)

### 1.2 Bază de date — DONE

Audit `pnpm run ops:supabase-audit` confirmă:

- Tabele: `profesionisti`, `servicii`, `programari`, `subscriptions`, `operational_events`, `tenants`, `memberships`
- Coloane: `onboarding_completed_at`, `first_booking_at`, `bio`, `telefon`, `whatsapp`
- View: `profesionisti_public`
- Bucket: `logos`

Migrări repo: `001` … `050` (ultima: milestone backfill).

### 1.3 Authentication — URL Configuration

Link: https://supabase.com/dashboard/project/tffwoljimpdckvlogyqu/auth/url-configuration

| Setare | Valoare recomandată |
|--------|---------------------|
| Site URL | `https://ocupaloc.ro` (sau `https://www.ocupaloc.ro` dacă canonical e www) |
| Redirect URLs | Minim: `https://ocupaloc.ro/**`, `https://www.ocupaloc.ro/**`, `http://localhost:8788/**` |

**Nu modifica** Provider Email dacă signup-ul funcționează deja.

### 1.4 Ce nu se face în Supabase

- Nu șterge date demo (`demo-salon`) dacă folosești `/demo`
- Nu dezactiva RLS pe tabele publice
- Nu rula `RESET` pe producție

### 1.5 După deploy cod (milestone-uri în app)

Noii utilizatori primesc automat `onboarding_completed_at` / `first_booking_at`. Pentru conturi vechi:

```bash
pnpm run ops:milestone-backfill
```

---

## 2. Vercel

### 2.1 Proiect

- **Folosește:** `ocupaloc` → https://ocupaloc.ro
- **Evită confuzia** cu proiectul `ocupaloc.ro` (preview URL separat)
- Settings → Git → Production Branch: `main`

Link: https://vercel.com/anadailyana4-progs-projects/ocupaloc

### 2.2 Environment variables (Production)

Rulează: `pnpm exec tsx scripts/vercel-production-audit.ts`

**Critice (deja prezente în audit):** Supabase, Resend, Stripe, cron secrets principale.

**De adăugat dacă folosești job-ul Google Indexing** (`/api/jobs/google-indexing`):

| Variabilă | Scop |
|-----------|------|
| `SEO_CRON_SECRET` | Auth cron indexing |
| `GOOGLE_INDEXING_CLIENT_EMAIL` | Service account |
| `GOOGLE_INDEXING_PRIVATE_KEY` | Cheie PEM (escape newlines) |
| `GOOGLE_INDEXING_SITEMAP_URL` | `https://ocupaloc.ro/sitemap.xml` |
| `GOOGLE_INDEXING_DAILY_LIMIT` | ex. `12` |

Adaugare CLI:

```bash
npx vercel env add SEO_CRON_SECRET production
# repetă pentru GOOGLE_INDEXING_*
```

După orice env nou: **Redeploy** production.

### 2.3 Cron Jobs

Definite în [`vercel.json`](../vercel.json). Verifică în Vercel → Project → Settings → Cron Jobs că apar toate rutele.

Hartă completă: [`docs/evaluation-cron-jobs-env-map.md`](evaluation-cron-jobs-env-map.md)

### 2.4 Deploy sigur (nu strică fluxul)

1. PR → CI verde → merge `main`
2. Vercel deploy automat
3. Smoke:

```bash
curl -I https://ocupaloc.ro/api/health
curl -I https://ocupaloc.ro/sitemap.xml
```

4. Opțional: `pnpm run ops:synthetic` (cu `SYNTHETIC_MONITOR_SECRET` local)

---

## 3. Google Search Console

### 3.1 Proprietate

1. https://search.google.com/search-console
2. Adaugă proprietate **Domain** `ocupaloc.ro` (recomandat) sau URL prefix `https://ocupaloc.ro`
3. Verificare DNS TXT sau fișier HTML (Vercel poate servi fișierul de verificare)

### 3.2 Sitemap

1. GSC → Sitemaps
2. Trimite: `https://ocupaloc.ro/sitemap.xml`
3. Status așteptat: **Success**

Verificare live:

```bash
curl -I https://ocupaloc.ro/sitemap.xml
curl -I https://ocupaloc.ro/robots.txt
```

### 3.3 Indexare prioritară (primele 5 URL-uri)

Conform [`docs/seo-runbook.md`](seo-runbook.md):

1. https://ocupaloc.ro/programari-online-salon  
2. https://ocupaloc.ro/alternativa-fresha-romania  
3. https://ocupaloc.ro/software-programari-manichiura  
4. https://ocupaloc.ro/aplicatie-programari-frizerie  
5. https://ocupaloc.ro/preturi  

Pentru fiecare: **Inspect URL** → **Request indexing** (respectă cota zilnică).

### 3.4 Raport săptămânal

```bash
pnpm run report:growth:weekly -- --indexed-pages=N --impressions=N --clicks=N
```

Setează `WEEKLY_INTERNAL_EMAILS` pe Vercel dacă vrei email automat.

### 3.5 Legătură cu job-ul din app

Dacă `GOOGLE_INDEXING_*` e configurat pe Vercel, cronul `google-indexing` trimite URL-uri din sitemap zilnic. GSC rămâne sursa de adevăr pentru **ce e indexat**; jobul accelerează descoperirea.

---

## 4. Ordinea recomandată (azi)

```mermaid
flowchart LR
  A[Supabase audit OK] --> B[Auth URLs verificate]
  B --> C[Commit + deploy Vercel]
  C --> D[Env SEO optional]
  D --> E[GSC sitemap + 5 URL]
```

1. ✅ Supabase — audit trecut  
2. Confirmă redirect URLs în dashboard (30 sec)  
3. Commit modificări app (milestone + signup draft) → deploy `main`  
4. Vercel — adaugă env SEO dacă vrei indexing API  
5. GSC — proprietate + sitemap + 5 URL-uri money  

---

## 5. Legături rapide

| Resursă | URL |
|---------|-----|
| Supabase SQL | https://supabase.com/dashboard/project/tffwoljimpdckvlogyqu/sql/new |
| Supabase Auth URLs | https://supabase.com/dashboard/project/tffwoljimpdckvlogyqu/auth/url-configuration |
| Vercel ocupaloc | https://vercel.com/anadailyana4-progs-projects/ocupaloc |
| Search Console | https://search.google.com/search-console |
| Site live | https://ocupaloc.ro |

---

## Documente conexe

- [`evaluation-signup-to-first-booking.md`](evaluation-signup-to-first-booking.md)
- [`evaluation-cron-jobs-env-map.md`](evaluation-cron-jobs-env-map.md)
- [`seo-runbook.md`](seo-runbook.md)
- [`DEPLOY.md`](../DEPLOY.md)
