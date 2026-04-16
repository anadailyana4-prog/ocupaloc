import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { SUPPORT_EMAIL } from "@/config/marketing";

export const metadata: Metadata = {
  title: "Informare GDPR",
  description: "Informări sumare privind prelucrarea datelor conform GDPR pentru utilizatorii Ocupaloc."
};

export default function GdprPage() {
  return (
    <LegalPageShell title="Informare GDPR (rezumat)" updated="16 aprilie 2026">
      <p>
        Acest rezumat nu înlocuiește{" "}
        <Link href="/confidentialitate" className="text-indigo-400 hover:text-indigo-300">
          Politica de confidențialitate
        </Link>
        , dar îți permite o lectură rapidă a elementelor esențiale conform transparenței GDPR.
      </p>

      <h2>Cine prelucrează datele?</h2>
      <p>
        Operatorul platformei Ocupaloc, identificabil prin canalul de contact public (
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
          {SUPPORT_EMAIL}
        </a>
        ).
      </p>

      <h2>De ce?</h2>
      <p>Pentru a-ți crea și administra contul, a rula programările și comunicările legate de serviciu, și pentru securitatea sistemului.</p>

      <h2>Ce drepturi ai?</h2>
      <ul>
        <li>Dreptul de a fi informat (acest document).</li>
        <li>Acces, rectificare, ștergere („dreptul de a fi uitat” — cu excepțiile legale).</li>
        <li>Restricționare și opoziție unde se aplică.</li>
        <li>Portabilitatea datelor, când trecerea tehnică este posibilă.</li>
        <li>Dreptul de a te plânge la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).</li>
      </ul>

      <h2>Cum exersezi drepturile?</h2>
      <p>
        Trimite o cerere la{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
          {SUPPORT_EMAIL}
        </a>{" "}
        cu subiect clar (ex.: „Cerere acces GDPR”). Pentru identificare sigură, vom putea solicita verificarea identității contului.
      </p>
    </LegalPageShell>
  );
}
