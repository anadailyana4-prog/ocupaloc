# Cursor Deploy Prompt - OcupaLoc

## Obiectiv
Deploy schimbările pe producție (Vercel + Supabase)

## Pre-deploy Checklist
- [ ] `npm run typecheck` - 0 erori
- [ ] `npm run build` - Succes
- [ ] Toate culorile standardizate (oc-*)
- [ ] Mesajele de eroare în română
- [ ] Responsive viewport adăugat
- [ ] Prefetch pe linkuri dashboard

## Pași Deploy

### 1. Verificare Build Local
```bash
npm run typecheck
npm run build
```

### 2. Deploy Vercel
```bash
# Opțiunea A - CLI
vercel --prod

# Opțiunea B - Git Push (auto-deploy)
git add .
git commit -m "deploy: standardize colors, fix UX, add responsive"
git push origin main
```

### 3. Verificare Post-Deploy Vercel
- [ ] Site live pe https://ocupaloc.ro
- [ ] Landing page funcționează
- [ ] Login page funcționează
- [ ] Signup flow complet
- [ ] Dashboard accesibil
- [ ] Pagini publice /[slug] funcționează

### 4. Verificare Supabase (dacă e necesar)
```sql
-- Verifică dacă tabelele au coloanele necesare
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profesionisti';

-- Verifică RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profesionisti';
```

### 5. Verificări Funcționale Post-Deploy

#### Test Landing Page
- [ ] Hero section afișează corect
- [ ] CTA "Încearcă gratuit" funcționează
- [ ] Demo vizibil
- [ ] Mobile responsive

#### Test Signup Flow
- [ ] Pasul 1 (business) - funcționează
- [ ] Pasul 2 (servicii) - grid responsive
- [ ] Pasul 3 (program) - salvare corectă
- [ ] Email confirmare trimis

#### Test Login
- [ ] Email + parolă validă = login succes
- [ ] Email + parolă invalidă = mesaj "Email sau parolă invalidă"
- [ ] Email neconfirmat = mesaj clar

#### Test Dashboard
- [ ] Navigare rapidă între pagini (prefetch)
- [ ] Culori uniforme (oc-* palette)
- [ ] Fără mesaje tehnice de eroare
- [ ] Tabel programări funcționează

#### Test Pagină Publică
- [ ] /[slug] afișează business corect
- [ ] Booking card funcționează
- [ ] WhatsApp link corect
- [ ] Galerie imagini (dacă există)

### 6. Rollback Plan (dacă e necesar)
```bash
# Revert la commit anterior
git revert HEAD
vercel --prod
```

## Verificări Finale
- [ ] Google Analytics active
- [ ] Microsoft Clarity active
- [ ] Email notifications funcționează
- [ ] SSL certificate valid
- [ ] Mobile test pe telefon real

## Comenzi Rapide
```bash
# Build + test local
npm run typecheck && npm run build

# Deploy prod
vercel --prod

# Verifică status
curl -I https://ocupaloc.ro
```

## Contact Emergency
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Logs: `vercel logs --prod`
