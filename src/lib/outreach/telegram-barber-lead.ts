import {
  buildDemoUrls,
  createBarberOutreachDemo,
  sanitizeDemoBusinessName
} from "@/lib/demo/create-demo";
import { buildBarberWhatsAppOutreachMessage } from "@/lib/demo/barber-outreach";

export type TelegramBarberLeadInput = {
  phone: string;
  businessName: string;
};

function countPhoneDigits(phone: string) {
  return phone.replace(/\D/g, "").length;
}

function validateBarberLead(phone: string, businessName: string): TelegramBarberLeadInput | null {
  const cleanedPhone = phone.trim();
  const cleanedName = businessName.trim();
  if (!cleanedPhone || !cleanedName) return null;

  const digits = countPhoneDigits(cleanedPhone);
  if (digits < 8 || digits > 15) return null;
  if (cleanedName.length < 2) return null;

  return { phone: cleanedPhone, businessName: cleanedName };
}

/** Mesaj cu cifre + text (nu doar telefon) — tratăm ca lead, nu ignorăm. */
export function looksLikeBarberLeadAttempt(text: string): boolean {
  const trimmed = text.trim().replace(/[\n\r\t]+/g, " ");
  if (trimmed.length < 10) return false;

  const digits = countPhoneDigits(trimmed);
  if (digits < 8) return false;

  if (/^\+?[0-9\s().-]+$/.test(trimmed)) return false;

  return trimmed.includes("|") || /\s/.test(trimmed);
}

export function parseTelegramBarberLead(text: string): TelegramBarberLeadInput | null {
  const trimmed = text.trim().replace(/[\n\r\t]+/g, " ");
  if (!trimmed) return null;

  if (trimmed.includes("|")) {
    const parts = trimmed
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length < 2) return null;
    const phone = parts[0]!;
    const businessName = parts.slice(1).join(" ").trim();
    return validateBarberLead(phone, businessName);
  }

  const spaceSeparated = trimmed.match(/^([+\d][\d\s().-]+)\s+(.+)$/u);
  if (spaceSeparated) {
    return validateBarberLead(spaceSeparated[1]!, spaceSeparated[2]!);
  }

  return null;
}

export { buildBarberWhatsAppOutreachMessage };

function normalizeWhatsappPhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `40${digits.slice(1)}`;
  }

  if (digits.length < 8 || digits.length > 15) {
    throw new Error("Număr de telefon invalid.");
  }

  return digits;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const normalized = normalizeWhatsappPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedText}`;
}

export function getOutreachSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://ocupaloc.ro").replace(/\/$/, "");
}

export async function handleTelegramBarberLead(lead: TelegramBarberLeadInput) {
  const displayName = sanitizeDemoBusinessName(lead.businessName);
  const created = await createBarberOutreachDemo(displayName);
  if (!created.ok) {
    throw new Error(created.error);
  }

  const siteUrl = getOutreachSiteUrl();
  const { demoUrl, signupUrl } = buildDemoUrls(siteUrl, created.id, displayName);
  const whatsappMessage = buildBarberWhatsAppOutreachMessage({
    businessName: displayName,
    demoUrl,
    signupUrl
  });
  const whatsappLink = buildWhatsAppLink(lead.phone, whatsappMessage);

  return [
    `✅ ${displayName}`,
    "",
    "📎 Demo:",
    demoUrl,
    "",
    "👤 Creează profil:",
    signupUrl,
    "",
    "💬 Mesaj WhatsApp:",
    "---",
    whatsappMessage,
    "---",
    "",
    "📲 Deschide WhatsApp:",
    whatsappLink
  ].join("\n");
}
