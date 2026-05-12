# Outreach Ops Deploy Checklist

## 1) Pre-deploy local checks

1. Ruleaza `pnpm run typecheck`.
2. Ruleaza `pnpm run build`.
3. Ruleaza testele tintite:
   - `node --import tsx --test tests/outreach-ops-state-machine.test.ts`
   - `node --import tsx --test tests/outreach-scheduler-guards.test.ts tests/outreach-telegram-format.test.ts`

## 2) Supabase migrations

1. Verifica proiectul link-uit:
   - `pnpm dlx supabase link --project-ref <PROJECT_REF>`
2. Aplica migrarile:
   - `pnpm dlx supabase db push --linked`
3. Verifica tabelele noi:
   - `niches`, `coverage_zones`, `leads`, `outreach_campaigns`, `outreach_messages`, `telegram_admins`, `daily_reports`.
4. Verifica seed-ul initial:
   - nisele: `barber`, `frizerii`, `saloane`, `clinici-estetice`
   - zonele in ordine: `Bucuresti + Ilfov`, `Cluj-Napoca`, `Timisoara`, `Iasi`, `Constanta`, `Brasov`

## 3) Environment variables

Seteaza minim:

- `OUTREACH_CRON_SECRET`
- `OUTREACH_SIGNING_SECRET`
- `OUTREACH_SMTP_*` si `OUTREACH_IMAP_*`
- `OUTREACH_SEND_LIMIT_PER_HOUR=10`
- `OUTREACH_SEND_LIMIT_PER_DAY=50`
- `OUTREACH_BATCH_SIZE=10`
- `OUTREACH_FOLLOW_UP_DELAY_DAYS=4`
- `OUTREACH_SENDER_NAME`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_OWNER_IDS`
- optional: `TELEGRAM_ADMIN_IDS`, `TELEGRAM_OPERATOR_IDS`

## 4) Telegram setup

1. Ruleaza helperul:
   - `pnpm dlx tsx scripts/setup-telegram-outreach.ts`
2. Verifica webhook:
   - endpoint: `/api/telegram/outreach`
   - header validat: `X-Telegram-Bot-Api-Secret-Token`
3. In Telegram ruleaza:
   - `/start`
   - `/help`
   - `/status`

## 5) Scheduler setup (Vercel Hobby safe)

Varianta implementata in repo: GitHub Actions (`.github/workflows/outreach-automation.yml`).

Secrete necesare in GitHub Actions:

- `OUTREACH_AUTOMATION_URL` (ex: `https://ocupaloc.ro/api/jobs/outreach-automation`)
- `OUTREACH_CRON_SECRET`

Flux:

1. Ruleaza `action=cycle` la 15 minute.
2. Ruleaza `action=report` zilnic la ora 18:00.
3. Poti porni manual workflow-ul cu `workflow_dispatch` si `action` custom.

## 6) Verificari manuale post-deploy

1. Endpoint cron securizat:
   - `GET /api/jobs/outreach-automation?action=cycle` cu `Authorization: Bearer <OUTREACH_CRON_SECRET>`
2. In Telegram:
   - `/status` afiseaza nisa si zona activa
   - `/coverage` afiseaza progres procentual
   - `/pause` opreste trimiterea
   - `/resume` reia trimiterea
3. Opt-out:
   - reply cu "stop" -> intra in `suppression_list`
   - lead-ul nu mai primeste follow-up
4. Limits:
   - verifici in `outreach_messages` ca nu depaseste 10/h si 50/zi
5. Reports:
   - `/report` genereaza date in `daily_reports`

## 7) Limitari curente

1. Clasificarea reply-urilor este euristica, nu NLP complet.
2. Coverage-ul national complet trebuie extins cu mai multe localitati in seed.
3. Daca treci pe Vercel Pro, poti muta schedulerul din GitHub Actions pe cron nativ.