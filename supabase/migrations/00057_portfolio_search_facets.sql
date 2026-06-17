-- 00057: portfolio_items に Adobe Stock 型検索ファセットを追加
--
-- /portfolios ページを Adobe Stock 風 (左サイドバー + 右 Masonry) に改修するに
-- あたり、作品単位のフィルタリングに必要な 3 列を追加。残りの列は既存を流用:
--   - aspect_ratio  (向き)     : 既存 (vertical/horizontal/square)
--   - genre        (制作ジャンル): 既存 (1 件のみだが利用)
--   - used_ai_tools (AI ツール) : 既存 00055 で追加済 (TEXT[])
--
-- 追加項目:
--  - duration_seconds INT    作品尺 (秒)。集計バケット (〜15 / 〜60 / 〜180 / 180+)
--                            は UI 側で解釈する。
--  - visual_style    TEXT    トンマナ (cinematic / documentary / anime_jp / cg3d /
--                            flat2d / live_action / neon_sf / fantasy / monochrome)。
--                            列挙ではなく自由 TEXT (将来追加に強い)。
--  - resolution      TEXT    解像度 (1080p / 2k / 4k)。

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS visual_style     TEXT,
  ADD COLUMN IF NOT EXISTS resolution       TEXT;

COMMENT ON COLUMN portfolio_items.duration_seconds IS
  '作品尺 (秒)。NULL = 未入力。UI でバケット (〜15 / 〜60 / 〜180 / 180+) に丸める';
COMMENT ON COLUMN portfolio_items.visual_style IS
  'トンマナ / ビジュアルスタイル (cinematic / anime_jp / cg3d / flat2d / 等)';
COMMENT ON COLUMN portfolio_items.resolution IS
  '解像度 (1080p / 2k / 4k)。NULL = 未入力';

-- 検索インデックス (絞り込み高速化)
CREATE INDEX IF NOT EXISTS idx_portfolio_items_duration ON portfolio_items (duration_seconds);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_visual_style ON portfolio_items (visual_style);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_resolution ON portfolio_items (resolution);
