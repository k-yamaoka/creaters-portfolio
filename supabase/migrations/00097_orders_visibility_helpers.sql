-- 00097: orders RLS が creator_profiles / client_profiles の SELECT 可視性
--        に依存する 副作用を SECURITY DEFINER helper で解消
--
-- 事故懸念:
--   00090 で client_profiles.SELECT を絞り、00096 で creator_profiles.SELECT
--   を is_searchable 前提に絞ったところ、orders RLS の
--     EXISTS (SELECT 1 FROM creator_profiles WHERE id = orders.creator_id ...)
--     EXISTS (SELECT 1 FROM client_profiles WHERE id = orders.client_id ...)
--   のサブクエリが 「対象 profile を SELECT できる場合のみ true」になる。
--
--   結果: 相手側 profile が非公開 (is_searchable=false / non-counterparty)
--   だと、当事者本人でも orders を SELECT できないケースが発生する。
--
--   実害: JOB-018 (採用直後 500 error) の原因の一部と推定。採用直後の
--   短時間 は auth session cookie が伝搬中で、上記の RLS チェックが
--   race する。
--
-- 対策:
--   viewer_owns_order(order_creator_id, order_client_id) を SECURITY
--   DEFINER で提供。関数内は 所有者権限で走るので RLS 継承なし。
--   orders SELECT policy をこの関数呼出しに置き換える。
--   ついでに UPDATE policy も同様の EXISTS を持っていたので統一する。

-- ============================================================
-- helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.viewer_owns_order(
  order_creator_id uuid,
  order_client_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM creator_profiles
    WHERE id = order_creator_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM client_profiles
    WHERE id = order_client_id AND user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.viewer_owns_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.viewer_owns_order(uuid, uuid) TO anon, authenticated;

-- ============================================================
-- orders SELECT policy 再構築
-- ============================================================
DROP POLICY IF EXISTS "Order participants can view" ON orders;
DROP POLICY IF EXISTS "Order participants can view (via helper)" ON orders;

CREATE POLICY "Order participants can view (via helper)"
  ON orders FOR SELECT
  USING (
    public.viewer_owns_order(creator_id, client_id)
    OR public.is_admin()
  );

-- ============================================================
-- orders UPDATE policy も同様に helper 経由 (元は EXISTS チェック)
-- ============================================================
DROP POLICY IF EXISTS "Order participants can update" ON orders;
DROP POLICY IF EXISTS "Order participants can update (via helper)" ON orders;

CREATE POLICY "Order participants can update (via helper)"
  ON orders FOR UPDATE
  USING (
    public.viewer_owns_order(creator_id, client_id)
    OR public.is_admin()
  );
