import { createHmac, timingSafeEqual } from "node:crypto";

type ConfirmationAction = "confirm" | "cancel";
type ManagementAction = "manage";

type ConfirmationPayload = {
  bookingId: string;
  action: ConfirmationAction | ManagementAction;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.BOOKING_CONFIRMATION_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing BOOKING_CONFIRMATION_SECRET. Set it to enable booking confirmations.");
  }
  return secret;
}

function signPayload(payload: ConfirmationPayload): string {
  const base = `${payload.bookingId}.${payload.action}.${payload.exp}`;
  return createHmac("sha256", getSecret()).update(base).digest("hex");
}

export function createBookingConfirmationLink(input: {
  bookingId: string;
  action: ConfirmationAction;
  baseUrl?: string;
  expiresInSeconds?: number;
}): string {
  const baseUrl = (input.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
  const exp = Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 60 * 60 * 24 * 14);
  const sig = signPayload({ bookingId: input.bookingId, action: input.action, exp });
  const params = new URLSearchParams({
    booking: input.bookingId,
    action: input.action,
    exp: String(exp),
    sig
  });
  return `${baseUrl}/api/programare/confirmare?${params.toString()}`;
}

export function createBookingManagementLink(input: {
  bookingId: string;
  baseUrl?: string;
  expiresInSeconds?: number;
}): string {
  const baseUrl = (input.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
  const exp = Math.floor(Date.now() / 1000) + (input.expiresInSeconds ?? 60 * 60 * 24 * 14);
  const sig = signPayload({ bookingId: input.bookingId, action: "manage", exp });
  const params = new URLSearchParams({
    booking: input.bookingId,
    exp: String(exp),
    sig
  });
  return `${baseUrl}/programare/gestioneaza?${params.toString()}`;
}

export function verifyBookingConfirmationLink(input: {
  bookingId: string;
  action: string;
  exp: string;
  sig: string;
}): { ok: true; action: ConfirmationAction } | { ok: false; message: string } {
  const action = input.action === "confirm" || input.action === "cancel" ? input.action : null;
  if (!action) {
    return { ok: false, message: "Acțiune invalidă." };
  }

  const expNum = Number(input.exp);
  if (!Number.isFinite(expNum) || expNum <= 0) {
    return { ok: false, message: "Token invalid." };
  }

  if (Math.floor(Date.now() / 1000) > expNum) {
    return { ok: false, message: "Link expirat." };
  }

  const expected = signPayload({ bookingId: input.bookingId, action, exp: expNum });
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(input.sig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, message: "Semnătură invalidă." };
    }
  } catch {
    return { ok: false, message: "Semnătură invalidă." };
  }

  return { ok: true, action };
}

export function verifyBookingManagementLink(input: {
  bookingId: string;
  exp: string;
  sig: string;
}): { ok: true } | { ok: false; message: string } {
  const expNum = Number(input.exp);
  if (!Number.isFinite(expNum) || expNum <= 0) {
    return { ok: false, message: "Token invalid." };
  }

  if (Math.floor(Date.now() / 1000) > expNum) {
    return { ok: false, message: "Link expirat." };
  }

  const expected = signPayload({ bookingId: input.bookingId, action: "manage", exp: expNum });
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(input.sig, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, message: "Semnătură invalidă." };
    }
  } catch {
    return { ok: false, message: "Semnătură invalidă." };
  }

  return { ok: true };
}
