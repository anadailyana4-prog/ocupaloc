import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BlockedClientError,
  BookingError,
  NoSubscriptionError,
  SlotConflictError
} from "@/lib/domain/booking/errors";
import { logError, logWarn, logInfo } from "@/lib/logger";
import { normalizeRoPhone } from "@/lib/phone";

export type InsertProgramareInput = {
  slug: string;
  serviciuId: string;
  dateStr: string;
  slotIso: string;
  numeClient: string;
  telefonClient: string;
  emailClient?: string | null;
  observatiiClient?: string | null;
  idempotencyKey?: string;
  requestId?: string;
};

export type InsertProgramareResult =
  | { ok: true; programareId: string }
  | { ok: false; message: string };

export async function createBookingAtomic(
  admin: SupabaseClient,
  profesionistId: string,
  serviciuId: string,
  dataStart: Date,
  dataFinal: Date,
  telefonClient: string,
  numeClient: string,
  emailClient?: string
): Promise<{ ok: true; programareId: string } | { ok: false; error: BookingError }> {
  const normalizedPhone = normalizeRoPhone(telefonClient);

  try {
    const { data, error } = await admin.rpc("book_appointment_atomic", {
      p_profesionist_id: profesionistId,
      p_serviciu_id: serviciuId,
      p_data_start: dataStart.toISOString(),
      p_data_final: dataFinal.toISOString(),
      p_telefon_client: normalizedPhone,
      p_nume_client: numeClient,
      p_email_client: emailClient
    }) as {
      data?: { programare_id: string } | Array<{ programare_id: string }> | null;
      error?: { message?: string } | null;
    };

    if (error) {
      if (error.message?.includes("CONFLICT")) {
        return { ok: false, error: new SlotConflictError() };
      }
      if (error.message?.includes("BLOCKED")) {
        return { ok: false, error: new BlockedClientError() };
      }
      if (error.message?.includes("NOSUBSCRIPTION")) {
        return { ok: false, error: new NoSubscriptionError() };
      }
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.programare_id) {
      throw new Error("book_appointment_atomic returned no programare_id");
    }

    return { ok: true, programareId: row.programare_id };
  } catch (err) {
    logError("book_appointment_atomic failed", err, { profesionistId });
    return { ok: false, error: new BookingError("System error") };
  }
}

/**
 * Call atomic booking RPC (PR 2).
 * All checks (entitlement, client block, slot availability, smart rules) happen atomically in DB.
 * No race condition risk — uses SERIALIZABLE transaction with FOR UPDATE locks.
 */
export async function insertProgramareForProfSlug(
  admin: SupabaseClient,
  input: InsertProgramareInput
): Promise<InsertProgramareResult> {
  const phone = normalizeRoPhone(input.telefonClient);
  const name = input.numeClient.trim();
  const email = input.emailClient?.trim() ?? "";

  try {
    // Call atomic booking RPC (PR 2)
    const { data, error: rpcError } = await admin.rpc("book_appointment_atomic", {
      p_prof_slug: input.slug,
      p_service_id: input.serviciuId,
      p_slot_start: input.slotIso,
      p_client_phone: phone,
      p_client_name: name,
      p_client_email: email
    }) as unknown as {
      data?: Array<{
        success: boolean;
        programare_id: string;
        error_code: string | null;
        error_message: string | null;
      }>;
      error?: { code?: string; message?: string };
    };

    if (rpcError) {
      logError(
        "[booking] atomic RPC failed",
        rpcError,
        { slug: input.slug, errorCode: rpcError.code }
      );
      return { ok: false, message: "Nu am putut crea programarea. Te rugăm reîncearcă." };
    }

    if (!data || !data[0]) {
      logError(
        "[booking] atomic RPC returned no data",
        undefined,
        { slug: input.slug }
      );
      return { ok: false, message: "Nu am putut crea programarea. Te rugăm reîncearcă." };
    }

    const result = data[0];

    if (result.success) {
      const notes = input.observatiiClient?.trim();
      if (notes) {
        const { error: notesError } = await admin
          .from("programari")
          .update({ observatii: notes })
          .eq("id", result.programare_id);

        if (notesError) {
          logWarn("[booking] could not save client notes", { programareId: result.programare_id, slug: input.slug });
        }
      }

      logInfo(
        "[booking] appointment created successfully via atomic RPC",
        { slug: input.slug, programareId: result.programare_id, requestId: input.requestId }
      );
      return { ok: true, programareId: result.programare_id };
    }

    // Map error_code to user message
    const userMessage = mapAtomicBookingErrorCode(result.error_code);
    logWarn(
      `[booking] atomic RPC returned error: ${result.error_code}`,
      { slug: input.slug, errorCode: result.error_code }
    );

    return { ok: false, message: userMessage };
  } catch (err) {
    logError(
      "[booking] atomic booking unexpected error",
      err,
      { slug: input.slug }
    );
    return { ok: false, message: "Nu am putut crea programarea. Te rugăm reîncearcă." };
  }
}

/**
 * Map RPC error_code to user-facing message.
 */
function mapAtomicBookingErrorCode(errorCode: string | null): string {
  switch (errorCode) {
    case "PROFESIONIST_NOT_FOUND":
      return "Pagina nu există.";
    case "SERVICE_NOT_FOUND":
      return "Serviciu invalid.";
    case "SLOT_CONFLICT":
      return "Slotul nu mai e disponibil. Alege altă oră.";
    case "CLIENT_BLOCKED":
      return "Ne pare rău, sună direct pentru programare.";
    case "NO_SUBSCRIPTION":
      return "Abonament inactiv. Contactează furnizor.";
    case "SLOT_IN_PAST":
      return "Slot expirat — alege o oră viitoare.";
    case "MIN_NOTICE_VIOLATION":
      return "Rezervările se fac cu o anumită preaviz. Contactează direct.";
    case "MAX_FUTURE_VIOLATION":
      return "Ai atins limita de programări active pentru această locație.";
    case "CANCEL_THRESHOLD_VIOLATION":
      return "Momentan nu poți rezerva online. Te rugăm să contactezi direct business-ul.";
    default:
      return "Nu am putut crea programarea. Te rugăm reîncearcă.";
  }
}
