interface OverpassElement {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

export interface FreeLeadCandidate {
  businessName: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  street: string | null;
  city: string | null;
  category: string | null;
  googleMapsUrl: string | null;
}

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const DEFAULT_TIMEOUT_MS = 25_000;

const DEFAULT_CITY_BBOX: Record<string, [number, number, number, number]> = {
  bucuresti: [44.31, 25.94, 44.54, 26.25],
  "cluj-napoca": [46.69, 23.45, 46.84, 23.73],
  timisoara: [45.66, 21.12, 45.83, 21.33],
  iasi: [47.10, 27.47, 47.24, 27.72],
  constanta: [44.13, 28.53, 44.25, 28.74]
};

function cityKey(city: string): string {
  return city.trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeWebsite(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeEmail(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return null;
  return trimmed;
}

function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s().-]/g, "").trim();
  return cleaned.length >= 7 ? cleaned : null;
}

function readStreet(tags: Record<string, string>): string | null {
  const street = tags["addr:street"]?.trim();
  const number = tags["addr:housenumber"]?.trim();
  if (street && number) return `${street} ${number}`;
  return street ?? null;
}

function toCandidate(element: OverpassElement): FreeLeadCandidate | null {
  const tags = element.tags ?? {};
  const businessName = tags.name?.trim();
  if (!businessName) {
    return null;
  }

  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;

  return {
    businessName,
    phone: normalizePhone(tags.phone ?? tags["contact:phone"]),
    website: normalizeWebsite(tags.website ?? tags["contact:website"]),
    email: normalizeEmail(tags.email ?? tags["contact:email"]),
    street: readStreet(tags),
    city: tags["addr:city"]?.trim() ?? null,
    category: tags.shop?.trim() ?? tags.amenity?.trim() ?? null,
    googleMapsUrl: lat && lon ? `https://maps.google.com/?q=${lat},${lon}` : null
  };
}

function buildOverpassQuery(bbox: [number, number, number, number], tags: string[]): string {
  const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
  const selectors = tags
    .map((tag) => {
      const [k, v] = tag.split("=");
      return `nwr[${k}=${JSON.stringify(v)}](${bboxStr});`;
    })
    .join("\n");

  return `[out:json][timeout:25];\n(\n${selectors}\n);\nout center tags;`;
}

async function fetchOverpassWithRetry(query: string, retries = 2): Promise<OverpassResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(OVERPASS_ENDPOINT, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "user-agent": "OcupaLocFreeScraper/1.0 (+https://ocupaloc.ro)"
        },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Overpass returned ${response.status}`);
      }

      return (await response.json()) as OverpassResponse;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Overpass request failed");
}

export async function scrapeFreeLeads(input: {
  city?: string;
  bbox?: [number, number, number, number];
  limit?: number;
}): Promise<FreeLeadCandidate[]> {
  const tags = ["shop=hairdresser", "shop=barber", "shop=beauty", "amenity=beauty_salon"];

  const fallbackCity = input.city ? DEFAULT_CITY_BBOX[cityKey(input.city)] : undefined;
  const bbox = input.bbox ?? fallbackCity ?? DEFAULT_CITY_BBOX.bucuresti;
  const query = buildOverpassQuery(bbox, tags);
  const result = await fetchOverpassWithRetry(query);

  const out: FreeLeadCandidate[] = [];
  const dedupe = new Set<string>();

  for (const element of result.elements ?? []) {
    const candidate = toCandidate(element);
    if (!candidate) continue;

    if (!candidate.phone && !candidate.website && !candidate.email) {
      continue;
    }

    const dedupeKey = `${candidate.businessName.toLowerCase()}|${candidate.phone ?? ""}|${candidate.website ?? ""}`;
    if (dedupe.has(dedupeKey)) {
      continue;
    }

    dedupe.add(dedupeKey);
    out.push(candidate);

    if (input.limit && out.length >= input.limit) {
      break;
    }
  }

  return out;
}
