-- 00058: portfolio_items に usage_role を追加 (TOP / FEATURE / Works の自動振り分け)
--
-- AILIER の TOP ページ各所 (Hero / Hero 直下動画帯 / FEATURE / Works) は、
-- ハードコードした動画 URL ではなく portfolio_items を参照して自動配置したい。
-- usage_role でどのスロットに使うかを示し、null = works (一覧専用) とする。
--
-- 取り得る値:
--   'works'   既定。/portfolios と各 Works グリッド・カード一覧に出る (全件)
--   'hero'    TOP ヒーロー右カラム グリッド (3 列縦自動スクロール) の優先候補
--   'feature' FEATURE 01-05 セクションの "操作画面動画" 代替素材
--
-- usage_role='hero'/'feature' を持つ作品も /portfolios 一覧には常に出る
-- (works も含めて表示)。
--
-- 既存の is_featured (00055 で作品単位、bool 既定) は引き続き「Hero 直下に
-- 流す動画帯」用のフラグとして併用。

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS usage_role TEXT NOT NULL DEFAULT 'works';

ALTER TABLE portfolio_items
  ADD CONSTRAINT portfolio_items_usage_role_check
  CHECK (usage_role IN ('works', 'hero', 'feature'));

COMMENT ON COLUMN portfolio_items.usage_role IS
  'TOP 各セクションへの自動振り分け用 ロール (works=一覧専用 / hero=Hero 右グリッド優先 / feature=FEATURE 01-05 操作画面動画)';

CREATE INDEX IF NOT EXISTS idx_portfolio_items_usage_role ON portfolio_items (usage_role);
