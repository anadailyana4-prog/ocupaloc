## Pre-Deploy Checklist
- [ ] Rulează `node --import tsx scripts/check-secrets.ts` - trebuie să vezi ✅ OK
- [ ] Rulează `node --import tsx scripts/verify-production-readiness.ts` - trebuie toate ✅
- [ ] SAU rulează `pnpm run deploy:safe` care le face pe ambele + deploy
- [ ] `npx supabase db push` rulat - confirmă că șterge tabelele deprecated
- [ ] `npx next build` trece fără warnings
- [ ] `pnpm tsc --noEmit` trece
- [ ] `wrangler secret list` conține: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM
- [ ] RESEND_FROM = noreply@ocupaloc.ro și domeniul e verificat în Resend
- [ ] `.env.local` e în `.gitignore` - rulează `git check-ignore .env.local` să confirmi

## Smoke Test E2E - 2 minute
1. Signup nou în incognito -> confirmă email -> primești welcome o singură dată -> /onboarding -> /dashboard
2. Login cont existent -> direct /dashboard dacă profil complet
3. Header: neautentificat vezi "Intră în cont", autentificat vezi "Ieși din cont"
4. Booking test: creează programare pe pagina publică -> verifică rând în tabela programari -> verifică email în Resend
5. Verifică /dashboard/servicii -> CRUD pe servicii funcționează

## Post-Deploy
- [ ] `npx wrangler deploy` rulat
- [ ] Test pe https://ocupaloc.ro/signup cu cont real
- [ ] Verifică logs: `npx wrangler tail` să nu vezi erori
