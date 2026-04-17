# ocupaloc.ro — SaaS programări (MVP)

Multi-tenant pentru profesioniști beauty: frizerii, manichiură, gene, pensat, tatuaje, estetică. Stack: **Next.js 15 (App Router)**, **TypeScript**, **Supabase** (Auth + Postgres + RLS), **Tailwind**, **shadcn/ui**, **React Hook Form** (parțial), **Zod**, **Sonner**.

## Cerințe

- Node.js 22+
- pnpm 9+ (`npm install -g pnpm`)
- Cont [Supabase](https://supabase.com)

## Instalare locală

```bash
pnpm install
```

1. Creează un proiect nou în Supabase.
2. În **SQL Editor**, rulează în ordine:

   - `supabase/migrations/001_init.sql`
   - `supabase/migrations/003_storage_logos.sql` (bucket public **logos** pentru upload din Setări)
   - Opțional demo: creează în **Authentication → Users** utilizator `demo@ocupaloc.ro` cu parola `DemoOcupaloc2026!`, apoi `supabase/migrations/002_demo.sql` (salon + serviciu demo).

3. **Authentication → Providers**: activează Email (și opțional Google). Pentru test rapid, dezactivează confirmarea pe email (Auth → Providers → Email → „Confirm email”).
4. Copiază `.env.example` → `.env.local` și completează:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (doar server — folosit la `/api/public/slots` pentru citire programări fără a expune datele în browser)
   - `NEXT_PUBLIC_SITE_URL` (ex. `http://localhost:3000` sau `http://127.0.0.1:8788` pentru preview Cloudflare)
   - `RESEND_API_KEY` + `RESEND_FROM` — pentru trimitere emailuri de confirmare
   - `REMINDERS_CRON_SECRET` — secret pentru jobul cron `/api/jobs/send-reminders`
   - `BOOKING_CONFIRMATION_SECRET` — secret opțional pentru confirmare booking

```bash
pnpm run dev
```

- Landing: [http://localhost:3000/](http://localhost:3000/)
- Înscriere: [http://localhost:3000/inscriere](http://localhost:3000/inscriere)
- Intrare: [http://localhost:3000/intrare](http://localhost:3000/intrare)
- Pagină publică: `http://localhost:3000/s/<slug>`
- Admin (necesită login): [http://localhost:3000/admin](http://localhost:3000/admin)
- Demo (login automat demo → admin): [http://localhost:3000/demo](http://localhost:3000/demo) — necesită user-ul din `002_demo.sql` / Dashboard.

## Deploy pe Cloudflare Pages

### Build settings (Cloudflare Pages)

- Framework preset: `None`
- Build command:

  ```bash
  pnpm install --no-frozen-lockfile && npx @opennextjs/cloudflare build
  ```

- Build output directory:

  ```bash
  .open-next/assets
  ```

### Environment variables

În dashboard:

`dash.cloudflare.com` → **Pages** → `ocupaloc` → **Settings** → **Variables and Secrets**

Setează minim:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (ex: `https://www.ocupaloc.ro`)
- `NEXT_PUBLIC_GA_ID` (opțional, pentru analytics)
- `RESEND_API_KEY` și `RESEND_FROM` (dacă folosești email-uri tranzacționale)
- `DEMO_EMAIL` și `DEMO_PASSWORD` (dacă păstrezi fluxul `/demo`)

### Wrangler commands utile

```bash
wrangler pages project list
wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL --project-name ocupaloc
wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --project-name ocupaloc
wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name ocupaloc
wrangler pages secret put NEXT_PUBLIC_SITE_URL --project-name ocupaloc
```

### Domeniu custom

În dashboard:

`dash.cloudflare.com` → **Pages** → `ocupaloc` → **Custom domains**

1. Adaugi `www.ocupaloc.ro`
2. Adaugi apex `ocupaloc.ro` (opțional, cu redirect la www)
3. Verifici certificatele TLS active și status `Active`

### Test local build Pages

```bash
pnpm build
npx @opennextjs/cloudflare build
wrangler pages dev .open-next/assets
```

## Structură utilă

| Rută | Rol |
|------|-----|
| `/` | Landing (design păstrat ca în `index.html` istoric, acum în `LandingPage`) |
| `/inscriere` | Onboarding 4 pași |
| `/intrare` | Login email/parolă + Google |
| `/s/[slug]` | Pagină publică + `BookingCard` dinamic |
| `/admin/*` | Panou profesionist (sidebar, checklist onboarding, tasta **N** = programare nouă) |
| `/demo` | Intrare rapidă cont demo (după ce există user în Supabase) |

Preseturi servicii: `src/lib/presets.ts`.  
Migrări: `001_init.sql`, `002_demo.sql`, `003_storage_logos.sql`.

## MVP — ce e livrat vs. următorii pași

**Inclus:** înscriere, login, pagină publică, sloturi calculate, programare client (cu verificare clienți blocați server-side), admin Azi (Anulează / Blochează cu **Undo** 5s în Sonner), calendar cu **drag & drop** între zile (recalcul `data_final`), CRUD servicii (modal RHF+Zod, culori, durate preset), setări cu autosave + **logo** în Storage **logos**, skeleton-uri în Setări / sloturi publice, checklist onboarding, mod demo + banner, rută `/demo`.

**Încă de rafinat (recomandat următor):** RHF+Zod pe toți pașii înscrierii și pe booking public, drag ordine servicii, modal „Mută” din Azi, îmbunătățiri calendar (ore țintă la drop).

Fișierul `index.html` din rădăcină rămâne ca referință statică; aplicația rulează din componentele React din `src/`.

## Deploy
1. `npx supabase db push`
2. `pnpm run verify:db`
3. `pnpm run verify:secrets`
4. Push pe branch-ul `main` (production branch în Cloudflare Pages)

## Deploy pe Cloudflare Pages

- Build command: `pnpm install && npx @opennextjs/cloudflare build`
- Output directory: `.open-next/assets`
- Variabile de mediu necesare:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Operațional

Consultă [RUNBOOK.md](RUNBOOK.md) pentru guid și instrucțiuni urgente (CI/CD verde, re-run E2E, troubleshooting).

## Future Features (Postponed)

**Stripe Payment Integration** — Planned for final phase. Currently postponed; booking flows remain free. See [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md#stripe-integration-status) for activation prerequisites.
