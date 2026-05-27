-- ============================================
-- 00030: クリエイタープロフィール刷新 +
--        ポートフォリオに aspect_ratio 追加
-- ============================================
-- AILIER のプロフィール構造変更:
--   - skills カラムを削除(汎用編集ソフト名等の自己申告は不要に)
--   - video_lengths (得意映像尺、複数選択 TEXT[]) を追加
--   - strengths (強み、最大2つまで TEXT[]) を追加
--
-- ポートフォリオ検索用に aspect_ratio を追加:
--   - 'vertical' (9:16) / 'horizontal' (16:9) / 'square' (1:1)
--   - 既存データは video_platform から backfill
--   - 画像作品は creator が登録時に指定(デフォルト horizontal)

-- =====================
-- 1. creator_profiles
-- =====================

-- 1-1. skills カラム削除 (AILIER では使用しない)
ALTER TABLE creator_profiles
  DROP COLUMN IF EXISTS skills;

-- 1-2. video_lengths 追加 (得意映像尺、複数選択)
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS video_lengths TEXT[] NOT NULL DEFAULT '{}';

-- 1-3. strengths 追加 (強み、最大2つ)
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS strengths TEXT[] NOT NULL DEFAULT '{}';

-- 1-4. strengths は2件以内に制約
ALTER TABLE creator_profiles
  ADD CONSTRAINT creator_profiles_strengths_max2
  CHECK (array_length(strengths, 1) IS NULL OR array_length(strengths, 1) <= 2);

COMMENT ON COLUMN creator_profiles.video_lengths IS '得意映像尺 (複数選択可)';
COMMENT ON COLUMN creator_profiles.strengths IS '強み (最大2つ)';

-- =====================
-- 2. portfolio_items
-- =====================

-- 2-1. aspect_ratio 追加
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS aspect_ratio TEXT
    CHECK (aspect_ratio IN ('vertical', 'horizontal', 'square'));

-- 2-2. 既存データを backfill
--      縦型プラットフォーム → 'vertical'
--      その他動画 → 'horizontal'
--      画像 → 'horizontal' (デフォルト、creator が後で更新可能)
UPDATE portfolio_items
SET aspect_ratio = CASE
  WHEN media_type = 'image' THEN 'horizontal'
  WHEN video_platform IN ('youtube_short', 'tiktok', 'instagram') THEN 'vertical'
  ELSE 'horizontal'
END
WHERE aspect_ratio IS NULL;

-- 2-3. NOT NULL 化 (backfill 完了後)
ALTER TABLE portfolio_items
  ALTER COLUMN aspect_ratio SET NOT NULL,
  ALTER COLUMN aspect_ratio SET DEFAULT 'horizontal';

-- 2-4. インデックス (アスペクト比フィルタを高速化)
CREATE INDEX IF NOT EXISTS idx_portfolio_items_aspect
  ON portfolio_items(aspect_ratio);

COMMENT ON COLUMN portfolio_items.aspect_ratio IS 'アスペクト比: vertical(9:16) / horizontal(16:9) / square(1:1)';
