# Production Source of Truth

Acest document este sursa canonică pentru operarea în producție a proiectului Ocupaloc.

## Runtime principal

- Hosting: Vercel (production domain `https://ocupaloc.ro`)
- App: Next.js App Router
- DB/Auth: Supabase
- Billing: Stripe subscriptions
- Email: Resend

## Variabile minime obligatorii (production)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (apex canonic: `https://ocupaloc.ro`)
- `RESEND_API_KEY`
- `RESEND_FROM`
- `REMINDERS_CRON_SECRET`
- `BOOKING_CONFIRMATION_SECRET`
- `HEALTHCHECK_SECRET` (sau fallback la `REMINDERS_CRON_SECRET`)

### Billing

- `BILLING_ENABLED=true`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `BILLING_CURRENCY=ron`
- `BILLING_MONTHLY_PRICE=59.99`
- `BILLING_TRIAL_DAYS=14`

## Endpointuri critice

- `POST /api/billing/create-checkout`
- `POST /api/billing/portal`
- `POST /api/webhooks/stripe`
- `GET /api/public/slots`
- `POST /api/book`
- `GET /api/jobs/send-reminders` (autorizat cu secret)
- `GET /api/health` (public minimal)
- `GET /api/health/detailed` (protejată cu secret)

## Comenzi de release (local/CI)

1. `pnpm install --frozen-lockfile`
2. `pnpm run test:ci`
3. `pnpm run typecheck`
4. `pnpm run lint`
5. `pnpm run build`
6. `npx supabase db push`
7. `pnpm run verify:secrets`
8. `pnpm run verify:db`

## Observabilitate acționabilă

- `reportError` trimite: flow, event, context, stack, severitate (`error`/`critical`) și `runbook_hint`.
- Alert webhook (`ALERT_WEBHOOK_URL`) este throttled per cheie `flow:event`, nu global.
- Când `SENTRY_DSN` este setat, erorile se trimit și în Sentry (non-blocking).
- Pentru exercițiu lunar: rulează un eveniment controlat (`flow=booking`, `event=drill_alert`) și salvează dovada.

## Incident response (P1/P2)

### 1) Booking indisponibil

1. Confirmă impactul:
- `GET /api/health` și `GET /api/health/detailed`.
- test rapid pe `GET /api/public/slots` și `POST /api/book` (staging/prod).
2. Verifică loguri în Vercel Functions și ultimele alerte webhook.
3. Dacă este problemă de DB/Supabase:
- verifică status Supabase,
- limitează trafic write temporar (mesaj support/landing dacă e necesar).
4. Recovery:
- rerulează smoke booking complet,
- confirmă minim 2 rezervări de test,
- notează RCA inițial + acțiuni preventive.

### 2) Webhook Stripe problematic

1. Confirmă în Stripe Dashboard:
- endpoint `POST /api/webhooks/stripe`,
- rata de fail și ultimele răspunsuri.
2. Verifică secretul din Vercel (`STRIPE_WEBHOOK_SECRET`) și semnătura.
3. Verifică idempotency intern în `billing_webhook_events`.
4. Recovery:
- retransmitere evenimente din Stripe Dashboard,
- confirmă actualizare în `billing_subscriptions`,
- verifică un flow portal/checkout.

### 3) Email nu se trimite

1. Confirmă în Resend Dashboard (deliverability + API errors).
2. Verifică `RESEND_API_KEY` și `RESEND_FROM` în Vercel.
3. Verifică loguri app pentru `flow=email`.
4. Recovery:
- re-run controlat pe reminder job,
- reprocesează intervalul afectat,
- confirmă 1 email de test end-to-end.

## Backup și recuperare (Supabase)

### Frecvență minimă recomandată

- Verificare backup automat: săptămânal.
- Restore drill în mediu non-prod: lunar.
- Audit retenție și politici: trimestrial.

### Checklist dashboard Supabase

