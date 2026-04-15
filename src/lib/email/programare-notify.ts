import { formatInTimeZone } from "date-fns-tz";

import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const TZ = "Europe/Bucharest";

export type ProgramareNotifyInput = {
  /** profesionisti.email_contact */
  to: string | null | undefined;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  appointmentStart: Date;
};

/**
 * Notificare salon după programare nouă (Resend).
 * Fără RESEND_API_KEY emailul nu se trimite.
 */
export async function notifyProfesionistNewProgramare(input: ProgramareNotifyInput): Promise<void> {
  const dataStr = formatInTimeZone(input.appointmentStart, TZ, "dd.MM.yyyy");
  const timeStr = formatInTimeZone(input.appointmentStart, TZ, "HH:mm");
  const subject = `Rezervare nouă - ${input.clientName}`;
  const text = `${input.clientName} (${input.clientPhone}) a rezervat ${input.serviceName} pe ${dataStr} la ${timeStr}`;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("RESEND_API_KEY lipsă - emailul nu a fost trimis");
    return;
  }

  const dest = input.to?.trim();
  if (!dest) {
    return;
  }

  const from = process.env.RESEND_FROM;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [dest],
        subject,
        text
      })
    });
    if (!res.ok) {
      const b = await res.text().catch(() => "");
      console.error("[notifyProfesionistNewProgramare] Resend", res.status, b);
    }
  } catch (e) {
    console.error("[notifyProfesionistNewProgramare]", e);
  }
}

type ProgramareNotifyContext = {
  profesionistEmail: string | null;
};

export async function notifyProfesionistDespreProgramare(programareId: string): Promise<ProgramareNotifyContext> {
  const admin = createSupabaseServiceClient();
  const { data: row, error } = await admin
    .from("programari")
    .select("nume_client, telefon_client, data_start, profesionisti(email_contact), servicii(nume)")
    .eq("id", programareId)
    .maybeSingle();

  if (error || !row) {
    console.error("[notifyProfesionistDespreProgramare] programare lipsa:", error?.message ?? "not found");
    return { profesionistEmail: null };
  }

  const relProf = row.profesionisti as { email_contact: string | null } | { email_contact: string | null }[] | null;
  const relServ = row.servicii as { nume: string } | { nume: string }[] | null;
  const profesionist = Array.isArray(relProf) ? relProf[0] ?? null : relProf;
  const serviciu = Array.isArray(relServ) ? relServ[0] ?? null : relServ;

  await notifyProfesionistNewProgramare({
    to: profesionist?.email_contact ?? null,
    clientName: row.nume_client,
    clientPhone: row.telefon_client,
    serviceName: serviciu?.nume ?? "Serviciu",
    appointmentStart: new Date(row.data_start)
  });

  return { profesionistEmail: profesionist?.email_contact ?? null };
}
