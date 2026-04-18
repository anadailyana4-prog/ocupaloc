const DEFAULT_CONTACT_EMAIL = "contact@ocupaloc.ro";

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL;
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
