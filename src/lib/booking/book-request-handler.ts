import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

import { insertProgramareForProfSlug } from "@/lib/booking/insert-programare";
import { normalizeBookingSlug } from "@/lib/booking/normalize-booking-slug";
import { notifyClientBookingConfirmation, notifyProfesionistDespreProgramare } from "@/lib/email/programare-notify";
import { reportError } from "@/lib/observability";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

const TZ = "Europe/Bucharest";

const bodySchema = z.object({
  orgSlug: z.string().min(1).max(64),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().optional(),
  startTime: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "startTime invalid."),
  clientName: z.string().min(2, "Numele e prea scurt."),
  clientPhone: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.replace(/\D/g, "").length >= 10, "Introdu un număr de telefon valid."),
  clientEmail: z.string().trim().email("Email invalid.")
});

type BookRequestPayload = z.infer<typeof bodySchema>;

export type BookRouteDeps = {
  createAdmin: typeof createSupabaseServiceClient;
  checkRateLimit: typeof checkApiRateLimit;
  insertBooking: typeof insertProgramareForProfSlug;
  notifyProfesionist: (programareId: string) => Promise<unknown>;
  notifyClient: (programareId: string) => Promise<unknown>;
};

const defaultDeps: BookRouteDeps = {
  createAdmin: createSupabaseServiceClient,
  checkRateLimit: checkApiRateLimit,
  insertBooking: insertProgramareForProfSlug,
  notifyProfesionist: notifyProfesionistDespreProgramare,
  notifyClient: notifyClientBookingConfirmation
};

export async function handleBookRequest(
  payload: unknown,
  ip: string,
  depsOrRequestId?: BookRouteDeps | string,
  maybeDeps?: BookRouteDeps
): Promise<{ status: number; body: { success: boolean; error: string | Record<string, string[] | undefined> | null } }> {
  const requestId = typeof depsOrRequestId === "string" ? depsOrRequestId : undefined;
  const deps: BookRouteDeps =
    typeof depsOrRequestId === "string"
      ? maybeDeps ?? defaultDeps
      : depsOrRequestId ?? defaultDeps;
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        success: false,
        error: parsed.error.flatten().fieldErrors
      }
    };
  }

  const requestData: BookRequestPayload = parsed.data;
  const normalizedSlug = normalizeBookingSlug(requestData.orgSlug);

  const admin = deps.createAdmin();
  const rateLimit = await deps.checkRateLimit(admin, `api:book:${normalizedSlug}:${ip}`, 20, 300_000);
  if (!rateLimit.allowed) {
    return {
      status: 429,
      body: {
        success: false,
        error: "Prea multe încercări. Reîncearcă în câteva minute."
      }
    };
  }

  const start = new Date(requestData.startTime);
  if (Number.isNaN(start.getTime())) {
    return {
      status: 400,
      body: {
        success: false,
        error: "startTime invalid."
      }
    };
  }

  const dateStr = formatInTimeZone(start, TZ, "yyyy-MM-dd");

  try {
    const res = await deps.insertBooking(admin, {
      slug: normalizedSlug,
      serviciuId: requestData.serviceId,
      dateStr,
      slotIso: start.toISOString(),
      numeClient: requestData.clientName.trim(),
      telefonClient: requestData.clientPhone.trim(),
      emailClient: requestData.clientEmail.trim()
    });

    if (!res.ok) {
      const isBlock = res.message.includes("Ne pare rău");
      return {
        status: isBlock ? 403 : res.message.includes("disponibil") ? 409 : 400,
        body: {
          success: false,
          error: res.message
        }
      };
    }

    const [notifyProfResult, notifyClientResult] = await Promise.allSettled([
      deps.notifyProfesionist(res.programareId),
      deps.notifyClient(res.programareId)
    ]);
    if (notifyProfResult.status === "rejected") {
      reportError("booking", "notify_profesionist_failed", notifyProfResult.reason, { slug: normalizedSlug, requestId });
    }
    if (notifyClientResult.status === "rejected") {
      reportError("email", "notify_client_failed", notifyClientResult.reason, { slug: normalizedSlug, requestId });
    }

    return {
      status: 200,
      body: {
        success: true,
        error: null
      }
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Eroare server.";
    reportError("booking", "booking_api_failed", e, { slug: normalizedSlug, requestId });
    return {
      status: 500,
      body: {
        success: false,
        error: message
      }
    };
  }
}
