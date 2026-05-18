# Setup development local (OcupaLoc)

Ghid unic pentru a rula aplicația local fără surprize. Pentru operare zilnică în cod, vezi `docs/00_START_HERE_60_SEC.md`.

## Cerințe

| Tool | Versiune |
|------|----------|
| Node.js | 22+ (`.nvmrc` în rădăcină) |
| pnpm | 9+ |
| Supabase | Proiect cloud (sau CLI linkat) |

## Pași rapizi

```bash
pnpm install
cp .env.example .env.local
# completează .env.local (vezi secțiunea Variabile)
pnpm run dev:ready    # verifică .env.local + Node
pnpm run dev          # http://127.0.0.1:8788
```

## Baza de date (Supabase)

**Recomandat:** aplică toate migrările din `supabase/migrations/` în ordine lexicografică (001 … 046). Nu rula doar fișierele vechi din README (`002_demo.sql`, `003_storage_logos.sql` nu mai există sub aceste nume).

```bash
# Cu Supabase CLI și proiect linkat:
pnpm dlx supabase db push --linked
```

**Manual:** SQL Editor → rulează fiecare `supabase/migrations/NNN_*.sql` în ordine. Ignoră `supabase/migrations/_deprecated/`.

**Storage logos:** bucket-ul public `logos` este creat în `004_extra.sql`.

### Cont demo (opțional)

1. Authentication → Users → creează `demo@ocupaloc.ro` (parolă la alegere).
2. Asociază datele demo conform fluxului `/demo` din aplicație / migrări seed (`002_seed.sql`, `003_demos_table.sql`).

## Variabile de mediu (`.env.local`)

### Minim pentru dev (billing dezactivat)

Setează `BILLING_ENABLED=false` (implicit în `.env.example`).

| Variabilă | Rol |
|-----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proiect Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cheie anon (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (API, sloturi) |
| `NEXT_PUBLIC_SITE_URL` | `http://127.0.0.1:8788` |
| `RESEND_API_KEY` / `RESEND_FROM` | Email tranzacțional |
| `REMINDERS_CRON_SECRET` | Orice string lung pentru cron local |

`STRIPE_WEBHOOK_SECRET` **nu** e obligatoriu la pornire când `BILLING_ENABLED=false`.

### Cu billing activ

`BILLING_ENABLED=true` plus: `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_PUBLISHABLE_KEY`.

## URL-uri locale

| Rută RO | Redirect | Rută efectivă |
|---------|----------|---------------|
| `/` | — | Landing |
| `/inscriere` | 308 | `/signup` |
| `/intrare` | 308 | `/login` |
| `/admin` | — | Panou (login necesar) |
| `/s/<slug>` | — | Programare publică |
| `/demo` | — | Intrare demo |

Dev server: **port 8788** (nu 3000).

## Comenzi utile

```bash
pnpm run check:local      # lint + test + typecheck
pnpm run dev:ready        # verifică env înainte de dev
pnpm run verify:secrets   # scan secrete în repo (fără istoric: verify:secrets:tracked)
pnpm run verify:db        # după Supabase configurat
pnpm run test:e2e         # Playwright (server + env reale)
```

## Secrete în istoricul Git

`pnpm run verify:secrets` poate eșua la **„Git history scan”** dacă în trecut s-au comis valori asemănătoare cheilor reale (ex. JWT `eyJ…`, `re_…`), chiar dacă au fost eliminate ulterior.

1. **Rotește** imediat cheile afectate în Supabase / Resend / Stripe.
2. Curățare istoric (opțional, coordonat cu echipa): [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) sau `git filter-repo`, apoi force-push.
3. Pentru verificări locale fără scan istoric: `pnpm run verify:secrets:tracked`

## Depanare

| Problemă | Soluție |
|----------|---------|
| `Missing STRIPE_WEBHOOK_SECRET` la `pnpm dev` | Setează `BILLING_ENABLED=false` sau adaugă secretul Stripe |
| `/login` sau `/signup` returnează 500 | Verifică URL/chei Supabase în `.env.local` |
| `pnpm approve-builds` interactiv | Folosește `pnpm.onlyBuiltDependencies` din `package.json` |
| Build scripts ignorate | Rulează din nou `pnpm install` după pull |