1. Confirmă backup-uri disponibile pentru proiectul live.
2. Confirmă ultima fereastră de backup complet.
3. Verifică health DB (connections, storage, query errors).
4. Verifică roluri/service access și RLS active pe tabele critice.

### Restore drill (non-production)

1. Export:
- `supabase db dump --linked --file backups/<date>.sql`
2. Restore într-un proiect de test.
3. Validează minim:
- login user test,
- query pe `programari`, `programari_status_events`, `billing_subscriptions`.
4. Salvează evidența drill-ului: operator, timestamp, fișier dump, rezultate.

## Sursă unică de adevăr pentru preț și trial

Sursa de adevăr în cod este `src/lib/billing/public.ts`:

- `BILLING_PRICE_RON`
- `BILLING_TRIAL_DAYS`
- helpers de afișare (`formatBillingPriceRon`, `getBillingTrialLabel`, `getBillingPriceSchemaValue`)

Regulă operațională:
- UI + schema metadata citesc aceste constante.
- Stripe folosește `STRIPE_PRICE_ID` și checkout trial configurat din aceeași valoare `BILLING_TRIAL_DAYS`.
- dacă se schimbă preț/trial, actualizezi: constantă + Stripe price + env docs.

## Flux post-anulare abonament

- Dacă utilizatorul anulează în Stripe, accesul rămâne până la finalul perioadei deja plătite sau trialului curent.
- În aplicație:
- pagina `billing/anulat` explică statusul și oferă acces rapid la portal.
- dashboard-ul păstrează butonul `Gestionează abonamentul`.
- În operare:
- verifică status în `billing_subscriptions` înainte de limitarea entitlement.

## Unit economics (schelet operațional)

### Costuri variabile urmărite

- Stripe: comisioane tranzacții + taxe recurente (Stripe Dashboard -> Balance/Payments).
- Email: volum și cost prin Resend Dashboard.
- Infra: cost hosting/runtime în Vercel Dashboard.

### Metrici minime

- cost per client activ
- cost per booking confirmat
- marjă brută lunară (fără a include costurile fixe non-tehnice)

## SLO-uri simple și verificare

1. SLO API public booking:
- target: `>= 99.9%` răspunsuri `2xx/3xx` pe `GET /api/public/slots` (rolling 30 zile).
- verificare: health checks + synthetic/manual probes.

2. SLO webhook Stripe:
- target: `>= 99.5%` evenimente procesate fără retry final.
- verificare: Stripe Dashboard endpoint stats + verificare `billing_webhook_events`.

3. SLO reminder email:
- target: `>= 99%` job-uri cron finalizate fără eroare critică.
- verificare: loguri cron + alerte `flow=email`.

## Feature flags

Pattern actual: env vars (`BILLING_ENABLED`, `ALERT_*`, etc.).

Reguli:
- orice flag nou trebuie să fie default-safe (`false` sau degradare controlată);
- flag-ul trebuie documentat în acest fișier și în `.env.example`;
- fără feature flag framework separat până la nevoie clară.

## Onboarding funnel (analytics non-PII)

Evenimente urmărite (doar dacă utilizatorul acceptă analytics):

- `signup_step` (view pe pas)
- `onboarding_step_completed`
- `onboarding_step_back`
- `onboarding_signup_submit_started`
- `onboarding_signup_failed`
- `signup_success`

Scop operațional:
- identificăm unde se pierd utilizatorii între pasul 1 -> pasul 3 -> submit;
- prioritizăm fixuri UX pe baza drop-off real.

## Mini-proces suport

- canal principal: `contact@ocupaloc.ro`
- canal secundar: WhatsApp (non-urgent)
- la triere, echipa cere obligatoriu:
	- URL afectat
	- pașii exacți
	- mesaj de eroare
	- impact (un client vs toți)
- răspuns inițial țintă:
	- P1/P2: max 15 minute
	- restul: în aceeași zi lucrătoare

