const DIACRITICS: Record<string, string> = {
  ă: "a",
  â: "a",
  î: "i",
  ș: "s",
  ş: "s",
  ț: "t",
  ţ: "t",
  Ă: "a",
  Â: "a",
  Î: "i",
  Ș: "s",
  Ț: "t"
};

export function slugifyBusinessName(raw: string): string {
  let s = raw.trim().toLowerCase();
  for (const [k, v] of Object.entries(DIACRITICS)) {
    s = s.split(k).join(v);
  }
  s = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "studio";
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let candidate = base;
  let n = 1;
  while (await exists(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
