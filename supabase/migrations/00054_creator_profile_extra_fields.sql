-- 00054: creator_profiles に検索/マッチング向上のための追加フィールド
--
-- 追加項目:
--  - cover_image_url        TEXT          — プロフィール詳細上部のヒーロー背景画像
--  - availability_status    TEXT          — 稼働状況 (accepting / consultation_only / busy / paused)
--  - typical_first_draft_days INTEGER     — 初稿提出の目安日数
--  - social_links           JSONB         — { youtube, x, instagram, tiktok, website }

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT
    CHECK (availability_status IN ('accepting','consultation_only','busy','paused')),
  ADD COLUMN IF NOT EXISTS typical_first_draft_days INTEGER
    CHECK (typical_first_draft_days IS NULL OR (typical_first_draft_days >= 1 AND typical_first_draft_days <= 90)),
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN creator_profiles.cover_image_url IS 'プロフィール上部のヒーロー背景画像 URL';
COMMENT ON COLUMN creator_profiles.availability_status IS '稼働状況。null は未設定 (= 旧データ互換)';
COMMENT ON COLUMN creator_profiles.typical_first_draft_days IS '初稿提出の目安日数 (1〜90)';
COMMENT ON COLUMN creator_profiles.social_links IS 'SNS / 外部リンク URL (キー: youtube, x, instagram, tiktok, website)';
