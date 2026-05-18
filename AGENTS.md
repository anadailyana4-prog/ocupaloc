# AGENTS.md — OcupaLoc

## Stack

Next.js 15 (App Router), TypeScript, Supabase, pnpm. Dev server: **port 8788**.

## Setup local

Vezi **`docs/DEV_SETUP.md`**. Pe scurt:

```bash
pnpm install
cp .env.example .env.local   # completează cu Supabase + Resend
pnpm run dev:ready
pnpm run dev
```

## Calitate înainte de commit

```bash
pnpm run check:local
```

Pre-commit (husky) rulează același `check:local`.

## Variabile critice la runtime

- Cu `BILLING_ENABLED=false`: nu e nevoie de `STRIPE_WEBHOOK_SECRET` la `pnpm dev`.
- Cu `BILLING_ENABLED=true`: obligatoriu `STRIPE_WEBHOOK_SECRET` (+ restul Stripe).

## Migrări DB

46 fișiere în `supabase/migrations/` (001–046). Push: `pnpm dlx supabase db push --linked`.

## Cursor Cloud specific instructions

- **Update script (VM startup):** `pnpm install` din rădăcina repo-ului.
- **Servicii:** un singur proces — `pnpm run dev` → http://127.0.0.1:8788. Nu există Docker Compose în repo; Supabase e extern.
- **E2E / login real:** necesită secrete Supabase + Resend în mediu sau `.env.local` (nu comite). Fără ele, landing merge; signup/login returnează 500.
- **Node:** 22+ (`.nvmrc`).
- **verify:secrets:** scanul istoricului git poate eșua din cauza commit-urilor vechi; folosește `verify:secrets:tracked` sau rotește cheile (vezi `docs/DEV_SETUP.md`).
