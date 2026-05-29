# ocupaloc.ro — SaaS programări (MVP)

Multi-tenant pentru profesioniști beauty: frizerii, manichiură, gene, pensat, tatuaje, estetică. Stack: **Next.js 15 (App Router)**, **TypeScript**, **Supabase** (Auth + Postgres + RLS), **Tailwind**, **shadcn/ui**, **React Hook Form** (parțial), **Zod**, **Sonner**.

## Operare rapidă (single entrypoint)

Pentru structură, schimbări sigure și operare zilnică, folosește:
- `docs/00_START_HERE_60_SEC.md`
- `docs/DOCS_INDEX.md`
- `docs/PROJECT_OPERATING_GUIDE.md`
- `docs/A_TO_Z_MASTER_INDEX.md`
- `docs/FEATURE_IMPLEMENTATION_CHECKLIST.md`

Comenzi rapide:
- `pnpm run dev` -> start local
- `pnpm run check:local` -> lint + tests + typecheck
- `pnpm run check:all` -> gate local complet
- `pnpm run verify:secrets` -> secret hygiene
- `pnpm run verify:db` -> readiness DB
- `pnpm run verify:billing` -> readiness billing
- `pnpm run ops:synthetic` -> synthetic monitor
- `pnpm run ops:slo` -> release gate SLO

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

## Deploy producție (Vercel, sursa de adevăr)

Producția pentru site-ul live `ocupaloc.ro` este deținută de **Vercel**.

Fluxul corect pentru producție:
1. Push/merge în branch-ul `main` pe GitHub.
2. Vercel trebuie să creeze automat un deployment nou din commit-ul respectiv.
3. Deployment-ul trebuie promovat pe domeniul de producție.

Verificările manuale obligatorii sunt documentate în `DEPLOY_CHECKLIST.md`.

## Hosting & DNS

- **Hosting producție: Vercel.** Deploy-ul se face automat din branch-ul `main` (Git integration). Nu mai folosim Cloudflare Pages/Workers pentru runtime.
- **Cloudflare: doar DNS.** Recordurile pentru `ocupaloc.ro` / `www.ocupaloc.ro` trebuie să indice spre Vercel (vezi *Domains* în proiectul Vercel pentru valorile A/CNAME). Recomandat: DNS-only (nor gri, fără proxy) pe recordurile pe care Vercel le validează, ca să nu existe dublu-CDN.

> Notă: configurația istorică OpenNext/Wrangler a fost eliminată (vezi `docs/archive/`). Dacă vrei vreodată să revii la Cloudflare ca runtime, restaurează `wrangler.jsonc` + `open-next.config.ts` din istoricul git.

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

## Deploy (producție)
1. `npx supabase db push`
2. `pnpm run verify:db`
3. `pnpm run verify:secrets`
4. Push pe branch-ul `main` (declanșează deploy-ul de producție în Vercel)

## Operațional

Consultă [RUNBOOK.md](RUNBOOK.md) pentru guid și instrucțiuni urgente (CI/CD verde, re-run E2E, troubleshooting).

## Outreach B2B Romania

Sistemul B2B de outreach pentru business-uri pe baza de programari are acum o fundatie separata peste outreach-ul existent:

- migrari noi: `043_outreach_ops_foundation.sql` si `044_outreach_ops_seed.sql`
- coverage map national initial pe nise + zone prioritare
- state machine pentru zone: `planned -> scraping -> qualifying -> ready -> sending -> cooldown -> exhausted`, cu `paused`
- Telegram bot in romana pe webhook: `/api/telegram/outreach`
- orchestrare operationala: `/api/jobs/outreach-automation?action=scrape|qualify|send|report|sync-replies|cycle`

Ordinea initiala seed-uita:

- nise: `barber`, `frizerii`, `saloane`, `clinici-estetice`
- zone: `Bucuresti + Ilfov`, `Cluj-Napoca`, `Timisoara`, `Iasi`, `Constanta`, `Brasov`

Configurare minima suplimentara in `.env.local` / productie:

- `OUTREACH_CRON_SECRET`
- `OUTREACH_SIGNING_SECRET`
- `OUTREACH_SEND_LIMIT_PER_HOUR=10`
- `OUTREACH_SEND_LIMIT_PER_DAY=50`
- `OUTREACH_FOLLOW_UP_DELAY_DAYS=4`
- `OUTREACH_BATCH_SIZE=10`
- `OUTREACH_SENDER_NAME`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_OWNER_IDS`
- optional: `TELEGRAM_ADMIN_IDS`, `TELEGRAM_OPERATOR_IDS`

Pornire operationala recomandata:

1. Rulezi migrarile Supabase (`pnpm dlx supabase db push --linked` sau SQL editor in ordinea fisierelor).
2. Configurezi webhook-ul Telegram spre `/api/telegram/outreach` si setezi acelasi `TELEGRAM_WEBHOOK_SECRET`.
3. Verifici `/start`, `/status`, `/coverage` in Telegram.
4. Rulezi `/approve-next` doar cand vrei trecerea reala la urmatoarea zona sau nisa.
5. Pentru batch-uri controlate, pornesti cu `/resume`, iar schedulerul ruleaza prin `/api/jobs/outreach-automation?action=send`.

Nota operationala: repo-ul a avut deja constrangeri de cron pe Vercel Hobby. Rutele si serviciile pentru scheduler exista, dar pentru executie orara stabila poate fi necesar un scheduler extern sau alt runtime care suporta cron orar.

Checklist executabil complet: [docs/OUTREACH_DEPLOY_CHECKLIST.md](docs/OUTREACH_DEPLOY_CHECKLIST.md)

Setup rapid Telegram:

1. Setezi `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_OWNER_IDS`.
2. Rulezi `pnpm run outreach:telegram:setup`.
3. Verifici in Telegram `/start` si `/help`.

Scheduler recomandat pentru setup-ul curent (Vercel Hobby):

- foloseste workflow-ul GitHub Actions din `.github/workflows/outreach-automation.yml`
- setezi secretele `OUTREACH_AUTOMATION_URL` si `OUTREACH_CRON_SECRET`
- job-ul ruleaza `action=cycle` la 15 minute si `action=report` zilnic

## Billing Status

Stripe subscription billing is active and part of the production path. See [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md#stripe-integration-status) and [RELEASE_RUNBOOK.md](RELEASE_RUNBOOK.md#billing-validation-checklist-production) for validation and operational steps.
