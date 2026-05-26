-- ============================================
-- 00029: portfolio_items に画像(静止画)対応を追加
-- ============================================
-- AILIER は AI 動画だけでなく AI 静止画(SNS広告バナー・商品ビジュアル等)も
-- 取り扱うため、ポートフォリオに画像アイテムを登録できるようにする。
--
-- - media_type: 'video' | 'image' でアイテム種別を識別
-- - image_url: 画像URL(Supabase Storage または外部URL)
-- - video_url: 画像の場合は不要なので NULL 許容に変更
-- - video_platform: 画像の場合も適切なデフォルトを許容するため変更しない
--   (既存アイテムは media_type='video' として動作継続)

-- 1. media_type 追加 (デフォルト 'video' で既存データを保護)
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'video'
    CHECK (media_type IN ('video', 'image'));

-- 2. image_url 追加 (画像アイテム用)
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. video_url を NULL 許容に変更 (画像アイテムは video_url を持たない)
ALTER TABLE portfolio_items
  ALTER COLUMN video_url DROP NOT NULL;

-- 4. データ整合性: media_type='video' なら video_url 必須、'image' なら image_url 必須
ALTER TABLE portfolio_items
  ADD CONSTRAINT portfolio_items_media_url_check
  CHECK (
    (media_type = 'video' AND video_url IS NOT NULL) OR
    (media_type = 'image' AND image_url IS NOT NULL)
  );

-- 5. インデックス: 種別での絞り込みを高速化
CREATE INDEX IF NOT EXISTS idx_portfolio_items_creator_media
  ON portfolio_items(creator_id, media_type);

COMMENT ON COLUMN portfolio_items.media_type IS 'アイテム種別: video=動画, image=静止画';
COMMENT ON COLUMN portfolio_items.image_url IS '画像URL (Supabase Storage または外部URL)。media_type=image のとき必須';
