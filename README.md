# ocupaloc.ro — SaaS programări (MVP)

Multi-tenant pentru profesioniști beauty: frizerii, manichiură, gene, pensat, tatuaje, estetică. Stack: **Next.js 15 (App Router)**, **TypeScript**, **Supabase** (Auth + Postgres + RLS), **Tailwind**, **shadcn/ui**, **React Hook Form** (parțial), **Zod**, **Sonner**.

## Cerințe

- Node.js 20+
- Cont [Supabase](https://supabase.com)

## Instalare locală

```bash
npm install
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

```bash
npm run dev
```

- Landing: [http://localhost:3000/](http://localhost:3000/)
- Înscriere: [http://localhost:3000/inscriere](http://localhost:3000/inscriere)
- Intrare: [http://localhost:3000/intrare](http://localhost:3000/intrare)
- Pagină publică: `http://localhost:3000/s/<slug>`
- Admin (necesită login): [http://localhost:3000/admin](http://localhost:3000/admin)
- Demo (login automat demo → admin): [http://localhost:3000/demo](http://localhost:3000/demo) — necesită user-ul din `002_demo.sql` / Dashboard.

## Cloudflare Workers (build + deploy)

Proiectul folosește `@opennextjs/cloudflare` (OpenNext), care generează worker-ul în `.open-next/worker.js` și îl publică prin Wrangler.

1. `npm install`
2. Creează `.env.local` din `.env.example` (aceleași patru variabile).
3. Preview local:

   ```bash
   npm run preview
   ```

   Deschide `http://127.0.0.1:8788` (sau URL-ul afișat de Wrangler).

4. **Deploy Cloudflare Workers**:

   ```bash
   npm run deploy
   ```

5. În Cloudflare → proiect → **Settings → Environment variables**, adaugă aceleași chei ca în `.env.example` (inclusiv `NEXT_PUBLIC_SITE_URL` la domeniul producției, ex. `https://ocupaloc.pages.dev`).

6. În Supabase → Authentication → URL Configuration: adaugă URL-ul de producție la **Redirect URLs** (OAuth + `/auth/callback`).
`wrangler.jsonc` din root setează worker-ul (`main`), D1 bindings, variabilele și ruta domeniului.

### Setare secrete email în Cloudflare

Rulează:

```bash
npm run cf:secrets
```

Când ți se cere valoarea:
- `RESEND_API_KEY` = cheia din [resend.com/api-keys](https://resend.com/api-keys)
- `RESEND_FROM` = adresa verificată în Resend (ex. `noreply@ocupaloc.ro`)

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
4. `npx wrangler deploy`
