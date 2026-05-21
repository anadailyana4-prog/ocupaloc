# Plan SEO OcupaLoc — 120 Zile (4 Luni)

**Perioada:** 21 Mai - 18 Septembrie 2026  
**Obiectiv:** #1 în Google pentru "software programări salon românia"  
**Trafic țintă:** 1,000+ vizite organice/lună până în septembrie

---

## 📅 Structura Perioadelor

| Perioada | Zilele | Focus |
|----------|--------|-------|
| **Foundation** | Zilele 1-30 | Indexare completă, tehnice, bază content |
| **Growth** | Zilele 31-60 | Conținut masiv, link building start |
| **Authority** | Zilele 61-90 | Backlink-uri, guest posts, video |
| **Domination** | Zilele 91-120 | Optimizare, refresh, scale |

---

## 🔴 LUNA 1: FOUNDATION (Zilele 1-30)

### Săptămâna 1: Indexare & Setup (Zilele 1-7)

#### Ziua 1 (21 Mai) — INDEXARE FINALĂ
**Task:** Completează request indexing în GSC pentru ultimele 6 URL-uri  
**Comenzi:**
```bash
# Verificare deploy
curl -s -o /dev/null -w "%{http_code}" https://ocupaloc.ro/intrebari-frecvente
curl -s -o /dev/null -w "%{http_code}" https://ocupaloc.ro/resurse
```
**GSC:** URL Inspection → Request indexing pentru:
- /intrebari-frecvente
- /resurse
- /blog/ghid-seo-saloane-romania
- /blog/cum-sa-cresti-salon-fara-buget
- /blog/retentie-clienti-salon
- /blog/ghid-fiscal-salon-romania

**Output:** Screenshot cu "Indexarea a fost solicitată" pentru toate 6.

---

#### Ziua 2 (22 Mai) — GOOGLE BUSINESS PROFILE
**Task:** Optimizează profilul Google Business  
**Acțiuni:**
1. google.com/business → completează 100% profilul
2. Adaugă 10 poze (salon interior, servicii, echipă)
3. Adaugă post săptămânal cu link către /ghid-programari-salon
4. Solicită 3 recenzii de la cunoștințe

---

#### Ziua 3 (23 Mai) — CORE WEB VITALS
**Task:** Verifică și optimizează viteza  
**Tools:** pagespeed.web.dev

**Verifică:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

**Fix-uri comune:**
- Optimizare imagini (compress)
- Lazy loading
- Font display swap

---

#### Ziua 4 (24 Mai) — BLOG POST #1
**Task:** Creează articol "Cum să angajezi frizeri buni în 2025"  
**Specs:**
- 800-1000 cuvinte
- URL: /blog/cum-sa-angajezi-frizeri
- Keywords: angajare frizer, recrutare salon, salariu frizer romania
- Internal links: către /aplicatie-programari-frizerie
- CTA: Încearcă OcupaLoc gratuit

**Schema:** Article JSON-LD

---

#### Ziua 5 (25 Mai) — BLOG POST #2
**Task:** Creează articol "Design interior salon: idei și costuri 2025"  
**Specs:**
- 1000-1200 cuvinte
- Include 3-5 imagini (Unsplash gratis)
- URL: /blog/design-interior-salon
- Keywords: design salon beauty, amenajare salon, costuri renovare salon

---

#### Ziua 6 (26 Mai) — SOCIAL SIGNALS
**Task:** Distribuie conținutul pe social media  
**Acțiuni:**
1. Post Facebook cu link către /ghid-programari-salon
2. Post LinkedIn: "Cum am digitalizat 3 saloane în România"
3. Story Instagram cu poll: "Folosești programări online?"
4. Pin pe Pinterest cu infografic (Canva free)

---

#### Ziua 7 (27 Mai) — WEEKLY CHECK
**Task:** Verifică progres în GSC  
**Măsoară:**
- Total pagini indexate (target: >30)
- Clicuri săptămâna aceasta vs. săptămâna trecută
- Noi keywords în top 10

**Raportează:** Creștere % față de săptămâna precedentă.

---

