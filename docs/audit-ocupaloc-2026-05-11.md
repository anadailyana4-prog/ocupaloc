# Audit Complet OcupaLoc - 2026-05-11

Acest audit acopera produsul curent (frontend + backend), evaluat pe checklistul complet A-N.

Legenda status:
- EXISTA
- EXISTA PARTIAL
- LIPSESTE
- NU ESTE PRIORITAR ACUM

Legenda prioritati:
- P1 = impact imediat pe valoare/no-show/claritate
- P2 = important dupa stabilizarea P1
- P3 = strategic/later

## A. Booking Flow Client

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| alegere serviciu | EXISTA | P1 | mica | mare | mentinut | src/components/booking/BookingCard.tsx |
| alegere data | EXISTA | P1 | mica | mare | mentinut | src/components/booking/BookingCard.tsx |
| alegere ora disponibila | EXISTA | P1 | medie | mare | mentinut | src/components/booking/BookingCard.tsx, src/lib/slots.ts |
| confirmare rezervare | EXISTA | P1 | mica | mare | mentinut | src/lib/booking/book-request-handler.ts |
| confirmare din email | EXISTA | P1 | medie | mare | mentinut | src/lib/booking/confirmation-link.ts |
| anulare prin link securizat | EXISTA | P1 | medie | mare | mentinut | src/lib/booking/confirmation-link.ts |
| reprogramare prin link securizat | LIPSESTE | P2 | mare | mare | endpoint + token flow pentru reschedule | src/lib/booking/confirmation-link.ts |
| mesaj de succes dupa rezervare | EXISTA | P1 | mica | mare | extins (calendar links) | src/components/booking/BookingCard.tsx |
| rezumat rezervare inainte de trimitere | EXISTA PARTIAL | P1 | mica | mare | standardizat in modal (facut) | src/components/booking/BookingCard.tsx |
| progress indicator pe pasi | EXISTA PARTIAL | P1 | mica | mare | progress clar in booking card (facut) | src/components/booking/BookingCard.tsx |
| buton adauga in calendar | EXISTA PARTIAL | P1 | mica | mediu | Google + ICS (facut) | src/components/booking/BookingCard.tsx |
| camp observatii client | EXISTA PARTIAL | P1 | medie | mare | UI + backend persistenta (facut) | src/components/booking/BookingCard.tsx, src/lib/booking/book-request-handler.ts, src/actions/public-booking.ts, src/lib/booking/insert-programare.ts |
| alegere locatie | EXISTA PARTIAL | P2 | medie | mediu | model multi-locatie + selector | src/app/[slug]/page.tsx |
| alegere tip intalnire fizic/online | LIPSESTE | P2 | medie | mediu | camp tip intalnire + afisare + validari | - |

## B. Calendar si Disponibilitate

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| calendar admin clar | EXISTA PARTIAL | P2 | medie | mediu | calendar vizual pe zi/saptamana | src/app/(dashboard)/dashboard/page.tsx |
| blocare sloturi in timp real | EXISTA | P1 | medie | mare | mentinut | src/lib/booking/insert-programare.ts, supabase/migrations/023_atomic_booking.sql |
| program de lucru configurabil | EXISTA | P1 | medie | mare | mentinut | src/lib/program.ts, src/app/(dashboard)/dashboard/setari/page.tsx |
| buffer intre programari | EXISTA | P1 | mica | mare | mentinut | src/lib/slots.ts |
| zile libere si exceptii | EXISTA PARTIAL | P2 | medie | mediu | exceptii calendar per data | src/lib/program.ts |
| program diferit pe servicii | LIPSESTE | P3 | mare | mediu | reguli per serviciu | - |
| program diferit pe angajati | LIPSESTE | P3 | mare | mediu | model staff + availability | - |
| blocare manuala intervale | LIPSESTE | P2 | medie | mare | tabela blocked_intervals + UI | - |
| capacitate per slot | LIPSESTE | P3 | mare | mediu | camp capacity + logic insert atomic | - |
| timezone handling | EXISTA | P1 | mica | mare | mentinut | date-fns-tz in dashboard/booking |

