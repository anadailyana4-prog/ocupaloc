# DEPLOY - Workflow Operațional OcupaLoc

Acest document este sursa scurtă de adevăr pentru dezvoltare, preview, release și verificare post-deploy.

## 1) Branching model (obligatoriu)

- Branch de producție: `main`
- Branch de integrare: `staging`
- Feature branches: din `staging`
- Flux standard: `feature/* -> staging -> main`

Convenție branch names:

- `feat/public-nume-scurt`
- `feat/app-nume-scurt`
- `fix/public-nume-scurt`
- `fix/app-nume-scurt`
- `chore/ops-nume-scurt`
- `hotfix/prod-nume-scurt`

## 2) Reguli preview vs production

- Preview:
  - fiecare PR are preview deployment automat (Vercel Git integration)
  - se validează pe preview înainte de merge
- Production:
  - doar după merge în `main`
  - deploy-ul de producție este automat din Vercel pentru `main`

Interzis:

- deploy direct local în producție din stare neclară
- deploy producție din alt branch decât `main`
- schimbarea production branch fără decizie explicită și documentată
- merge în `main` fără PR + checks verzi

## 3) Checklist înainte de push

1. Rulează local minim:
	- `pnpm run check:local`
2. Dacă atingi auth/booking/billing/jobs:
	- `pnpm run check:all`
3. Verifică `git status`:
	- fără fișiere accidentale
	- fără schimbări amestecate
4. Commit-uri mici, tematice:
	- nu combina UI + logică + ops în același commit mare

## 4) Checklist înainte de production

Obligatoriu pe preview:

1. Build și CI verzi
2. Fără erori majore în console/loguri
3. Smoke check manual pe rutele critice

Rute critice de verificat manual la fiecare release:

- Public marketing: `/`, `/preturi`, `/demo-interactiv`
- Public transactional: `/signup`, `/reset-password`, `/programare/confirmare`, `/billing/anulat`
- Booking public: `/[slug]`, `/[slug]/[serviciu]`
- App entry: `/login`, `/dashboard`
- Health: `/api/health`

Nu promova release dacă:

- există regresii vizuale evidente pe public/transactional
- există erori de auth, booking sau billing în smoke
- CI este roșu sau incomplet

## 5) Reguli interzise

- `vercel --prod` rulat local pentru release normal
- push direct în `main`
- PR-uri gigant cu zone amestecate
- schimbări de workflow/deploy fără actualizare în acest fișier

## 6) Procedură scurtă de release

1. Creezi branch din `staging`
2. Implementezi schimbarea
3. Rulezi local checks
4. PR către `staging` + validezi preview
5. Merge în `staging`
6. PR `staging -> main`
7. Verifici CI + preview final
8. Merge în `main` -> deploy producție automat
9. Post-deploy:
	- verifici `/api/health`
	- verifici rutele critice
	- verifici logurile Vercel
