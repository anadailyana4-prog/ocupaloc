import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { SUPPORT_EMAIL } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Politica de confidențialitate",
  description: "Cum prelucrăm datele personale în Ocupaloc — scopuri, temeiuri, drepturile tale."
};

export default function ConfidentialitatePage() {
  return (
    <LegalPageShell title="Politica de confidențialitate" updated="16 aprilie 2026">
      <p>
        Respectăm confidențialitatea ta. Această politică descrie ce tipuri de date pot fi prelucrate prin platforma Ocupaloc (ocupaloc.ro), în ce scopuri și ce drepturi ai conform Regulamentului (UE) 2016/679 („GDPR”).
      </p>

      <h2>1. Operatorul de date</h2>
      <p>
        Pentru gestionarea platformei, operatorul care decide scopurile și mijloacele de prelucrare poate fi identificat prin datele publicate în contactul de la subsolul site-ului și prin adresa{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
          {SUPPORT_EMAIL}
        </a>
        . Acest document poate fi completat cu date exacte de identificare (firmă / CUI) când sunt disponibile public.
      </p>

      <h2>2. Ce date pot fi prelucrate</h2>
      <ul>
        <li>
          Date de cont: email, parolă (stocată în formă securizată prin furnizorul de autentificare), eventual nume afișat în aplicație.
        </li>
        <li>Date operaționale introduse de tine: program, servicii, clienți în scopul administrării programărilor.</li>
        <li>
          Date tehnice: jurnale server, adrese IP, informații despre dispozitiv — în măsura necesară securității și funcționării serviciului.
        </li>
      </ul>

      <h2>3. Scopuri și temeiuri</h2>
      <ul>
        <li>
          <strong>Furnizarea serviciului</strong> — executarea contractului cu tine (art. 6 (1) (b) GDPR).
        </li>
        <li>
          <strong>Îmbunătățirea și securitatea platformei</strong> — interes legitim (art. 6 (1) (f) GDPR), cum ar fi prevenirea abuzurilor.
        </li>
        <li>
          <strong>Obligații legale</strong> unde aplicabile — ex. raportări (art. 6 (1) (c) GDPR).
        </li>
        <li>
          <strong>Marketing / comunicări</strong> — doar cu acord separat sau unde legea permite (ex. mesaje despre serviciul utilizat).
        </li>
      </ul>

      <h2>4. Destinatari și transferuri</h2>
      <p>
        Putem folosi furnizori care procesează date în numele nostru (ex. găzduire, baze de date autentificare, email tranzacțional), cu contracte conforme art. 28 GDPR acolo unde este cazul. Unii furnizori pot fi în afara SEE — ne asigurăm de garanții adecvate (clauze contractuale tip etc.).
      </p>

      <h2>5. Durata stocării</h2>
      <p>
        Păstrăm datele cât timp este necesar pentru scopurile de mai sus sau conform obligațiilor legale (ex. facturare). La ștergerea contului, datele pot fi șterse sau anonimizate în termene rezonabile, cu excepția datelor pe care legea ne obligă să le păstrăm.
      </p>

      <h2>6. Drepturile tale</h2>
      <p>Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție, portabilitate (unde aplicabil) și de a depune plângere la ANSPDCP (România). Pentru exercitarea drepturilor, scrie-ne la {SUPPORT_EMAIL}.</p>

      <h2>7. Modificări</h2>
      <p>Putem actualiza această politică. Verifică periodic această pagină sau comunicările din aplicație.</p>
    </LegalPageShell>
  );
}