### Săptămâna 2: Content Hub (Zilele 8-14)

#### Ziua 8 (28 Mai) — BLOG POST #3
**Task:** "Produse profesionale vs retail: ce să vinzi în salon"  
**Cuvinte:** 900-1100  
**URL:** /blog/produse-profesionale-salon  
**Unic:** Include tabel comparativ prețuri, marje profit.

---

#### Ziua 9 (29 Mai) — LOCAL CITATIONS
**Task:** Listează pe directoare gratuite  
**Directoare target:**
1. catalogul-afacerilor.ro (gratuit)
2. bizoo.ro (gratuit)
3. afaceriromania.ro (gratuit)
4. companii.ro (gratuit)

**Template:**
- Nume: OcupaLoc
- Categorie: Software / Servicii Beauty
- Website: https://ocupaloc.ro
- Descriere: Software românesc de programări pentru saloane, 59.99 RON/lună, fără comision.

---

#### Ziua 10 (30 Mai) — BLOG POST #4
**Task:** "Social media pentru saloane: ghid complet 2025"  
**Cuvinte:** 1200-1500  
**URL:** /blog/social-media-saloane  
**Include:**
- Calendar postări (zilele săptămânii)
- 10 idei de postări ready-to-use
- Hashtags românești (#salonromania #frizerie #manichiura)

---

#### Ziua 11 (31 Mai) — SCHEMA MARKUP UPGRADE
**Task:** Adaugă schema LocalBusiness pe homepage  
**Cod JSON-LD:**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "OcupaLoc",
  "url": "https://ocupaloc.ro",
  "logo": "https://ocupaloc.ro/og-image.svg",
  "description": "Software românesc de programări pentru saloane",
  "priceRange": "RON",
  "areaServed": "Romania"
}
```

---

#### Ziua 12 (1 Iun) — BLOG POST #5
**Task:** "Cât costă să deschizi un salon în România 2025"  
**Cuvinte:** 1500+ (pillar micro)  
**URL:** /blog/cost-deschidere-salon-romania  
**Include:**
- Breakdown costuri: chirie, utilități, echipamente, licențe
- ROI calcul
- Link către /preturi

---

#### Ziua 13 (2 Iun) — FAQ EXPANSION
**Task:** Adaugă 10 întrebări noi în /intrebari-frecvente  
**Subiecte:**
- Integrare cu contabilitate
- Backup date
- Multi-locație
- API disponibil
- GDPR detalii

---

#### Ziua 14 (3 Iun) — WEEKLY CHECK
**Task:** Raport săptămânal GSC  
**Track:**
- Impressions trend (up/down %)
- CTR mediu
- Poziție medie
- Top 3 pagini după trafic

---

### Săptămâna 3: Link Building Start (Zilele 15-21)

#### Ziua 15 (4 Iun) — GUEST POST OUTREACH #1
**Task:** Caută și contactează 5 bloguri beauty românești  
**Target:**
- cristinagheorghe.ro (beauty blogger)
- beautybyjules.com
- bloguri din nișa: saloane, hairstyling, manichiură

**Email template:**
```
Subiect: Propunere articol invitat despre digitalizarea saloanelor

Bună [Nume],

Sunt [Numele tău] de la OcupaLoc, software românesc de programări pentru saloane.

Am observat că ai conținut excelent despre [subiect specific de pe blog].

Aș vrea să contribui cu un articol invitat: "5 greșeli la programări online și cum să le eviți" — 1000 cuvinte, unic, util pentru cititorii tăi.

În schimb, aș aprecia un link către ghidul nostru complet (/ghid-programari-salon).

Ce zici?

