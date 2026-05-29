# Cursor Deploy Prompt - OcupaLoc FINAL

## Verificări Pre-Deploy
```bash
cd /Users/balascanuanamaria/Proiecte/ocupaloc.ro
npx tsc --noEmit
npm run build
```

## Deploy Comandă
```bash
vercel --prod
```

## Verificări Post-Deploy

### 1. Responsive / Mobile
- [ ] https://ocupaloc.ro - test pe telefon real
- [ ] https://ocupaloc.ro/login - afișează corect pe mobil
- [ ] https://ocupaloc.ro/signup - pașii încap pe ecran
- [ ] https://ocupaloc.ro/dashboard - navigare rapidă funcționează
- [ ] https://ocupaloc.ro/[slug] - pagina publică responsive

### 2. Fără Erori Vizibile
- [ ] Nu apare "column does not exist" la programări
- [ ] Nu sunt coloane goale/gri în dashboard
- [ ] Nu sunt bari negre în preview iframe
- [ ] Nu sunt bari negre în pagina publică video
- [ ] Login/logout fără fundal negru

### 3. Culori Uniforme
- [ ] OcupaLoc folosește doar tokenii `oc-*`
- [ ] Nu mai sunt culori hardcodate (emerald, teal, amber direct)
- [ ] Badge-uri și statusuri au culori consistente

### 4. Funcționalități Critice
- [ ] Signup completează toți 3 pașii
- [ ] Login cu mesaj clar "Email sau parolă invalidă"
- [ ] Programare manuală din dashboard funcționează
- [ ] Link public poate fi copiat și trimis
- [ ] Preview arată pagina publică corect

### 5. Galerie Foto
- [ ] Card galerie are instrucțiuni clare
- [ ] Preview imagini funcționează
- [ ] Poze apar pe pagina publică

## Rollback (dacă e necesar)
```bash
git log --oneline -5  # vezi commit-urile
git revert HEAD       # revert ultimul commit
vercel --prod         # redeploy
```

## Checklist Final
- [ ] Site încarcă rapid
- [ ] Nu sunt erori în console (F12)
- [ ] Mobile-friendly pe toate paginile
- [ ] Build fără erori TypeScript

## Comandă Rapidă
```bash
cd /Users/balascanuanamaria/Proiecte/ocupaloc.ro && npx tsc --noEmit && vercel --prod
```
