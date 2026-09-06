-- 00095: MOD-036 対応 — suspended creator の portfolio_items を公開一覧から除外
--
-- 事故:
--   MOD-036 検証で 「creator を suspend (is_active=false) しても、その creator の
--   portfolio_items が /creators / /portfolios 一覧に表示され続ける」ことを確認。
--   portfolio_items RLS policy (00090) は creator の状態を参照していなかった。
--
-- 対策:
--   1. is_creator_active(pi_creator_id) を SECURITY DEFINER で提供
--      (creator_profiles + profiles を JOIN、profiles.is_active を判定)
--   2. portfolio_items SELECT policy を更新:
--        - 従来: moderation_status ∈ {NULL, 'published'} OR self OR admin
--        - 新規: 上記 に加えて creator が is_active であること (self/admin は例外)
--   3. creator_profiles SELECT policy は 「everyone visible」を維持しつつ、
--      アプリ側 (getCreators) では すでに is_searchable=true 縛りがあるため、
--      admin suspend 時に is_searchable=false を同期する trigger を追加。
--   4. 既存の suspended creator (is_active=false) の is_searchable を
--      backfill で false に落とす。
--
-- 副作用:
--   - service_role (BYPASSRLS) は影響なし。cron / admin server actions は
--     従来通り全 rows 見える。
--   - 復元 (unsuspend + is_active=true) 時は trigger で is_searchable が
--     true に戻る。portfolio_items は 各自の moderation_status に依存。

-- ============================================================
-- 1) helper: creator が is_active か
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_creator_active(pi_creator_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.is_active
      FROM creator_profiles cp
      JOIN profiles p ON p.id = cp.user_id
      WHERE cp.id = pi_creator_id
    ),
    true   -- 対象 creator が見つからない場合は 表示可 (レガシー data 保護)
  );
$$;
REVOKE ALL ON FUNCTION public.is_creator_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_creator_active(uuid) TO anon, authenticated;

-- ============================================================
-- 2) portfolio_items SELECT policy 更新
-- ============================================================
DROP POLICY IF EXISTS "Portfolios selectable with moderation gate" ON portfolio_items;

CREATE POLICY "Portfolios selectable with moderation gate"
  ON portfolio_items FOR SELECT
  USING (
    -- 自分の作品は creator の suspend 状態に関わらず (unpublished/deleted 含めて) 見える
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = portfolio_items.creator_id
        AND cp.user_id = auth.uid()
    )
    -- admin は全て見える
    OR public.is_admin()
    -- それ以外は 公開状態 AND creator が active であること
    OR (
      (moderation_status IS NULL OR moderation_status = 'published')
      AND public.is_creator_active(portfolio_items.creator_id)
    )
  );

-- ============================================================
-- 3) profiles.is_active 変更 trigger: creator_profiles.is_searchable 同期
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_creator_searchable_on_suspension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- is_active が変わった時だけ処理
  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    UPDATE creator_profiles
      SET is_searchable = NEW.is_active
      WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_searchable_on_suspend ON profiles;
CREATE TRIGGER trg_sync_searchable_on_suspend
  AFTER UPDATE OF is_active ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_creator_searchable_on_suspension();

-- ============================================================
-- 4) backfill: 既存 suspended creator の is_searchable を同期
-- ============================================================
UPDATE creator_profiles cp
  SET is_searchable = false
  FROM profiles p
  WHERE cp.user_id = p.id
    AND p.is_active = false
    AND cp.is_searchable = true;
