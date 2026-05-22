-- Galerie foto: doar policies + cheia gallery_images din bio.
-- Fișierele din bucket se șterg manual din Dashboard → Storage → galerie (API nu permite DELETE direct în SQL).

DROP POLICY IF EXISTS "public read galerie" ON storage.objects;
DROP POLICY IF EXISTS "auth upload galerie" ON storage.objects;
DROP POLICY IF EXISTS "auth update galerie" ON storage.objects;
DROP POLICY IF EXISTS "auth delete galerie" ON storage.objects;

-- Scoate doar media.gallery_images; păstrează promo_video_url, trust_badges și restul JSON.
UPDATE profesionisti
SET bio = (
  CASE
    WHEN trim(bio) = '' THEN bio
    WHEN (trim(bio)::jsonb -> 'media') IS NOT NULL THEN
      (trim(bio)::jsonb #- '{media,gallery_images}')::text
    ELSE bio
  END
)
WHERE bio IS NOT NULL
  AND trim(bio) <> ''
  AND trim(bio)::jsonb -> 'media' ? 'gallery_images';
