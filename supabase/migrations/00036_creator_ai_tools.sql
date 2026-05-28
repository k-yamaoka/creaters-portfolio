-- ============================================
-- 00036: creator_profiles に AI ツール (使用可能ツール) を追加
-- ============================================
-- AILIER は AI クリエイター特化のため、各クリエイターが
-- 使用可能な AI ツール (Sora / Veo / Runway / Midjourney 等)
-- を明示できるカラムを追加する。
--
-- 動画・画像・音声・アップスケール等のジャンルを跨ぐので
-- TEXT[] として複数選択可能に設計。

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS ai_tools TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN creator_profiles.ai_tools IS '使用可能な AI ツール (Sora / Veo / Runway / Midjourney 等、複数選択可)';

CREATE INDEX IF NOT EXISTS idx_creator_profiles_ai_tools
  ON creator_profiles USING GIN (ai_tools);
