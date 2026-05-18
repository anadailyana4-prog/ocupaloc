# Cum dau taskuri agentului in OcupaLoc

Scop: taskuri clare, rezultate predictibile, fara haos in repo.

## 1) Format standard de task (obligatoriu)

Copiaza acest format de fiecare data:

1. Context
- Ce s-a facut deja.
- Ce constrangeri exista in OcupaLoc (stack, stil, reguli).

2. Obiectiv
- Un singur rezultat clar, masurabil.

3. Scope
- Fisiere/rute exacte care pot fi atinse.

4. Out of scope
- Ce nu are voie sa atinga agentul.

5. Reguli stricte
- Limite tehnice (fara refactor mare, fara schimbare de logica, etc.).

6. Validare
- Comenzi exacte de rulat.
- Ce smoke-check minim trebuie facut.

7. Livrabile
- Ce artefacte trebuie predate (fisiere modificate, raport, etc.).

8. Criteriu de succes
- Cum arata finalul acceptat.

## 2) Cand spargi un task in faze

Sparge taskul in faze daca:
- atinge mai mult de 2 zone (public, app, ops);
- combina UI + logica + deploy;
- implica peste 8-10 fisiere;
- are risc pe auth, booking, billing, jobs;
- necesita migrare vizuala plus schimbari functionale.

Model simplu de fazare:
- Faza 1: analiza + lista scope final
- Faza 2: implementare pe un singur tip de schimbare
- Faza 3: validare + raport final

## 3) Taskuri care NU se dau intr-o singura runda

Nu combina intr-un singur task:
- redesign public + modificari auth/booking;
- refactor intern + schimbari de deploy/workflow;
- fix urgent in productie + cleanup mare;
- modificari DB + schimbari UI extinse;
- audit complet + implementare mare in acelasi pas.

## 4) Ce trebuie sa raporteze agentul la final (obligatoriu)

Agentul trebuie sa livreze mereu:

1. Fisiere create/modificate
2. Ce a schimbat pe scurt in fiecare fisier
3. Ce NU a schimbat (ca sa confirmi scope)
4. Rezultate validare (lint/tests/smoke)
5. Ce a ramas in afara scope-ului
6. Riscuri reziduale
7. Urmatorii pasi (maxim 3)

## 5) Biblioteca de template-uri scurte

### 5.1 Template task UI

Context:
- [ce exista deja]

Obiectiv:
- [uniformizare/fix UI clar]

Scope:
- [lista fisiere UI]

Out of scope:
- logica, API, DB, workflows

Reguli stricte:
- foloseste sistemul vizual existent OcupaLoc
- nu schimba comportamentul componentelor
- fara redesign structural major

Validare:
- eslint pe fisierele atinse
- smoke-check pe rutele afectate

Livrabile:
- cod in fisierele din scope
- raport: fisiere + ce s-a schimbat + ce a ramas

Criteriu de succes:
- UI coerent, fara regressii vizibile, lint clean

### 5.2 Template task de logica

Context:
- [bug/comportament actual]

Obiectiv:
- [comportament nou exact]

Scope:
- [fisiere de logica/rute API]

Out of scope:
- redesign UI, schimbari ops

Reguli stricte:
- pastreaza contractele existente
- schimbare minima necesara
- fara modificari colaterale

Validare:
- tests relevante
- typecheck
- smoke-check flux functional

Livrabile:
- fix implementat
- test(e) adaugat(e) sau actualizat(e)
- raport impact

Criteriu de succes:
- bug rezolvat, flux stabil, teste verzi

### 5.3 Template task ops/deploy

Context:
- [problema operationala]

Obiectiv:
- [regula operationala clara]

Scope:
- [workflows/docs/config platform]

Out of scope:
- cod produs (pagini/componente/business logic)

Reguli stricte:
- schimbari minime si reversibile
- aliniere cu DEPLOY si CONTRIBUTING

Validare:
- validare sintaxa workflow
- verificare conflict cu reguli existente

Livrabile:
- fisiere ops/documentatie actualizate
- procedura executabila pas-cu-pas

Criteriu de succes:
- fluxul nu poate fi ocolit usor

### 5.4 Template task de audit

Context:
- [ce vrei auditat: public, auth, billing, ops]

Obiectiv:
- identificare riscuri prioritizate, fara implementare

Scope:
- [zone exacte]

Out of scope:
- modificari de cod

Reguli stricte:
- findings first, fara eseu
- severitate: critic/major/minor

Validare:
- referinte clare in fisiere/rute

Livrabile:
- lista probleme ordonata dupa severitate
- recomandare de fazare pentru fix-uri

Criteriu de succes:
- ai backlog clar si actionabil

### 5.5 Template task cleanup/refactor limitat

Context:
- [de ce e necesar cleanup-ul]

Obiectiv:
- [curatare limitata, fara schimbare comportament]

Scope:
- [fisiere exacte]

Out of scope:
- functionalitati noi, redesign, deploy

Reguli stricte:
- refactor local, mic
- fara schimbare API publica
- fara mutari masive de fisiere

Validare:
- lint + typecheck
- smoke minim pe ruta afectata

Livrabile:
- diff curat, usor de revizuit
- raport clar ce s-a simplificat

Criteriu de succes:
- cod mai clar, comportament identic

## 6) Top 10 reguli cand lucrezi doar cu agentul

1. Un task = un obiectiv principal.
2. Scope explicit pe fisiere/rute, nu formulare vagi.
3. Out of scope obligatoriu in fiecare task.
4. Nu combina UI + logica + ops intr-un singur task mare.
5. Cere validare explicita, nu doar "am terminat".
6. Cere raport final standard de fiecare data.
7. Pentru zone critice (auth/booking/billing), cere smoke-check obligatoriu.
8. Pentru schimbari mari, impune faze si aprobare intre faze.
9. Nu accepta modificari in afara scope-ului fara confirmare.
10. Daca apar neclaritati, cere clarificare inainte de implementare.

## 7) Mini prompt gata de folosit (copy-paste)

Context:
- [2-4 linii]

Obiectiv:
- [rezultat unic]

Scope:
- [fisiere/rute exacte]

Out of scope:
- [ce nu ai voie sa atingi]

Reguli stricte:
- [3-7 reguli]

Validare:
- [comenzi + smoke-check]

Livrabile:
- [ce trebuie predat]

Criteriu de succes:
- [cum arata done]
