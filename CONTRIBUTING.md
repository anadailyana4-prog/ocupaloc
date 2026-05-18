# CONTRIBUTING - Reguli de lucru OcupaLoc

Acest fișier definește modul standard de lucru pentru a evita schimbări haotice.

## 1) Branch-uri

- `main` = producție
- `staging` = integrare continuă / pre-release
- feature branches pornesc din `staging`

Flux obligatoriu:

- `feature/* -> staging -> main`

## 2) Naming pentru branch-uri

Folosește una dintre formele:

- `feat/public-nume-scurt`
- `feat/app-nume-scurt`
- `fix/public-nume-scurt`
- `fix/app-nume-scurt`
- `chore/ops-nume-scurt`
- `hotfix/prod-nume-scurt`

## 3) Convenții de commit

Format:

- `<type>(<scope>): <mesaj scurt>`

Tipuri:

- `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Exemple:

- `feat(public): unify transactional shell with oc tokens`
- `fix(app): prevent duplicate booking insert`
- `chore(ops): tighten staging deploy rules`

## 4) Validare minimă înainte de PR

Obligatoriu:

- `pnpm run check:local`

Pentru auth/booking/billing/jobs:

- `pnpm run check:all`

## 5) Cum formulezi task-uri pentru agent/developer

Template minim:

1. Context
2. Obiectiv
3. Scope exact (fișiere/rute)
4. Out of scope
5. Reguli stricte (ce nu se atinge)
6. Validări obligatorii
7. Livrabile finale

## 6) Regula de separare UI / logică / ops

- Nu combina în același PR mare:
  - UI (stil/componente)
  - logică (auth/booking/billing/jobs)
  - ops (workflows, deploy, config)
- Dacă schimbarea atinge mai multe zone, sparge în faze/PR-uri separate.

## 7) Definition of Done pentru PR

Un PR este gata doar dacă include:

1. Scope clar și limitat
2. Checks locale rulate
3. Preview verificat pe rutele afectate
4. Riscuri notate
5. Fără fișiere neintenționate în diff

## 8) Referință rapidă

- Reguli deploy: [DEPLOY.md](DEPLOY.md)
- Runbook operațional: [RUNBOOK.md](RUNBOOK.md)
