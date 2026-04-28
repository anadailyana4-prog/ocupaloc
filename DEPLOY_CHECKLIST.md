## Vercel Production Alignment Checklist (GitHub `main`)

## 1) Confirm deployment trigger path
- [ ] În Vercel Project Settings -> Git: repository conectat este `anadailyana4-prog/ocupaloc`
- [ ] Production Branch este `main`
- [ ] Auto-deploy pentru production branch este activ

## 2) Confirm latest GitHub commit is deployed
- [ ] În Vercel Deployments: există un deployment nou pentru ultimul commit din `main`
- [ ] Deployment status este `Ready`
- [ ] Commit SHA din deployment = SHA-ul din GitHub `main`

## 2b) Prove deployment SHA from CLI (recommended)
- [ ] Rulează `git rev-parse HEAD` și notează SHA-ul local curent
- [ ] Rulează `npx vercel ls --prod` și confirmă că apare deployment `Ready` pentru SHA-ul din `main`

## 3) Confirm production domain points to latest ready deployment
- [ ] În Vercel Deployments/Domains: aliasul de producție (`ocupaloc.ro` / `www.ocupaloc.ro`) este pe deployment-ul de la pasul 2
- [ ] Nu există alias pe un deployment mai vechi

## 4) Confirm runtime health after alias
- [ ] `GET /api/health` returnează `200`
- [ ] Landing page afișează conținutul nou (inclusiv ultimul FAQ fix)
- [ ] Login/signup și booking smoke checks trec

## 4b) Prove live content with cache-bust (recommended)
- [ ] Rulează `curl -sL "https://ocupaloc.ro?cb=$(date +%s)"` și verifică markerul nou de conținut
- [ ] Rulează `curl -sL "https://www.ocupaloc.ro?cb=$(date +%s)"` și verifică același marker
- [ ] Confirmă că markerul vechi nu mai apare în răspunsul HTML

## 5) If auto-deploy did not run
- [ ] Trigger manual redeploy din Vercel pentru ultimul commit din `main`
- [ ] Sau rulează direct `npx vercel --prod --yes` din repo-ul curent
- [ ] Confirmă alias de producție după deploy (ex. `ocupaloc.ro`)
- [ ] Repetă pașii 2-4

## Scope note
- Cloudflare DNS/domain management rămâne separat; checklist-ul acesta validează strict alinierea GitHub -> Vercel pentru producție.
