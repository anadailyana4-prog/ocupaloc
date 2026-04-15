/** Normalizare telefon RO pentru comparare și stocare (prefix +40). */
export function normalizeRoPhone(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return "";

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length === 10 && digitsOnly.startsWith("0")) {
    return `+40${digitsOnly.slice(1)}`;
  }

  if (digitsOnly.length === 9 && /^[67]/.test(digitsOnly)) {
    return `+40${digitsOnly}`;
  }

  if (digitsOnly.startsWith("40") && digitsOnly.length >= 11) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length > 0) {
    return `+${digitsOnly}`;
  }

  return trimmed;
}
