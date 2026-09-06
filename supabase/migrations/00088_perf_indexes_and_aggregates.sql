-- 00088: PERF-009 パフォーマンス改善
--
-- 課題:
--   - /dashboard の「アクティビティ一覧」で notifications / messages /
--     orders を user_id + ORDER BY created_at DESC LIMIT 8 で 3 並列取得。
--     既存の (user_id, is_read) / (receiver_id, is_read) だけでは ORDER BY
--     created_at のソートに index を使えず、行数の多いテーブルで Seq Scan +
--     Sort になっていた。
--   - /dashboard の 総いいね数集計が portfolio_items から like_count を
--     全行 SELECT してアプリ側で reduce する N+1 相当のクエリになっていた。
--   - orders リストのソートも updated_at DESC を index で解決できなかった。
--
-- 対応:
--   1. 一覧系クエリを覆う composite index を追加 (ORDER BY まで index scan)
--   2. 総いいね数を DB 側で 1 行で返す STABLE 関数 (RPC) を用意
--
-- 冪等: すべて IF NOT EXISTS / OR REPLACE。既存 index / 関数と衝突しない。

-- ============================================================
-- 1) 一覧系 composite index
-- ============================================================

-- 通知一覧: WHERE user_id = ? ORDER BY created_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- 受信メッセージ一覧: WHERE receiver_id = ? ORDER BY created_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created
  ON messages (receiver_id, created_at DESC);

-- 取引一覧 (creator 側): WHERE creator_id = ? ORDER BY updated_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_orders_creator_updated
  ON orders (creator_id, updated_at DESC);

-- 取引一覧 (client 側): WHERE client_id = ? ORDER BY updated_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_orders_client_updated
  ON orders (client_id, updated_at DESC);

-- portfolio_items の creator_id + moderation_status: 公開 portfolio の絞込
-- (moderation_status IS NULL or published のみ拾いたい)
CREATE INDEX IF NOT EXISTS idx_portfolio_items_creator_moderation
  ON portfolio_items (creator_id, moderation_status);

-- ============================================================
-- 2) 総いいね数 集計 RPC
-- ============================================================
-- /dashboard の「総いいね数」カード用。従来はアプリ側で SELECT + reduce
-- していたが、これを 1 行で返す。STABLE + SECURITY INVOKER で RLS 遵守。

CREATE OR REPLACE FUNCTION public.sum_creator_portfolio_likes(
  p_creator_id uuid
) RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(like_count), 0)::bigint
  FROM portfolio_items
  WHERE creator_id = p_creator_id
    AND (moderation_status IS NULL OR moderation_status = 'published');
$$;

-- anon には露出しない。authenticated ロールのみ実行可。
REVOKE ALL ON FUNCTION public.sum_creator_portfolio_likes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sum_creator_portfolio_likes(uuid) TO authenticated;