## Test de încărcare înainte de trafic mare

Tool recomandat: `k6` local (fără integrare CI obligatorie în această fază).

Scenariu minim:
1. Endpoint: `GET /api/public/slots`.
2. Durată: 5 minute.
3. Ramping: 0 -> 30 VUs în 2 minute, hold 2 minute, ramp down 1 minut.
4. Praguri:
- p95 < 800ms
- error rate < 1%

Exemplu comandă:
- `k6 run scripts/load/public-slots.k6.js`

Rezultatul testului se arhivează în release notes înainte de campanii mari.

## Legacy / runtime alternativ

Configurațiile Cloudflare/OpenNext din repository sunt păstrate ca runtime alternativ/legacy.
Nu sunt fluxul principal de producție. Folosește-le doar în contexte explicit separate de producție.

## Checklist închidere audit (Part 3-5)

Acest checklist este pentru acțiuni care nu pot fi garantate doar din repository.
Fiecare pas are criteriu "done when".

1. Supabase migrations pe proiectul live
- Cum: rulează `npx supabase db push` din repository-ul legat la proiectul de producție.
- Done when: tabelele `billing_subscriptions` și `billing_webhook_events` există în `public` și `pnpm run verify:db` trece.

2. Paritate env Preview vs Production (Vercel)
- Cum: verifică existența cheilor critice în ambele medii (`npx vercel env ls preview`, `npx vercel env ls production`).
- Done when: cheile critice există în ambele medii (fără valori goale).

3. Stripe webhook live: endpoint + evenimente + duplicat
- Cum: verifică endpoint-ul `/api/webhooks/stripe`, evenimentele active și trimite un retry controlat pentru același eveniment.
- Done when: primul eveniment este procesat, iar replay-ul este marcat duplicate fără efecte secundare în DB.

4. Validare health secret
- Cum: testează `GET /api/health/detailed` fără secret și cu secret valid (`HEALTHCHECK_SECRET` sau fallback `REMINDERS_CRON_SECRET`).
- Done when: răspunsul este `401` fără secret și `200` cu secret.

5. Canonical host pentru apex/www
- Cum: verifică redirect-urile DNS/Vercel astfel încât un singur host să fie canonic.
- Done when: atât `ocupaloc.ro`, cât și `www.ocupaloc.ro` converg stabil la același host final.

6. Branch protection pe main
- Cum: verifică în GitHub că status checks obligatorii sunt active și branch-ul este protejat.
- Done when: merge direct fără PR/checks nu este posibil.

7. Load baseline pe staging
- Cum: rulează `pnpm run load:public-slots` împotriva URL-ului de staging.
- Done when: p95 < 800ms și error rate < 1%.

8. Restore drill Supabase (lunar)
- Cum: execută dump + restore într-un mediu non-prod și validează tabelele critice.
- Done when: există evidență cu operator, timestamp, mediu țintă și rezultate de validare.

9. Drill observabilitate end-to-end
- Cum: generează un eveniment controlat prin `reportError` (ex. `flow=booking`, `event=drill_alert`).
- Done when: payload-ul apare în webhook-ul de alertare și în Sentry (dacă SENTRY este configurat).

10. Validare consimțământ analytics
- Cum: testează browser curat pe homepage cu și fără accept cookies.
- Done when: bannerul apare la prima vizită, iar GA nu se încarcă înainte de accept.

## Handoff juridic (revizuire umană obligatorie)

Documentele de mai jos sunt template operațional și trebuie validate de jurist înainte de semn-off legal:

1. `src/app/confidentialitate/page.tsx`
2. `src/app/termeni/page.tsx`
3. `src/app/cookies/page.tsx`
4. `src/app/gdpr/page.tsx`

Done when legal:
- există aprobare explicită a textelor finale,
- baza legală pentru cookies/analytics este confirmată,
- procesul DSAR (acces/ștergere/export) este validat procedural.
