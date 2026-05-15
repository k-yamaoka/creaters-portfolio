-- ============================================
-- ポートフォリオ作品の「お気に入り表示」フラグ
-- クリエイター一覧 (creators) のサムネイル行は最大4件まで表示する仕様。
-- どの作品を表示させるかをクリエイター自身が選択できるようにする。
-- 制約: 1クリエイターにつき is_featured = TRUE を最大 4 件まで
-- ============================================

-- 再実行に強くするため、既存のトリガと関数を一度落とす
DROP TRIGGER IF EXISTS trg_enforce_max_featured ON portfolio_items;
DROP FUNCTION IF EXISTS enforce_max_featured_portfolios();

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- 既存データは「最新4件」を自動で featured に昇格 (UX 後方互換のため)
-- 再実行で何度走っても結果が変わらないように pi.is_featured = FALSE 条件で絞る
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY creator_id
      ORDER BY created_at DESC
    ) AS rn
  FROM portfolio_items
  WHERE thumbnail_url IS NOT NULL AND thumbnail_url <> ''
)
UPDATE portfolio_items pi
SET is_featured = TRUE
FROM ranked
WHERE pi.id = ranked.id
  AND ranked.rn <= 4
  AND pi.is_featured = FALSE;

-- 制約: 1クリエイターあたり is_featured = TRUE は 4 件まで
-- - NEW.is_featured が FALSE のときは無条件で通す
-- - 値が変わらない UPDATE もスキップする (idempotent な再実行のため)
CREATE FUNCTION enforce_max_featured_portfolios()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_featured IS NOT DISTINCT FROM NEW.is_featured THEN
    RETURN NEW;
  END IF;

  IF NEW.is_featured = TRUE THEN
    IF (
      SELECT COUNT(*) FROM portfolio_items
      WHERE creator_id = NEW.creator_id
        AND is_featured = TRUE
        AND id <> NEW.id
    ) >= 4 THEN
      RAISE EXCEPTION '表示できる作品は最大4件までです';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_max_featured
  BEFORE INSERT OR UPDATE OF is_featured ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_featured_portfolios();

CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured
  ON portfolio_items (creator_id, is_featured)
  WHERE is_featured = TRUE;
