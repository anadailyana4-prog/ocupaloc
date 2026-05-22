export type PublicProfileMedia = {
  promoVideoUrl: string | null;
  trustBadges: string[];
};

type PublicProfileBio = {
  media?: {
    promo_video_url?: unknown;
    trust_badges?: unknown;
  };
};

function isAllowedMediaUrl(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  if (value.startsWith("https://")) return true;
  return false;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
}

/** bio în DB e coloană text cu JSON serializat — trebuie parsat la citire */
export function parseBioRoot(bio: unknown): Record<string, unknown> {
  if (bio == null) return {};
  if (typeof bio === "string") {
    const trimmed = bio.trim();
    if (!trimmed) return {};
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (typeof bio === "object" && !Array.isArray(bio)) {
    return bio as Record<string, unknown>;
  }
  return {};
}

export function parsePublicProfileMedia(bio: unknown): PublicProfileMedia {
  const root = parseBioRoot(bio) as PublicProfileBio;
  const media = root.media ?? {};

  const trustBadges = toStringArray(media.trust_badges).slice(0, 10);
  const promoVideoCandidate = typeof media.promo_video_url === "string" ? media.promo_video_url.trim() : "";
  const promoVideoUrl = isAllowedMediaUrl(promoVideoCandidate) ? promoVideoCandidate : null;

  return {
    promoVideoUrl,
    trustBadges
  };
}

export function mergePublicProfileMedia(bio: unknown, mediaInput: PublicProfileMedia): Record<string, unknown> {
  const base = parseBioRoot(bio);
  const media = {
    promo_video_url: mediaInput.promoVideoUrl,
    trust_badges: mediaInput.trustBadges
  };

  return {
    ...base,
    media
  };
}

/** Scriere în coloana text `bio` */
export function serializeBioForDb(bio: unknown, mediaInput: PublicProfileMedia): string {
  return JSON.stringify(mergePublicProfileMedia(bio, mediaInput));
}
