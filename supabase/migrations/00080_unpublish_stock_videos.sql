-- 2026-08-05: dev データとして残っていた stock 動画 URL を unpublish。
-- これらは /creators や /portfolios で毎回表示され、Supabase Storage / 帯域
-- を無駄に消費していた (加えて cloudinary/demo 等 rate-limit にも掛かる)。
--
-- 実データ (creator 本人アップロード分) には影響しない。
-- ロールバックしたい場合は復元 UPDATE でよい (created_at 等は不変)。

UPDATE portfolio_items
SET moderation_status = 'unpublished'
WHERE media_type = 'video'
  AND (
    video_url ILIKE '%cloudinary.com/demo%' OR
    video_url ILIKE '%samplelib%' OR
    video_url ILIKE '%test-videos.co.uk%' OR
    video_url ILIKE '%archive.org%' OR
    video_url ILIKE '%filesamples.com%' OR
    video_url ILIKE '%mozilla.net%'
  )
  AND (moderation_status IS NULL OR moderation_status = 'published');
