-- ============================================
-- 00038: ポートフォリオ作品への「いいね」機能
-- ============================================
-- ユーザーが好きな作品を保存 (favorite/like) できるよう
-- 中間テーブル portfolio_likes を追加。
--
-- - 1ユーザー1作品 1いいねまで (UNIQUE 制約)
-- - 認証ユーザーのみ insert/delete 可 (RLS)
-- - 集計は portfolio_items.like_count をトリガーで maintain (高速読み込み)

-- =====================
-- portfolio_likes table
-- =====================
CREATE TABLE IF NOT EXISTS portfolio_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, portfolio_item_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_likes_user
  ON portfolio_likes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_likes_item
  ON portfolio_likes(portfolio_item_id);

ALTER TABLE portfolio_likes ENABLE ROW LEVEL SECURITY;

-- 誰でも SELECT 可能 (集計表示用)
DROP POLICY IF EXISTS "portfolio_likes_select_public" ON portfolio_likes;
CREATE POLICY "portfolio_likes_select_public"
  ON portfolio_likes FOR SELECT
  USING (true);

-- 本人のみ insert
DROP POLICY IF EXISTS "portfolio_likes_insert_self" ON portfolio_likes;
CREATE POLICY "portfolio_likes_insert_self"
  ON portfolio_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 本人のみ delete
DROP POLICY IF EXISTS "portfolio_likes_delete_self" ON portfolio_likes;
CREATE POLICY "portfolio_likes_delete_self"
  ON portfolio_likes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- like_count on portfolio_items
-- =====================
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

-- INSERT/DELETE トリガーで like_count を維持
CREATE OR REPLACE FUNCTION update_portfolio_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE portfolio_items
    SET like_count = like_count + 1
    WHERE id = NEW.portfolio_item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE portfolio_items
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.portfolio_item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_portfolio_likes_count ON portfolio_likes;
CREATE TRIGGER trg_portfolio_likes_count
  AFTER INSERT OR DELETE ON portfolio_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_like_count();

-- 既存データ整合 (念のため再集計)
UPDATE portfolio_items pi
SET like_count = COALESCE(c.cnt, 0)
FROM (
  SELECT portfolio_item_id, COUNT(*)::INTEGER AS cnt
  FROM portfolio_likes
  GROUP BY portfolio_item_id
) c
WHERE pi.id = c.portfolio_item_id;

COMMENT ON COLUMN portfolio_items.like_count IS 'いいね数 (トリガーで自動更新)';
