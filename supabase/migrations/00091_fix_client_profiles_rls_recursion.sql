-- 00091: RLS-D2 検証で発覚した client_profiles ↔ orders の
--        infinite recursion を修正
--
-- 事故:
--   00090 で client_profiles.SELECT policy 内に `EXISTS (SELECT 1 FROM orders ...)`
--   を持たせたところ、orders 側の policy も `EXISTS (SELECT 1 FROM client_profiles ...)`
--   を持つため、Postgres が両者を再帰評価しようとして
--     ERROR: 42P17 infinite recursion detected in policy for relation "orders"
--   を返すケースが出た (今回は DELETE orders で発現)。
--
-- 原因:
--   RLS ポリシー内の EXISTS サブクエリは 対象テーブルの RLS を継承して評価する
--   ため、A→B→A の相互参照が発生すると再帰になる。
--
-- 対策:
--   viewer_is_client_counterparty(client_profile_id) を SECURITY DEFINER で提供。
--   関数内では所有者権限で 実行されるため RLS は評価されず、再帰が断ち切られる。
--   client_profiles.SELECT policy はこの関数を呼ぶだけになる。
--
-- 副作用:
--   なし。SECURITY DEFINER のため権限昇格になるが、渡す引数は 対象 client_profile
--   の id で、返却は boolean だけ。関数が漏らせる情報は「auth.uid() が この client と
--   関係あるか (真偽)」のみ。

-- ============================================================
-- SECURITY DEFINER helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.viewer_is_client_counterparty(
  client_profile_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- 発注済 order の creator 側
    SELECT 1 FROM orders o
    JOIN creator_profiles cp ON cp.id = o.creator_id
    WHERE o.client_id = client_profile_id
      AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    -- 応募済 job (client 側 job に自分が応募)
    SELECT 1 FROM jobs j
    JOIN job_applications ja ON ja.job_id = j.id
    JOIN creator_profiles cp ON cp.id = ja.creator_id
    WHERE j.client_id = client_profile_id
      AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    -- スカウト受領 creator
    SELECT 1 FROM job_invitations ji
    JOIN jobs j ON j.id = ji.job_id
    JOIN creator_profiles cp ON cp.id = ji.creator_id
    WHERE j.client_id = client_profile_id
      AND cp.user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.viewer_is_client_counterparty(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.viewer_is_client_counterparty(uuid) TO anon, authenticated;

-- ============================================================
-- client_profiles SELECT policy を再構築 (recursion 回避)
-- ============================================================
DROP POLICY IF EXISTS "Client profiles selectable by counterparties" ON client_profiles;

CREATE POLICY "Client profiles selectable by counterparties"
  ON client_profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR public.viewer_is_client_counterparty(id)
  );
