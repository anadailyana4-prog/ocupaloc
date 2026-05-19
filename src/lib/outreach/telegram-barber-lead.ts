import {
  buildDemoUrls,
  createBarberOutreachDemo,
  DEMO_BUSINESS_NAME_REGEX
} from "@/lib/demo/create-demo";
import { buildBarberWhatsAppOutreachMessage } from "@/lib/demo/barber-outreach";

const SIMPLE_PHONE_REGEX = /^\+?[0-9][0-9\s().-]{6,20}$/;

export type TelegramBarberLeadInput = {
  phone: string;
  businessName: string;
};

function validateBarberLead(phone: string, businessName: string): TelegramBarberLeadInput | null {
  const cleanedPhone = phone.trim();
  const cleanedName = businessName.trim();
  if (!cleanedPhone || !cleanedName) return null;
  if (!SIMPLE_PHONE_REGEX.test(cleanedPhone)) return null;
  if (!DEMO_BUSINESS_NAME_REGEX.test(cleanedName)) return null;
  return { phone: cleanedPhone, businessName: cleanedName };
}

export function parseTelegramBarberLead(text: string): TelegramBarberLeadInput | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.includes("|")) {
    const parts = trimmed
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length !== 2) return null;
    return validateBarberLead(parts[0]!, parts[1]!);
  }

  const spaceSeparated = trimmed.match(/^([+0-9][0-9\s().-]*?)\s+([a-zA-ZăâîșțĂÂÎȘȚ].+)$/u);
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
  const created = await createBarberOutreachDemo(lead.businessName);
  if (!created.ok) {
    throw new Error(created.error);
  }

  const siteUrl = getOutreachSiteUrl();
  const { demoUrl, signupUrl } = buildDemoUrls(siteUrl, created.id, lead.businessName);
  const whatsappMessage = buildBarberWhatsAppOutreachMessage({
    businessName: lead.businessName,
    demoUrl,
    signupUrl
  });
  const whatsappLink = buildWhatsAppLink(lead.phone, whatsappMessage);

  return [
    `✅ ${lead.businessName}`,
    "",
    "📎 Demo (servicii orientative barber):",
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
