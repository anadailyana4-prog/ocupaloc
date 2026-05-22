# Ziua 2 (22 Mai 2026) — Google Business Profile

**Plan:** [SEO_PLAN_120_ZILE.md](../SEO_PLAN_120_ZILE.md)  
**Status:** Profil creat (neconfirmat) · verificare telefon + finalizare rămân la tine

### Profil creat (22 Mai 2026)

| Câmp | Valoare |
|------|---------|
| Cont | balascanuanamaria1@gmail.com |
| Nume | OcupaLoc |
| Categorie | Companie de software |
| Site | https://ocupaloc.ro |
| Tip | Comerț cu amănuntul online |
| Adresă | Bulevardul Unirii 54, București, 030167 |
| Location ID | `13142722542351077487` |
| Manager | [business.google.com/locations](https://business.google.com/locations) |
| Stare | **Neconfirmată** — verificare doar pe dispozitivul tău (nu în chat) |

> **Important:** Nu trebuie să „dai confirmare” agentului Cursor. Codul SMS îl introduci singură în browser, pe contul tău Google.

---

## Dacă nu poți finaliza verificarea (Plan B)

Google **cere obligatoriu** verificare (SMS, apel sau altă metodă) înainte ca profilul să apară public. Fără asta, Ziua 2 rămâne **parțială**, dar SEO-ul nu se oprește.

### Ce poți face acum (fără GBP verificat)

| Prioritate | Acțiune | Impact |
|------------|---------|--------|
| 1 | Continuă **Ziua 3** din plan (Core Web Vitals) | Site + GSC |
| 2 | Pregătește materialele GBP (`pnpm seo:gbp-assets`) — le urci după verificare | 5 min |
| 3 | **Ziua 9** din plan: directoare locale (catalogul-afacerilor, bizoo) cu NAP identic | Citări locale |
| 4 | Schema `Organization` / `SoftwareApplication` pe site (anticipat Ziua 11) | Rich results |

### Verificare prin videoclip (pe telefon)

Google cere filmare **live** din app, min. 30 sec. Script și pași:

→ **[gbp-verificare-video-script.md](./gbp-verificare-video-script.md)**

Pe desktop apare de obicei doar SMS; opțiunea video e în **Google Business pe mobil** după „Obține confirmarea”.

### Dacă SMS nu merge deloc

1. În [verificare](https://business.google.com/verify/l/13142722542351077487) → **Confirmați mai târziu** (profilul rămâne draft).
2. Pe **telefon**: reia confirmarea → alege **Înregistrare video** (vezi scriptul de mai sus).
3. Reîncearcă cu **apel vocal** (dacă apare după eșec SMS).
3. Dacă ești blocată la „Aceasta este compania ta?” → mereu **Niciuna nu corespunde** (nu selecta ialoc / alte business-uri de pe Unirii).
4. **Adresă greșită pentru SaaS:** profilul a fost creat cu sediu la Unirii 54 → Google forțează potriviri cu magazine din zonă. Soluție pe termen scurt:
   - Șterge listingul din [Locations](https://business.google.com/locations) → Acțiuni → Șterge
   - Creează din nou **fără adresă de vizită** (doar zonă deservită: România) sau cu **adresa reală ONRC** dacă ai una
5. [Ajutor Google GBP](https://support.google.com/business/answer/7107242) → verificare alternativă

### Ce NU funcționează

- Profil **neconfirmat** = aproape zero vizibilitate în Maps/Căutare locală
- Nu există „skip” permanent fără verificare
- Un alt cont Google nu rezolvă dacă problema e numărul/adresa

---

## Checklist rapid (≈45 min)

| # | Acțiune | Gata |
|---|---------|------|
| 1 | Deschide [business.google.com](https://business.google.com) → profil OcupaLoc | ☐ |
| 2 | Completează toate câmpurile (secțiunea 1) → 100% | ☐ |
| 3 | Încarcă 10 poze din `marketing/gbp-upload/` | ☐ |
| 4 | Publică post săptămânal (secțiunea 3) | ☐ |
| 5 | Trimite 3 solicitări recenzii (secțiunea 4) | ☐ |
| 6 | Screenshot profil 100% + post publicat | ☐ |

**Pregătire locală (deja făcută):**

```bash
pnpm seo:gbp-assets
```

---

## 1. Profil 100% — copy-paste

> OcupaLoc este **software SaaS**, nu salon fizic. Alege categoria potrivită și zona de acoperire **România** (fără adresă de salon dacă nu ai sediu public).

### Categorii Google (primară + secundare)

| Tip | Categorie |
|-----|-----------|
| **Primară** | Software company |
| Secundară | Business management software |
| Secundară | Appointment scheduling service |

### Nume afișat

```
OcupaLoc
```

### Descriere scurtă (max ~750 caractere)

```
OcupaLoc este software românesc de programări online pentru frizerii, saloane, coafor, manichiură, cosmetică, spa și cabinete. Primești un link propriu de rezervare (ex. ocupaloc.ro/salonul-tau) pe care îl pui în Instagram, Google Business sau WhatsApp — clienții rezervă singuri, fără apeluri repetate.

Abonament fix 59,99 RON/lună, fără comision per programare. Confirmări și reminder-e automate, reducere no-show, suport în română.

Încearcă gratuit: ocupaloc.ro/signup
```

### Website

```
https://ocupaloc.ro
```

### Email / telefon

| Câmp | Valoare |
|------|---------|
| Email | contact@ocupaloc.ro |
| Telefon | *(completează numărul de suport dacă există în cont)* |

### Program (dacă e cerut)

```
Luni–Vineri: 09:00–18:00
Sâmbătă–Duminică: Închis
```

*(Ajustează la programul real de suport.)*

### Servicii / produse (adaugă ca „Servicii”)

1. Programări online salon — `https://ocupaloc.ro/programari-online-salon`
2. Aplicație programări frizerie — `https://ocupaloc.ro/aplicatie-programari-frizerie`
3. Software manichiură — `https://ocupaloc.ro/software-programari-manichiura`
4. Prețuri — `https://ocupaloc.ro/preturi`
5. Demo interactiv — `https://ocupaloc.ro/demo-interactiv`

### Atribute (bifează dacă apar)

- Online appointments
- Identitate de gen / echipă: opțional
- Limbi: Română, Engleză

### Zonă deservită

```
România (toată țara)
```

---

## 2. Cele 10 poze

Rulează `pnpm seo:gbp-assets` → folder `marketing/gbp-upload/`.

| Fișier | Ce reprezintă | Unde în GBP |
|--------|---------------|-------------|
| `01-logo-brand.png` | Logo / brand | Logo + cover |
| `02-hero-programari.png` | Hero produs | Fotografii |
| `03-dashboard.png` | Panou profesionist | Fotografii |
| `04-client-mobil.png` | Rezervare mobil client | Fotografii |
| `05-link-rezervare.png` | Trimite link rezervare | Fotografii |
| `06-pret-fix.png` | Preț fix, fără comision | Fotografii |
| `07-saloane.png` | Verticală saloane | Fotografii |
| `08-frizerii.png` | Verticală frizerii | Fotografii |
| `09-manichiura.png` | Verticală manichiură | Fotografii |
| `10-coafor.png` | Verticală coafor | Fotografii |

**Tips upload:** prima poză = logo; a doua = hero; rotește verticalitățile la fiecare 2 săptămâni.

---

## 3. Post săptămânal (copy-paste)

**Tip:** Actualizare / Ofertă  
**Buton:** Află mai multe → `https://ocupaloc.ro/ghid-programari-salon`

**Titlu:**

```
Ghid gratuit: programări salon fără comision
```

**Text:**

```
84% dintre clienți caută salonul pe Google înainte să rezerve.

Am publicat un ghid complet (2025) pentru saloane din România:
→ cum alegi software-ul de programări
→ cum reduci no-show-urile cu până la 70%
→ marketing gratuit (inclusiv Google Business)

OcupaLoc: 59,99 RON/lună, fără comision per programare. Link propriu de rezervare în 30 de minute.

Citește ghidul: ocupaloc.ro/ghid-programari-salon
Începe gratuit: ocupaloc.ro/signup
```

**Link CTA:** `https://ocupaloc.ro/ghid-programari-salon`  
**Imagine post:** `marketing/gbp-upload/02-hero-programari.png` sau `06-pret-fix.png`

---

## 4. Solicitări recenzii (3 mesaje)

Trimite pe WhatsApp / email persoanelor care au testat produsul (beta, prieteni antreprenori, 1–2 saloane pilot).

### Mesaj 1 — scurt

```
Salut! Lucrez la OcupaLoc (programări online pentru saloane, fără comision). Dacă ți-a fost util demo-ul, m-ar ajuta enorm o recenzie scurtă pe Google Business — 2–3 propoziții sunt suficiente. Link: [INSEREAZĂ link „Solicită recenzii” din GBP]. Mulțumesc!
```

### Mesaj 2 — după onboarding reușit

```
Bună! Mă bucur că ți-ai configurat pagina de rezervare pe OcupaLoc. Când ai 2 minute, poți lăsa o recenzie pe profilul nostru Google? Ne ajută la vizibilitate locală. Link direct: [link GBP]. Orice feedback sincer e binevenit.
```

### Mesaj 3 — profesionist din beauty

```
Salut [Nume]! Construim OcupaLoc pentru saloane/frizerii din România — abonament fix, fără comision ca Fresha. Dacă îți place direcția produsului, o recenzie Google de la cineva din industrie contează mult. Îți trimit linkul: [link GBP]. Merci!
```

**Cum obții linkul:** Google Business → Recenzii → „Obține mai multe recenzii” → copiază linkul scurt.

---

## 5. Verificare după publicare

- [ ] Scor profil = 100% (sau „Complet” pe toate secțiunile)
- [ ] Minim 10 fotografii vizibile public
- [ ] Post săptămânal live cu link către `/ghid-programari-salon`
- [ ] 3 mesaje recenzii trimise (notează cui: ___ / ___ / ___)
- [ ] Pagina ghid răspunde 200: `curl -s -o /dev/null -w "%{http_code}" https://ocupaloc.ro/ghid-programari-salon`

---

## Următorul pas (Ziua 3)

Core Web Vitals — [Ziua 3 din plan](../SEO_PLAN_120_ZILE.md#ziua-3-23-mai--core-web-vitals)
