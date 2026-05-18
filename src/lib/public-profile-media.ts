export type PublicProfileMedia = {
  galleryImages: string[];
  promoVideoUrl: string | null;
  trustBadges: string[];
};

type PublicProfileBio = {
  media?: {
    gallery_images?: unknown;
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

export function parsePublicProfileMedia(bio: unknown): PublicProfileMedia {
  const root = (bio ?? {}) as PublicProfileBio;
  const media = root.media ?? {};

  const galleryImages = toStringArray(media.gallery_images).filter(isAllowedMediaUrl).slice(0, 12);
  const trustBadges = toStringArray(media.trust_badges).slice(0, 10);
  const promoVideoCandidate = typeof media.promo_video_url === "string" ? media.promo_video_url.trim() : "";
  const promoVideoUrl = isAllowedMediaUrl(promoVideoCandidate) ? promoVideoCandidate : null;

  return {
    galleryImages,
    promoVideoUrl,
    trustBadges
  };
}

export function mergePublicProfileMedia(bio: unknown, mediaInput: PublicProfileMedia): Record<string, unknown> {
  const base = (bio && typeof bio === "object" && !Array.isArray(bio) ? bio : {}) as Record<string, unknown>;
  const media = {
    gallery_images: mediaInput.galleryImages,
    promo_video_url: mediaInput.promoVideoUrl,
    trust_badges: mediaInput.trustBadges
  };

  return {
    ...base,
    media
  };
}
