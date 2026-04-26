import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description: "Află ce date prelucrează OcupaLoc, în ce scop și cum poți exercita drepturile tale privind confidențialitatea."
};

const sections = [
  {
    title: "1. Cine suntem",
    paragraphs: [
      "OcupaLoc este o platformă software pentru programări online destinată business-urilor care lucrează pe bază de rezervare. În contextul acestei pagini, OcupaLoc acționează ca operator pentru datele colectate direct prin site-ul propriu și ca persoană împuternicită pentru datele procesate în numele business-urilor care folosesc platforma.",
      `Pentru întrebări despre confidențialitate sau solicitări privind datele personale, ne poți contacta la ${CONTACT_EMAIL}.`
    ]
  },
  {
    title: "2. Ce date colectăm",
    paragraphs: ["Tipurile de date depind de modul în care interacționezi cu platforma, însă pot include:"],
    bullets: [
      "date de identificare și contact, cum ar fi nume, email, telefon și denumirea business-ului;",
      "date operaționale despre programări, servicii, intervale orare și statusuri ale rezervărilor;",
      "date tehnice, cum ar fi adresa IP, browserul folosit, paginile accesate și evenimente tehnice necesare pentru securitate și analiză;",
      "date de facturare și abonament, atunci când activezi un plan plătit sau intri în perioada de test."
    ]
  },
  {
    title: "3. De ce folosim datele",
    paragraphs: ["Prelucrăm datele personale numai atunci când avem un scop legitim și clar definit pentru funcționarea serviciului."],
    bullets: [
      "pentru crearea și administrarea contului tău;",
      "pentru afișarea și gestionarea rezervărilor făcute prin linkul public al business-ului;",
      "pentru trimiterea emailurilor operaționale, precum confirmări, remindere sau notificări legate de cont;",
      "pentru facturare, prevenirea fraudelor și respectarea obligațiilor legale;",
      "pentru monitorizare tehnică, mentenanță, prevenirea abuzurilor și îmbunătățirea produsului."
    ]
  },
  {
    title: "4. Temeiul legal",
    paragraphs: ["În funcție de context, prelucrăm datele în baza unuia sau mai multora dintre următoarele temeiuri:"],
    bullets: [
      "executarea contractului sau furnizarea serviciului solicitat;",
      "respectarea obligațiilor legale, fiscale și contabile;",
      "interesul legitim pentru securitate, prevenirea fraudelor și îmbunătățirea serviciului;",
      "consimțământul tău, atunci când este necesar pentru anumite cookies sau comunicări opționale."
    ]
  },
  {
    title: "5. Cui divulgăm datele",
    paragraphs: [
      "Nu vindem date personale. Putem transmite date doar către furnizori care ne ajută să operăm platforma sau când legea ne obligă.",
      "Printre categoriile de furnizori se pot afla servicii de hosting și baze de date, procesatori de plăți, furnizori de email tranzacțional, servicii de monitorizare și analiză, precum și furnizori tehnici implicați în operarea produsului."
    ]
  },
  {
    title: "6. Cât timp păstrăm datele",
    paragraphs: [
      "Păstrăm datele doar atât cât este necesar pentru scopurile descrise mai sus, pentru continuitatea serviciului și pentru respectarea obligațiilor legale.",
      "Datele asociate contului activ sunt păstrate pe durata utilizării serviciului. După închiderea contului, anumite informații pot rămâne arhivate pentru evidențe legale, securitate, apărarea drepturilor noastre sau rezolvarea disputelor."
    ]
  },
  {
    title: "7. Drepturile tale",
    paragraphs: ["În condițiile prevăzute de lege, poți solicita:"],
    bullets: [
      "acces la datele tale;",
      "rectificarea datelor inexacte sau incomplete;",
      "ștergerea datelor, atunci când există un temei aplicabil;",
      "restricționarea prelucrării;",
      "opoziția față de anumite prelucrări;",
      "portabilitatea datelor;",
      "retragerea consimțământului pentru prelucrările bazate pe consimțământ."
    ]
  },
  {
    title: "8. Securitate",
    paragraphs: [
      "Folosim măsuri tehnice și organizatorice rezonabile pentru a proteja datele împotriva accesului neautorizat, distrugerii, modificării sau divulgării accidentale.",
      "Niciun sistem online nu poate garanta securitate absolută, însă tratăm securitatea ca prioritate operațională și limităm accesul la date în funcție de rol și necesitate."
    ]
  },
  {
    title: "9. Modificări",
    paragraphs: [
      "Putem actualiza această politică atunci când apar modificări de produs, legislative sau operaționale. Versiunea publicată pe site este versiunea aplicabilă la momentul consultării.",
      "Dacă schimbările sunt semnificative, vom face eforturi rezonabile să le semnalăm clar în produs sau pe site."
    ]
  }
] as const;

export default function Page() {
  return (
    <LegalPage
      eyebrow="Confidențialitate"
      title="Politica de confidențialitate"
      intro="Pagina aceasta explică ce date prelucrează OcupaLoc, de ce le folosim și ce drepturi ai în legătură cu ele atunci când folosești site-ul sau platforma."
      lastUpdated="26 aprilie 2026"
      sections={sections}
    />
  );
}