## C. Administrare Programari

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| lista programari | EXISTA | P1 | mica | mare | mentinut | src/app/(dashboard)/dashboard/programari-table.tsx |
| filtrare dupa status | EXISTA PARTIAL | P1 | mica | mare | UI filtre adaugata (facut) | src/app/(dashboard)/dashboard/page.tsx |
| filtrare dupa serviciu | EXISTA PARTIAL | P1 | mica | mare | UI filtre adaugata (facut) | src/app/(dashboard)/dashboard/page.tsx |
| filtrare dupa angajat | LIPSESTE | P3 | mare | mediu | necesita model staff | - |
| filtrare dupa locatie | LIPSESTE | P3 | mare | mediu | necesita model locatii | - |
| cautare | EXISTA PARTIAL | P1 | mica | mare | search dupa client/tel/serviciu/notite (facut) | src/app/(dashboard)/dashboard/page.tsx |
| statusuri clare | EXISTA | P1 | mica | mare | mentinut | src/app/(dashboard)/dashboard/programari-table.tsx |
| notite interne | EXISTA PARTIAL | P1 | mica | mare | editare notite adaugata (facut) | src/app/(dashboard)/dashboard/programari-table.tsx, src/app/(dashboard)/dashboard/actions.ts |
| istoric modificari | EXISTA PARTIAL | P1 | medie | mare | expunere timeline status events in UI | src/lib/booking/status-events.ts, programari_status_events |
| export CSV/Excel | EXISTA PARTIAL | P1 | mica | mare | CSV exista; Excel optional | src/app/api/dashboard/export-programari/route.ts |
| print lista | LIPSESTE | P3 | mica | mic | view print-friendly | - |

