-- 00055: portfolio_items にマッチング情報を追加
--
-- 追加項目:
--  - used_ai_tools  TEXT[]  作品で使用した AI ツール (Sora / Runway 等。複数可)
--  - role_scope     TEXT    担当範囲 (プロンプト生成 / 動画編集 など。自由記述)
--  - external_url   TEXT    外部リンク URL (YouTube/X 等、追加で公開する作品ページ)
--  - display_tag    TEXT    サムネ左上に出すラベル。null なら従来の platform 表示
--
-- 既存ロジック (platform/media_type による自動ラベル) は display_tag が null の
-- ときの fallback として維持される。

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS used_ai_tools TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS role_scope    TEXT,
  ADD COLUMN IF NOT EXISTS external_url  TEXT,
  ADD COLUMN IF NOT EXISTS display_tag   TEXT;

COMMENT ON COLUMN portfolio_items.used_ai_tools IS
  '作品の制作に使用した AI ツール (例: Sora 2, Runway Gen-4)';
COMMENT ON COLUMN portfolio_items.role_scope IS
  '担当範囲の自由記述 (例: プロンプト生成 + 動画編集)';
COMMENT ON COLUMN portfolio_items.external_url IS
  '外部リンク URL (作品の YouTube / X / Web ページなど)';
COMMENT ON COLUMN portfolio_items.display_tag IS
  'サムネ左上の可変タグ。null のときは video_platform/media_type から自動表示';
