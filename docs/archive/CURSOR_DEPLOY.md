# DEPLOY OCUPALOC

## Pre-Deploy Setup (DOAR O DATĂ)
În Supabase Dashboard → Storage → New bucket:
- Name: `galerie`
- Public: ✅ Checked (pUBLIC bucket)
- Policies: Add policy for INSERT și SELECT pentru `anon` și `authenticated`

## Deploy Comandă
```bash
cd /Users/balascanuanamaria/Proiecte/ocupaloc.ro && npx tsc --noEmit && vercel --prod
```

## Verificări Post-Deploy
1. Dashboard → Setări → Galerie foto → Upload local funcționează
2. După upload poze apare mesaj: "X imagini încărcate"
3. După Salvare apare mesaj: "Galeria a fost salvată cu succes!"
4. Pozele apar pe pagina publică

## Rollback (dacă e necesar)
```bash
vercel --version # vezi versiunea anterioară
vercel rollback [deployment-url]
```