## D. Comunicari Automate

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| confirmare automata rezervare | EXISTA | P1 | mica | mare | mentinut | src/lib/email/programare-notify.ts |
| reminder 24h inainte | EXISTA | P1 | mica | mare | mentinut | src/app/api/jobs/send-reminders/route.ts |
| reminder in ziua programarii | EXISTA PARTIAL | P1 | mica | mare | exista 2h; optional si dimineata | src/app/api/jobs/send-reminders/route.ts |
| mesaj anulare | EXISTA | P1 | mica | mare | mentinut | src/lib/email/programare-notify.ts |
| mesaj reprogramare | LIPSESTE | P2 | medie | mediu | template + trigger reprogramare | - |
| follow-up dupa programare | EXISTA PARTIAL | P2 | medie | mediu | exista post-completion, lipseste review CTA | src/lib/email/programare-notify.ts |
| template-uri editabile | EXISTA PARTIAL | P2 | medie | mediu | UI editor template simplu | src/lib/email/programare-notify.ts |
| branding in email/SMS | EXISTA PARTIAL | P2 | medie | mediu | branding email mai avansat + SMS lipsa | src/lib/email/*.ts |
| CTA clar in mesaje | EXISTA PARTIAL | P1 | mica | mare | imbunatatire copy + CTA-uri unificate | src/lib/email/programare-notify.ts |

## E. Date Client

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| profil client | EXISTA PARTIAL | P2 | medie | mediu | pagina dedicata clienti | programari/clienti tables |
| istoric rezervari client | EXISTA PARTIAL | P2 | medie | mediu | UI drilldown pe client | src/app/(dashboard)/dashboard/page.tsx |
| import clienti | EXISTA | P2 | medie | mediu | mentinut | src/lib/csv-import.ts |
| notite client | LIPSESTE | P2 | medie | mediu | tabela client_notes / camp in clienti | - |
| tag-uri/segmente | LIPSESTE | P3 | medie | mic | tag model + filtre | - |
| campuri custom | LIPSESTE | P3 | mare | mic | schema custom fields | - |
| intake form | LIPSESTE | P2 | medie | mediu | formular extensibil per business | - |
| export date | EXISTA PARTIAL | P2 | medie | mediu | extindere export full clienti | export-programari route |
| stergere date | EXISTA PARTIAL | P2 | medie | mare | workflow stergere client | - |
| GDPR requests | EXISTA PARTIAL | P2 | medie | mare | endpoint DSAR (export/delete) | pages legal existente |

## F. Servicii si Resurse

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| durata serviciu | EXISTA | P1 | mica | mare | mentinut | servicii table |
| pret serviciu | EXISTA | P1 | mica | mare | mentinut | servicii table |
| descriere serviciu | EXISTA | P2 | mica | mediu | mentinut | servicii table |
| categorii servicii | LIPSESTE | P3 | medie | mic | categorie simpla optionala | - |
| add-on-uri | LIPSESTE | P3 | medie | mic | relation add-ons | - |
| resurse necesare | LIPSESTE | P3 | mare | mic | model resources | - |
| timp pregatire/curatare | EXISTA | P1 | mica | mare | mentinut | profesionisti.timp_pregatire |

## G. Angajati si Roluri

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| mai multi angajati | LIPSESTE | P3 | mare | mediu | model staff + memberships extins | - |
| program pe angajat | LIPSESTE | P3 | mare | mediu | staff availability | - |
| servicii pe angajat | LIPSESTE | P3 | mare | mediu | join staff_services | - |
| roluri si permisiuni | EXISTA PARTIAL | P2 | medie | mediu | RBAC simplu owner/manager/staff | memberships |
| manager locatie | LIPSESTE | P3 | mare | mic | dupa multi-locatie | - |
| acces limitat | EXISTA PARTIAL | P2 | medie | mediu | permisiuni granular dashboard | RLS + app auth |

## H. Locatii

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| mai multe locatii | LIPSESTE | P2 | mare | mediu | locations table + selectie | - |
| pagini separate pe locatie | LIPSESTE | P2 | mare | mediu | slug per locatie | - |
| program separat pe locatie | LIPSESTE | P2 | mare | mediu | availability per location | - |
| adresa si harta | EXISTA PARTIAL | P2 | mica | mediu | embed map optional | profesionisti.adresa_publica |
| staff diferit pe locatie | LIPSESTE | P3 | mare | mic | dupa model staff+locations | - |

## I. Monetizare

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| trial | EXISTA | P1 | mica | mare | mentinut | src/lib/billing/config.ts |
| abonament lunar | EXISTA | P1 | mica | mare | mentinut | billing routes + stripe |
| pret per locatie | LIPSESTE | P2 | medie | mediu | dupa multi-locatie | - |
| TVA inclus | EXISTA | P1 | mica | mediu | mentinut in UX/copy | landing + billing copy |
| zero comision | EXISTA | P1 | mica | mare | mentinut in UX/copy | landing copy |
| istoric abonament | EXISTA PARTIAL | P2 | medie | mediu | UI istoric status | subscriptions table |
| facturi | EXISTA PARTIAL | P2 | medie | mediu | linkuri Stripe invoices in UI | billing views |
| upgrade/downgrade | EXISTA PARTIAL | P2 | medie | mediu | plan switch simplu | stripe billing |
| plati online la rezervare | LIPSESTE | P2 | mare | mare | Stripe payment intent in flow | - |
| avans/depozit | LIPSESTE | P2 | mare | mediu | depune avans + policy | - |
| politici de anulare | EXISTA PARTIAL | P2 | medie | mediu | policy configurabila per business | smart rules + email copy |

## J. UX si Conversie

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| flow clar pe mobil | EXISTA | P1 | mica | mare | mentinut | booking card + responsive layouts |
| loading states bune | EXISTA PARTIAL | P2 | mica | mediu | extindere skeletons | BookingCard.tsx |
| erori clare | EXISTA | P1 | mica | mare | mentinut | toast + server validations |
| empty states bune | EXISTA PARTIAL | P2 | mica | mediu | copy + CTA mai clar | dashboard table |
| CTA-uri bune | EXISTA PARTIAL | P1 | mica | mare | continuare optimizare copy | landing + booking |
| microcopy bun | EXISTA PARTIAL | P1 | mica | mare | clarificat in booking flow (facut partial) | BookingCard.tsx |
| viteza | EXISTA PARTIAL | P1 | medie | mare | optimizare bundle/queries | next/vercel build |
| accesibilitate | EXISTA PARTIAL | P2 | medie | mediu | audit a11y + aria | multiple |
| contrast bun | EXISTA PARTIAL | P1 | mica | mare | verificare contrast complet | theme classes |
| mobile-first | EXISTA | P1 | mica | mare | mentinut | tailwind responsive |

## K. Raportare

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| nr programari | EXISTA | P1 | mica | mare | mentinut | dashboard metrics |
| nr anulari | EXISTA | P1 | mica | mare | mentinut | dashboard metrics |
| nr reprogramari | LIPSESTE | P2 | medie | mediu | status + events pentru reprogramat | - |
| servicii populare | EXISTA PARTIAL | P2 | medie | mediu | top servicii in dashboard | query agregata |
| ore populare | LIPSESTE | P2 | medie | mediu | histogram pe intervale | - |
| clienti noi vs recurenti | EXISTA PARTIAL | P2 | medie | mediu | card dedicat | dashboard logic partial |
| no-show rate | EXISTA PARTIAL | P1 | mica | mare | card explicit no-show rate | noaparit counters |
| export rapoarte | EXISTA PARTIAL | P2 | medie | mediu | rapoarte agregate CSV | export route |

## L. Marketing si Retentie

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| reminder de reprogramare | LIPSESTE | P2 | medie | mediu | trigger dupa anulare | - |
| follow-up automat | EXISTA PARTIAL | P2 | medie | mediu | follow-up cu CTA review | email notify |
| cerere review | LIPSESTE | P2 | mica | mediu | email post-completion cu link review | - |
| link review Google | LIPSESTE | P2 | mica | mediu | camp setari + insert in template | - |
| campanii clienti inactivi | EXISTA PARTIAL | P2 | medie | mediu | extindere segmentare | quiet-business-rescue |
| coduri promotionale | LIPSESTE | P3 | medie | mic | promo codes model | - |
| vouchere | LIPSESTE | P3 | medie | mic | vouchers model | - |

## M. Legal si Securitate

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| GDPR | EXISTA | P1 | mica | mare | mentinut | src/app/gdpr/page.tsx |
| contact clar | EXISTA | P1 | mica | mediu | mentinut | landing/footer |
| termeni | EXISTA | P1 | mica | mare | mentinut | src/app/termeni/page.tsx |
| cookies | EXISTA | P1 | mica | mediu | mentinut | src/app/cookies/page.tsx |
| audit trail | EXISTA PARTIAL | P1 | medie | mare | afisare istoric in UI | programari_status_events |
| linkuri securizate | EXISTA | P1 | medie | mare | mentinut | confirmation-link |
| control acces | EXISTA | P1 | medie | mare | mentinut | RLS + auth |
| log actiuni sensibile | EXISTA PARTIAL | P2 | medie | mediu | extindere pentru notes/edits | operational_events |

## N. Integrari

| Functie | Status | Prioritate | Dificultate | Impact | Ce trebuie facut | Unde in cod |
|---|---|---:|---|---|---|---|
| Google Calendar | EXISTA PARTIAL | P1 | mica | mare | adaugat Google calendar link (facut) | BookingCard.tsx |
| Outlook Calendar | EXISTA PARTIAL | P2 | mica | mediu | ICS acopera Outlook (facut partial) | BookingCard.tsx |
| webhook-uri | EXISTA PARTIAL | P2 | medie | mediu | endpoint-uri externe custom | stripe webhook exista |
| API | EXISTA | P1 | medie | mare | mentinut + documentat | src/app/api/** |
| email provider | EXISTA | P1 | mica | mare | mentinut (Resend) | src/lib/email/resend.ts |
| SMS provider | LIPSESTE | P2 | medie | mediu | integrare Twilio/alt provider | - |
| Google Analytics | EXISTA | P2 | mica | mediu | mentinut | src/lib/analytics.ts |
| Meta Pixel | LIPSESTE | P3 | mica | mic | integrare optionala marketing | - |
| Google Business Profile | LIPSESTE | P3 | medie | mic | sync reviews/hours (optional) | - |
| procesator plati | EXISTA | P1 | medie | mare | mentinut (Stripe) | billing + webhooks |

## Backlog Prioritizat

### Quick Wins (livrabile in iteratia curenta)
1. Progress indicator pe flow booking.
2. Rezumat explicit inainte de trimitere.
3. Camp observatii client (UI + backend persistenta).
4. Add to calendar (Google + .ics).
5. Filtre admin mai bune (status, serviciu, cautare).
6. Notite interne in admin (editabile).

### Medium Wins
1. Istoric modificari in UI din programari_status_events.
2. Reminder suplimentar in ziua programarii (ora fixa dimineata).
3. Reprogramare prin link securizat.
4. Cerere review post-completion.
5. Blocare manuala intervale.

### Strategic Wins
1. Multi-locatie.
2. Multi-staff + roluri.
3. Plati la rezervare / avans.
4. Intake form configurabil.
5. Rapoarte avansate.

## Delta implementata in aceasta iteratie

Implementat cap-coada:
1. Booking flow: progress steps + rezumat inainte de submit + microcopy clar.
2. Booking flow: observatii client (optional) propagat in backend si salvat in programari.observatii.
3. Booking success: Google Calendar link + descarcare ICS.
4. Dashboard admin: filtre noi (status, serviciu, cautare text).
5. Dashboard admin: notite interne editabile per programare.

Fișiere modificate principal:
- src/components/booking/BookingCard.tsx
- src/lib/booking/book-request-handler.ts
- src/actions/public-booking.ts
- src/lib/booking/insert-programare.ts
- src/app/(dashboard)/dashboard/page.tsx
- src/app/(dashboard)/dashboard/programari-table.tsx
- src/app/(dashboard)/dashboard/actions.ts
- tests/api-book-handler.test.ts

## Ce ramane P1/P2 imediat dupa aceasta iteratie

1. Istoric modificari vizibil in UI (timeline pe programare).
2. Reprogramare prin link securizat (backend + email + UX).
3. Reminder suplimentar in dimineata programarii.
4. Clarificari microcopy suplimentare pe paginile publice per verticala.
