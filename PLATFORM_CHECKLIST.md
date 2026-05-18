# PLATFORM CHECKLIST - GitHub + Vercel (OcupaLoc)

Scop: înghețarea tehnică a workflow-ului definit în DEPLOY.md.

## 1) GitHub - Branch protection (click-by-click)

### 1.1 Protecție pentru main

1. Deschide repository-ul pe GitHub.
2. Intră la Settings -> Branches.
3. În Branch protection rules apasă Add branch protection rule.
4. La Branch name pattern setează main.
5. Bifează Require a pull request before merging.
6. Bifează Require approvals.
7. Setează Required approving reviews la 1 minim.
8. Bifează Dismiss stale pull request approvals when new commits are pushed.
9. Bifează Require review from CODEOWNERS (dacă există CODEOWNERS).
10. Bifează Require status checks to pass before merging.
11. Bifează Require branches to be up to date before merging.
12. În lista de checks adaugă obligatoriu CI.
13. Dacă apare separat în listă, adaugă și Typecheck, Lint & Build.
14. Bifează Require conversation resolution before merging.
15. Bifează Include administrators.
16. Bifează Restrict who can push to matching branches.
17. Lasă lista de persoane goală sau strict owner/admin desemnat.
18. Bifează Do not allow bypassing the above settings.
19. Bifează Allow force pushes = Off.
20. Bifează Allow deletions = Off.
21. Apasă Create.

### 1.2 Protecție pentru staging

1. Settings -> Branches -> Add branch protection rule.
2. La Branch name pattern setează staging.
3. Bifează Require a pull request before merging.
4. Setează Required approving reviews la 1 (sau 0 dacă vrei integrare foarte rapidă, dar recomandat 1).
5. Bifează Require status checks to pass before merging.
6. Adaugă check-ul CI ca required.
7. Bifează Require branches to be up to date before merging.
8. Bifează Include administrators.
9. Bifează Restrict who can push to matching branches.
10. Permite push doar pentru maintainerii tehnici (nu toată echipa).
11. Lasă Allow force pushes = Off.
12. Lasă Allow deletions = Off.
13. Apasă Create.

### 1.3 Setări suplimentare recomandate în GitHub

1. Settings -> General -> Pull Requests.
2. Bifează Always suggest updating pull request branches.
3. Bifează Allow auto-merge doar dacă vrei după checks verzi.
4. Debifează squash-only dacă echipa folosește și merge commit pentru release context.
5. Activează branch deletion după merge doar pentru feature branches.

## 2) Vercel - Deploy și environment separation (click-by-click)

### 2.1 Fixare producție pe main

1. Intră în Vercel -> Project ocupaloc.
2. Settings -> Git.
3. La Production Branch setează main.
4. Salvează.
5. Confirmă că nu există branch alternativ setat ca producție.

### 2.2 Separare Preview vs Production

1. Settings -> Environment Variables.
2. Verifică fiecare variabilă critică și asigură scope corect:
   - Production: secrete reale de producție.
   - Preview: secrete de preview sau valori sandbox.
   - Development: locale/dev.
3. Pentru chei sensibile (billing, service role, webhook, cron secret):
   - Nu reutiliza aceleași valori în Preview dacă nu e necesar.
4. Salvează și redeploy dacă Vercel cere re-deploy pentru propagare.

### 2.3 Înghețare flux deploy

1. Settings -> Deployments.
2. Confirmă că Git Integration este activ.
3. Confirmă că preview deployments sunt active pentru PR-uri.
4. Confirmă că production deploy vine din merge în main.
5. Interzis operațional: deploy manual local cu flag de producție pentru release normal.

### 2.4 Domenii și alias

1. Settings -> Domains.
2. Confirmă domeniul de producție corect (ocupaloc.ro).
3. Confirmă că preview are URL separat de producție.
4. Verifică redirecționările și certificatele TLS active.

## 3) Verificare post-configurare (o singură dată, după setup)

1. Creează un branch test feat/ops-branch-protection-check.
2. Deschide PR către staging fără a rula CI complet (simulează fail).
3. Confirmă că merge este blocat.
4. După CI verde, confirmă că merge devine permis.
5. Repetă cu PR staging -> main și confirmă aceleași blocaje.
6. Verifică în Vercel că PR-ul are preview deployment separat.
7. Verifică faptul că producția nu se modifică până la merge în main.

## 4) Audit periodic (lunar + anual)

### 4.1 Audit lunar (5-10 minute)

1. GitHub main: protection rule activă și checks required.
2. GitHub staging: protection rule activă și checks required.
3. Vercel Production Branch este main.
4. Preview deployments active.
5. Nu există deploy-uri manuale nejustificate în istoric.

### 4.2 Audit anual (hardening)

1. Revizuiește lista de admini GitHub și Vercel.
2. Elimină accesul persoanelor inactive.
3. Rotește secretele critice (billing/webhook/service role/cron).
4. Reconfirmă separarea Production vs Preview env vars.
5. Rulează testul de blocare merge pe main cu CI roșu.
6. Verifică faptul că nimeni nu poate face push direct în main.

## 5) Conflicturi cunoscute de evitat

1. Production Branch schimbat accidental din main în alt branch.
2. Reguli diferite între main și staging care permit ocolirea flow-ului.
3. Variabile de producție replicate în Preview fără control.
4. Bypass manual al branch protections de către administratori.

## 6) Definiție de succes operațional

Workflow-ul este înghețat corect dacă:

1. Niciun commit nu ajunge în producție fără PR, review și CI verde.
2. Fiecare PR are preview deployment verificabil.
3. Deploy-ul live apare doar după merge în main.
4. main și staging nu permit push direct necontrolat.