Mulțumesc,
[Numele tău]
```

---

#### Ziua 16 (5 Iun) — BLOG POST #6
**Task:** "Calendarul beauty: când clienții cheltuiesc cel mai mult"  
**Cuvinte:** 800-1000  
**URL:** /blog/calendar-beauty-sezon  
**Include:** Grafic cu lunile de vârf (martie, mai, decembrie) + strategii pentru salon.

---

#### Ziua 17 (6 Iun) — UPDATE EXISTING CONTENT
**Task:** Actualizează 3 articole blog vechi  
**Acțiuni per articol:**
- Adaugă 200 cuvinte noi
- Actualizează datele la 2025
- Adaugă 1-2 linkuri interne noi
- Schimbă data publicării la data curentă

---

#### Ziua 18 (7 Iun) — VIDEO SEO START
**Task:** Creează primul video YouTube  
**Subiect:** "Cum să configurezi OcupaLoc în 15 minute"  
**Specs:**
- Durată: 5-8 minute
- Title: "Tutorial OcupaLoc - Setup complet salon programări online"
- Description: Include link către /ghid-programari-salon + timestamps
- Tags: software programari salon, tutorial programari online, ocupaloc

**After upload:** Embed video în /ghid-programari-salon.

---

#### Ziua 19 (8 Iun) — GUEST POST OUTREACH #2
**Task:** Trimite alte 5 emailuri pentru guest post  
**Follow-up:** Cei care nu au răspuns de pe 4 iunie.

---

#### Ziua 20 (9 Iun) — BLOG POST #7
**Task:** "Review comparativ: OcupaLoc vs Fresha vs MERO"  
**Cuvinte:** 1200-1500  
**URL:** /blog/comparatie-software-programari-saloane  
**Tabel comparativ:**
- Preț
- Comision
- Limba română
- Suport local
- Setup timp

**Important:** Fii obiectiv, nu agresiv.

---

#### Ziua 21 (10 Iun) — WEEKLY CHECK + LUNAR RAPORT
**Task:** Raport complet prima lună  
**Măsoară:**
- Total pagini indexate (target: >40)
- Total articole blog publicate (target: 7)
- Total cuvinte noi (target: >8,000)
- Backlink-uri obținute (target: >=2)
- Trafic organic (target: >50 vizite/lună)

---

### Săptămâna 4: Technical & Optimization (Zilele 22-30)

#### Ziua 22 (11 Iun) — IMAGE OPTIMIZATION
**Task:** Compresează toate imaginile de pe site  
**Tools:** tinypng.com sau squoosh.app  
**Target:**
- Toate imaginile < 100KB
- Format WebP cu fallback JPG
- Alt text descriptiv pentru fiecare

---

#### Ziua 23 (12 Iun) — BLOG POST #8
**Task:** "E-mail marketing pentru saloane: ghid practic"  
**Cuvinte:** 900-1100  
**Include:** Template-uri email (confirmare, reminder, reactivare)

---

#### Ziua 24 (13 Iun) — BROKEN LINKS CHECK
**Task:** Verifică și fixează link-uri defecte  
**Tool:** deadlinkchecker.com  
**Fix:** 301 redirect pentru pagini mutate.

---

#### Ziua 25 (14 Iun) — GUEST POST OUTREACH #3
**Task:** Trimite încă 5 emailuri  
**Target:** Bloguri de business antreprenoriat (startupcafe, wall-street, etc.)

---

#### Ziua 26 (15 Iun) — PILLAR PAGE REFRESH
**Task:** Actualizează /ghid-programari-salon  
**Adaugă:**
- Secțiune nouă: "Testimoniale clienți" (3-4 citate)
- Grafic nou: "Economii anuale cu OcupaLoc"
- FAQ nou: 3 întrebări recente de la clienți
- Link către ultimul video YouTube

---

#### Ziua 27 (16 Iun) — SOCIAL PROOF
**Task:** Creează pagină /testimoniale  
**Include:**
- 5 testimoniale video sau text
- Poze cu clienții (cu acord)
- Date concrete: "+30% programări în 2 luni"

---

#### Ziua 28 (17 Iun) — BLOG POST #9
**Task:** "Cum să gestionezi anulările fără să pierzi clientul"  
**Cuvinte:** 800-1000

---

#### Ziua 29 (18 Iun) — COMPETITOR MONITORING
**Task:** Analizează MERO și Fresha  
**Verifică:**
- Ce keywords noi targetează
- Ce conținut au publicat recent
- Unde au backlink-uri (ahrefs free)

**Acțiune:** Identifică oportunități de content gap.

---

#### Ziua 30 (19 Iun) — END OF MONTH 1 REPORT
**Task:** Generează raport lunar complet  
**Include:**
- GSC screenshots (trend 30 zile)
- Lista articole publicate
- Lista backlink-uri obținute
- Acțiuni lunii următoare

---

## 🟢 LUNA 2: GROWTH (Zilele 31-60)

### Obiectiv: Dublare conținut + Primele backlink-uri quality

### Săptămâna 5 (Zilele 31-37)

#### Ziua 31 (20 Iun) — GUEST POST PUBLISH #1
**Task:** Publică primul articol invitat  
**Asigură-te că include:**
- Link dofollow către ocupaloc.ro
- Author bio cu link
- Promovare pe social media

---

#### Ziua 32 (21 Iun) — BLOG POST #10
**Task:** "Strategii de preț pentru saloane: cum să crești tariful fără să pierzi clienți"  
**Cuvinte:** 1000-1200

---

#### Ziua 33 (22 Iun) — PROGRAMMATIC SEO EXPANSION
**Task:** Generează 20 pagini location noi  
**Orașe noi (10):** Galați, Brăila, Ploiești, Pitesti, Craiova, Bacău, Constanța (existent dar extinde), Oradea (extinde), Buzău, Satu Mare

**Servicii per oraș:** frizerie, salon, manichiură, cosmetica, barber

**Total:** 10 orașe × 5 servicii = 50 pagini noi

---

#### Ziua 34 (23 Iun) — VIDEO #2
**Task:** "3 metode să reduci anulările cu 70%"  
**Embed în:** /blog/cum-sa-reduci-anularile

---

#### Ziua 35 (24 Iun) — BLOG POST #11
**Task:** "Soft skills pentru frizeri: cum să crești veniturile"  
**Cuvinte:** 900-1100

---

#### Ziua 36 (25 Iun) — GUEST POST PUBLISH #2
**Task:** Publică al doilea articol invitat  
**Diferit site față de primul.**

---

#### Ziua 37 (26 Iun) — WEEKLY CHECK

---

### Săptămâna 6 (Zilele 38-44)

#### Ziua 38 (27 Iun) — INFOGRAPHIC
**Task:** Creează infografic "Economii anuale cu programări online"  
**Tool:** Canva free  
**Distribuie:** Pinterest, Facebook, în articole blog.

---

#### Ziua 39 (28 Iun) — BLOG POST #12
**Task:** "Cum să folosești Instagram Reels pentru salon"  
**Include:** 5 idei de Reels.

---

#### Ziua 40 (29 Iun) — UPDATE SITEMAP
**Task:** Regenerează sitemap cu cele 50 pagini noi  
**Submit în GSC.**

---

#### Ziua 41 (30 Iun) — BLOG POST #13
**Task:** "Review: cele mai bune scaune frizerie 2025"  
**Affiliate opportunity:** Include link-uri Amazon/Emag (opțional).

---

#### Ziua 42 (1 Iul) — PR PITCH
**Task:** Trimite pitch la 3 publicații: StartupCafe, Wall-Street, Zoso  
**Subiect:** "Cum un software românesc ajută saloanele să economisească 10.000 RON/an"

---

#### Ziua 43 (2 Iul) — BLOG POST #14
**Task:** "Automatizări pentru saloane: ce poți face fără să fii acolo"  
**Cuvinte:** 1000-1200

---

#### Ziua 44 (3 Iul) — WEEKLY CHECK

---

### Săptămâna 7 (Zilele 45-51)

#### Ziua 45 (4 Iul) — GUEST POST OUTREACH BATCH 2
**Task:** Alte 10 emailuri pentru guest post  
**Target:** Bloguri mai mici dar active în nișă.

---

#### Ziua 46 (5 Iul) — BLOG POST #15
**Task:** "Cum să creezi pachete de servicii care se vând"  
**Include:** Exemple concrete de pachete (coafor + manichiură, etc.)

---

#### Ziua 47 (6 Iul) — VIDEO #3
**Task:** "Walkthrough complet dashboard OcupaLoc"  
**Durată:** 10-15 minute  
**Embed în:** /demo-interactiv

---

#### Ziua 48 (7 Iul) — BLOG POST #16
**Task:** "Erori comune la deschiderea unui salon"  
**Cuvinte:** 1200+

---

#### Ziua 49 (8 Iul) — LOCAL SEO BOOST
**Task:** Optimizează toate profilurile sociale cu NAP (Name, Address, Phone) consistent  
**Platforme:** Facebook, Instagram, LinkedIn, Google Business.

---

#### Ziua 50 (9 Iul) — BLOG POST #17
**Task:** "Cum să crești rating-ul Google al salonului"  
**Include:** Template email pentru solicitare review.

---

#### Ziua 51 (10 Iul) — WEEKLY CHECK + MID-MONTH

---

### Săptămâna 8 (Zilele 52-60)

#### Ziua 52 (11 Iul) — GUEST POST PUBLISH #3

---

#### Ziua 53 (12 Iul) — BLOG POST #18
**Task:** "Tendințe frizerie 2025: ce vor clienții"  
**Include:** Imagini trend-uri, culori.

---

#### Ziua 54 (13 Iul) — CONTENT REFRESH BATCH
**Task:** Actualizează 5 articole vechi cu date 2025  
**Adaugă câte 100-200 cuvinte per articol.

---

#### Ziua 55 (14 Iul) — BLOG POST #19
**Task:** "Calculul profitabilității unui salon: ghid complet"  
**Include:** Spreadsheet template gratuit (download magnet).

---

#### Ziua 56 (15 Iul) — GUEST POST PUBLISH #4

---

#### Ziua 57 (16 Iul) — BLOG POST #20
**Task:** "Marketing în timp de criză: cum să supraviețuiască salonul"  
**Cuvinte:** 1000-1200

---

#### Ziua 58 (17 Iul) — TECHNICAL AUDIT
**Task:** Verifică Core Web Vitals din nou  
**Fix:** Orice regression de viteză.

---

#### Ziua 59 (18 Iul) — COMPETITOR CONTENT GAP
**Task:** Identifică 10 articole pe care competitorii le au și tu nu  
**Plan:** Creează versiuni mai bune în luna 3.

---

#### Ziua 60 (19 Iul) — END OF MONTH 2 REPORT
**Target lună 2:**
- Trafic organic: >150 vizite/lună
- Pagini indexate: >100
- Articole blog: 20 total
- Backlink-uri quality: >=5
- Guest posts publicate: >=4

---

## 🔵 LUNA 3: AUTHORITY (Zilele 61-90)

### Obiectiv: Backlink-uri quality + Video SEO + Brand mentions

### Săptămâna 9 (Zilele 61-67)

#### Ziua 61 (20 Iul) — VIDEO #4
**Task:** Interviu cu un client: "Cum am crescut salonul cu 40%"  
**Durată:** 15-20 minute  
**Publish:** YouTube + embed în /cazuri-de-succes

---

#### Ziua 62 (21 Iul) — BLOG POST #21
**Task:** "Cum să faci content marketing pentru salon"  
**Cuvinte:** 1200+

---

#### Ziua 63 (22 Iul) — PR SUCCESS
**Task:** Publicare articol în StartupCafe sau Wall-Street  
**Rezultat:** Brand mention + backlink authority.

---

#### Ziua 64 (23 Iul) — BLOG POST #22
**Task:** "Integrări utile pentru software-ul de programări"  
**Include:** WhatsApp, Google Calendar, etc.

---

#### Ziua 65 (24 Iul) — GUEST POST PUBLISH #5

---

#### Ziua 66 (25 Iul) — YOUTUBE OPTIMIZATION
**Task:** Optimizează toate video-urile publicate  
**Acțiuni:**
- End screens cu subscribe
- Cards către alte video-uri
- Playlists organizate
- Descriții optimizate cu keywords

---

#### Ziua 67 (26 Iul) — WEEKLY CHECK

---

### Săptămâna 10 (Zilele 68-74)

#### Ziua 68 (27 Iul) — BLOG POST #23
**Task:** "Cum să angajezi și să păstrezi talentele în salon"  
**Cuvinte:** 1000-1200

---

#### Ziua 69 (28 Iul) — CASE STUDY NEW
**Task:** Adaugă încă 2 cazuri de succes în /cazuri-de-succes  
**Target:** 5 case studies total.

---

#### Ziua 70 (29 Iul) — BLOG POST #24
**Task:** "Analiza pieței de beauty în România 2025"  
**Include:** Statistici, grafice, proiecții.

---

#### Ziua 71 (30 Iul) — PODCAST APPEARANCE
**Task:** Apariție în podcast de business/antreprenoriat  
**Target:** Podcast românesc cu >1000 ascultători/episod.

---

#### Ziua 72 (31 Iul) — BLOG POST #25
**Task:** "Cum să automatizezi follow-up-ul cu clienții"  
**Cuvinte:** 900-1100

---

#### Ziua 73 (1 Aug) — GUEST POST PUBLISH #6

---

#### Ziua 74 (2 Aug) — WEEKLY CHECK

---

### Săptămâna 11 (Zilele 75-81)

#### Ziua 75 (3 Aug) — VIDEO #5
**Task:** "Comparație live: programare telefon vs online"  
**Format:** Screen recording + voiceover.

---

#### Ziua 76 (4 Aug) — BLOG POST #26
**Task:** "Cum să gestionezi conflictele în echipă"  
**Cuvinte:** 800-1000

---

#### Ziua 77 (5 Aug) — RESOURCE PAGE UPDATE
**Task:** Adaugă 4 resurse noi în /resurse  
**Idei:**
- Calculator marjă profit
- Template feedback client
- Checklist GDPR salon
- Ghid fotografie produse

---

#### Ziua 78 (6 Aug) — BLOG POST #27
**Task:** "Cum să faci cross-selling în salon"  
**Include:** Script-uri de vânzare.

---

#### Ziua 79 (7 Aug) — GUEST POST PUBLISH #7

---

#### Ziua 80 (8 Aug) — BLOG POST #28
**Task:** "Industria beauty post-pandemie: lecții învățate"  
**Cuvinte:** 1000-1200

---

#### Ziua 81 (9 Aug) — WEEKLY CHECK

---

### Săptămâna 12 (Zilele 82-90)

#### Ziua 82 (10 Aug) — VIDEO #6
**Task:** "Cum să creezi o experiență de 5 stele în salon"  
**Include:** Behind-the-scenes la un salon client.

---

#### Ziua 83 (11 Aug) — BLOG POST #29
**Task:** "Tehnologii noi în saloane: AI, VR, AR"  
**Cuvinte:** 900-1100

---

#### Ziua 84 (12 Aug) — LINK RECLAMATION
**Task:** Caută brand mentions fără link  
**Tool:** Google Alerts sau mention.com  
**Acțiune:** Contactează autorii și cere link.

---

#### Ziua 85 (13 Aug) — BLOG POST #30
**Task:** "Cum să organizezi un eveniment în salon"  
**Include:** Checklist complet.

---

#### Ziua 86 (14 Aug) — GUEST POST PUBLISH #8

---

#### Ziua 87 (15 Aug) — CONTENT REFRESH MAJOR
**Task:** Actualizează toate articolele lunii 1 cu date noi  
**Re-publish cu data curentă.**

---

#### Ziua 88 (16 Aug) — BLOG POST #31
**Task:** "Cum să citești analytics pentru salon"  
**Include:** Ghid Google Analytics simplificat.

---

#### Ziua 89 (17 Aug) — SOCIAL PROOF EXPANSION
**Task:** Adaugă 10 testimoniale noi pe site  
**Distribuie pe social media fiecare.**

---

#### Ziua 90 (18 Aug) — END OF MONTH 3 REPORT
**Target lună 3:**
- Trafic organic: >400 vizite/lună
- Pagini indexate: >150
- Articole blog: 30 total
- Backlink-uri quality: >=10
- Video-uri YouTube: 6
- Guest posts: >=8

---

## 🟣 LUNA 4: DOMINATION (Zilele 91-120)

### Obiectiv: #1-3 pentru keywords principale + 1,000+ vizite/lună

### Săptămâna 13 (Zilele 91-97)

#### Ziua 91 (19 Aug) — KEYWORD OPTIMIZATION
**Task:** Optimizează top 10 pagini pentru CTR  
**Acțiuni:**
- Rewrite titles cu power words
- Add numbers în titles
- Improve meta descriptions
- Add FAQ schema unde lipsește

---

#### Ziua 92 (20 Aug) — BLOG POST #32
**Task:** "Cum să scalezi salonul: de la 1 la 3 locații"  
**Cuvinte:** 1200-1500

---

#### Ziua 93 (21 Aug) — PILLAR PAGE 2.0
**Task:** Rescrie și extinde /ghid-programari-salon  
**Target:** 4000+ cuvinte, cel mai complet ghid din România.

---

#### Ziua 94 (22 Aug) — VIDEO #7
**Task:** "Răspunsuri la întrebări frecvente (Q&A live)"  
**Format:** Live stream sau pre-înregistrat.

---

#### Ziua 95 (23 Aug) — BLOG POST #33
**Task:** "Cum să vinzi produse retail în salon"  
**Include:** Strategii de merchandising.

---

#### Ziua 96 (24 Aug) — GUEST POST PUBLISH #9

---

#### Ziua 97 (25 Aug) — WEEKLY CHECK

---

### Săptămâna 14 (Zilele 98-104)

#### Ziua 98 (26 Aug) — BLOG POST #34
**Task:** "Cum să gestionezi sezonul slow (ianuarie-februarie)"  
**Include:** Promoții și strategii.

---

#### Ziua 99 (27 Aug) — COMPETITOR DISPLACEMENT
**Task:** Targetează direct keywords competitori  
**Crează articole comparative mai bune.

---

#### Ziua 100 (28 Aug) — BLOG POST #35
**Task:** "Cum să creezi un brand personal ca hairstylist"  
**Cuvinte:** 1000-1200

---

#### Ziua 101 (29 Aug) — VIDEO #8
**Task:** "Tutorial avansat: customizare completă OcupaLoc"  
**Durată:** 20+ minute.

---

#### Ziua 102 (30 Aug) — BLOG POST #36
**Task:** "Cum să atragi clienți high-ticket"  
**Include:** Profil client ideal, strategii de preț.

---

#### Ziua 103 (31 Aug) — GUEST POST PUBLISH #10

---

#### Ziua 104 (1 Sept) — WEEKLY CHECK

---

### Săptămâna 15 (Zilele 105-111)

#### Ziua 105 (2 Sept) — BLOG POST #37
**Task:** "Cum să construiești un dream team în salon"  
**Include:** Interviuri, onboarding, training.

---

#### Ziua 106 (3 Sept) — CASE STUDY FINAL
**Task:** Adaugă încă 3 cazuri de succes  
**Target:** 8 case studies total.

---

#### Ziua 107 (4 Sept) — BLOG POST #38
**Task:** "Cum să creezi un program de loialitate care funcționează"  
**Include:** Template program de puncte.

---

#### Ziua 108 (5 Sept) — VIDEO #9
**Task:** "Analiză anuală: ce am învățat de la 100+ saloane"  
**Include:** Statistici agregate, insight-uri.

---

#### Ziua 109 (6 Sept) — BLOG POST #39
**Task:** "Cum să pregătești salonul pentru Black Friday"  
**Include:** Strategii promoții, calendar.

---

#### Ziua 110 (7 Sept) — CONTENT CONSOLIDATION
**Task:** Creează 3 mega-ghiduri din articole existente  
**Combinează 3-4 articole relate într-un ghid complet.

---

#### Ziua 111 (8 Sept) — WEEKLY CHECK

---

### Săptămâna 16 (Zilele 112-120) — FINAL SPRINT

#### Ziua 112 (9 Sept) — BLOG POST #40
**Task:** "Previziuni 2026: ce se schimbă în industria beauty"  
**Cuvinte:** 1000-1200

---

#### Ziua 113 (10 Sept) — VIDEO #10
**Task:** "Mesaj de mulțumire + giveaway pentru comunitate"  
**Engagement boost, share-uri.

---

#### Ziua 114 (11 Sept) — FINAL LINK BUILDING PUSH
**Task:** Outreach pentru încă 5 guest posts  
**Target:** Final count >=15 guest posts.

---

#### Ziua 115 (12 Sept) — TECHNICAL FINAL CHECK
**Task:** Audit complet tehnic  
**Verifică:**
- Toate paginile indexate în GSC
- Core Web Vitals verzi
- Zero broken links
- Schema markup valid

---

#### Ziua 116 (13 Sept) — CONTENT REFRESH FINAL
**Task:** Actualizează toate articolele lunii 1 și 2  
**Re-date, adaugă informații noi.

---

#### Ziua 117 (14 Sept) — SITEMAP FINAL SUBMIT
**Task:** Regenerează și retrimite sitemap cu TOATE paginile  
**Target:** >200 URL-uri în sitemap.

---

#### Ziua 118 (15 Sept) — COMPETITOR ANALYSIS FINAL
**Task:** Compară poziția vs. MERO și Fresha  
**Documentează keyword rankings.

---

#### Ziua 119 (16 Sept) — FINAL REPORT PREP
**Task:** Compilează toate datele pentru raport final  
**Măsoară creșterea față de Ziua 0.

---

#### Ziua 120 (17-18 Sept) — END OF 120 DAYS REPORT
**Task:** Generează raport final complet  
**Include:**
- Trafic organic: 1,000+ vizite/lună (target)
- Pagini indexate: 200+
- Articole blog: 40
- Backlink-uri: 15+
- Video-uri: 10
- Guest posts: 15
- Keywords top 10: 50+
- Keywords top 3: 15+

**Celebrate:** 🎉 Ai dominat SEO-ul pentru software programări saloane în România!

---

## 📊 Checkpoint-uri Săptămânale

| Săptămâna | Verifică GSC | Trafic Target | Pagini Indexate |
|-----------|--------------|---------------|-----------------|
| 1 | Ziua 7 | 20-30 | >25 |
| 2 | Ziua 14 | 30-40 | >30 |
| 3 | Ziua 21 | 40-50 | >35 |
| 4 | Ziua 30 | 50-60 | >40 |
| 5 | Ziua 37 | 70-90 | >60 |
| 6 | Ziua 44 | 100-130 | >80 |
| 7 | Ziua 51 | 140-180 | >100 |
| 8 | Ziua 60 | 180-220 | >120 |
| 9 | Ziua 67 | 250-320 | >140 |
| 10 | Ziua 74 | 320-400 | >160 |
| 11 | Ziua 81 | 400-500 | >180 |
| 12 | Ziua 90 | 500-650 | >200 |
| 13 | Ziua 97 | 650-800 | >220 |
| 14 | Ziua 104 | 800-950 | >240 |
| 15 | Ziua 111 | 950-1,100 | >260 |
| 16 | Ziua 120 | **1,000+** | **>300** |

---

## 🎯 Comenzi Cursor pentru Fiecare Zi

**Pentru a executa planul, spune Cursor:**

```
"Execută Ziua [X] din planul SEO OcupaLoc. 
Context: /Users/balascanuanamaria/Proiecte/ocupaloc.ro/docs/SEO_PLAN_120_ZILE.md
Task-ul zilei este: [copiază task-ul din document]"
```

**Cursor va:**
1. Citi task-ul specific
2. Executa acțiunile necesare
3. Raporta progresul
4. Actualiza statusul în document

---

## ✅ Success Criteria Final (Ziua 120)

- [ ] 1,000+ vizite organice/lună
- [ ] 40+ articole blog publicate
- [ ] 15+ backlink-uri de quality
- [ ] 10+ video-uri YouTube
- [ ] Top 3 pentru "software programări salon romania"
- [ ] Top 5 pentru "aplicatie programari frizerie"
- [ ] 200+ pagini indexate în Google
- [ ] 50+ keywords în top 10

**Rezultat:** OcupaLoc = #1 în mintea clienților pentru programări online saloane în România.
