-- 00090: RLS-005 / RLS-012 で検出された RLS 緩過ぎ 問題の是正
--
-- 事故:
--   RLS-005 検証: SELECT client_profiles を anon key で叩くと 全 10 行 が
--     見えた。要件は「取引相手のみ」。
--   RLS-012 検証: SELECT portfolio_items?moderation_status=eq.unpublished を
--     anon で叩くと 全 18 行 が見えた。要件は「他人の unpublished は不可視」。
--
-- 原因:
--   00001_initial_schema.sql の
--     "Client profiles are viewable by everyone" USING (true)
--     "Portfolios are viewable by everyone" USING (true)
--   により、両テーブルとも「誰でも全件 SELECT 可」なポリシーが敷かれていた。
--
-- 対策:
--   両方のテーブルで公開ポリシーを DROP し、以下の 3 系統だけ SELECT 可能に:
--     (1) 自分自身の行 (self)
--     (2) 業務接点のある相手 (party in orders / jobs / job_applications /
--         job_invitations)
--     (3) 管理者 (profiles.role = 'admin')
--
-- 冪等: DROP POLICY IF EXISTS + CREATE POLICY。既存 seed / RLS の他 policy
--   (INSERT / UPDATE / DELETE 系) には触らない。
--
-- サービスロール (Cron / Server Actions 経由の書込) は元々 BYPASSRLS のため
-- 影響なし。UI の LP / creator 詳細で公開すべき company_name などは
-- 「自分が発注した企業」に限られる (取引相手 = 相手側 creator にとって
--  発注元) ので、要件通り。

-- ============================================================
-- Helper: is_admin() は 既存でも定義済みかもしれないが冪等に再定義
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ============================================================
-- 1) client_profiles: SELECT を 取引相手 + 自分 + admin に絞る
-- ============================================================
DROP POLICY IF EXISTS "Client profiles are viewable by everyone" ON client_profiles;
DROP POLICY IF EXISTS "Client profiles selectable by counterparties" ON client_profiles;

CREATE POLICY "Client profiles selectable by counterparties"
  ON client_profiles FOR SELECT
  USING (
    -- self
    auth.uid() = user_id
    -- admin
    OR public.is_admin()
    -- 発注済 order の creator 側
    OR EXISTS (
      SELECT 1
      FROM orders o
      JOIN creator_profiles cp ON cp.id = o.creator_id
      WHERE o.client_id = client_profiles.id
        AND cp.user_id = auth.uid()
    )
    -- 応募済 job (client 側 job に自分が応募)
    OR EXISTS (
      SELECT 1
      FROM jobs j
      JOIN job_applications ja ON ja.job_id = j.id
      JOIN creator_profiles cp ON cp.id = ja.creator_id
      WHERE j.client_id = client_profiles.id
        AND cp.user_id = auth.uid()
    )
    -- スカウト送信を受け取った creator 側
    OR EXISTS (
      SELECT 1
      FROM job_invitations ji
      JOIN jobs j ON j.id = ji.job_id
      JOIN creator_profiles cp ON cp.id = ji.creator_id
      WHERE j.client_id = client_profiles.id
        AND cp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2) portfolio_items: 他人の unpublished / deleted は不可視
-- ============================================================
DROP POLICY IF EXISTS "Portfolios are viewable by everyone" ON portfolio_items;
DROP POLICY IF EXISTS "Portfolios selectable with moderation gate" ON portfolio_items;

CREATE POLICY "Portfolios selectable with moderation gate"
  ON portfolio_items FOR SELECT
  USING (
    -- 公開状態 (NULL = 未 moderation 済 = 公開扱い、'published' = 承認済)
    moderation_status IS NULL
    OR moderation_status = 'published'
    -- 自分の作品は unpublished / deleted 含めて全 見える
    OR EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = portfolio_items.creator_id
        AND cp.user_id = auth.uid()
    )
    -- admin は全て見える
    OR public.is_admin()
  );
