const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const BLOCKED_EXACT_ADDRESSES = new Set([
  "#",
  "asistenta@mero.ro",
  "contact@exemplu.ro",
  "info@yourgmail.com"
]);

const BLOCKED_DOMAINS = ["sentry.io", "yourgmail.com"];
const BLOCKED_DOMAIN_SUFFIXES = [".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".ico", ".avif"];
const BLOCKED_LOCAL_PARTS = ["noreply", "no-reply", "donotreply", "do-not-reply", "mailer-daemon"];

export function normalizeEmailCandidate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed || BLOCKED_EXACT_ADDRESSES.has(trimmed)) {
    return null;
  }

  const withoutMailto = trimmed.startsWith("mailto:") ? trimmed.slice(7) : trimmed;
  const sanitized = withoutMailto.replace(/[)>.,;]+$/g, "").trim();

  if (!EMAIL_PATTERN.test(sanitized)) {
    return null;
  }

  const [localPart, domain] = sanitized.split("@");
  if (!localPart || !domain) {
    return null;
  }

  if (BLOCKED_LOCAL_PARTS.includes(localPart)) {
    return null;
  }

  if (BLOCKED_DOMAINS.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`))) {
    return null;
  }

  if (BLOCKED_DOMAIN_SUFFIXES.some((suffix) => domain.endsWith(suffix))) {
    return null;
  }

  return sanitized;
}

export function extractFirstValidEmail(source: string): string | null {
  const mailtoMatches = source.match(/mailto:([^\"'\s>]+)/gi) ?? [];
  for (const match of mailtoMatches) {
    const normalized = normalizeEmailCandidate(match);
    if (normalized) {
      return normalized;
    }
  }

  const matches = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  for (const match of matches) {
    const normalized = normalizeEmailCandidate(match);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}