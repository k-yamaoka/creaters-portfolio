-- 00096: creator_profiles を is_searchable=false / suspended から
--        全 anon 経路で 不可視化 (CDET-016 追加対応)
--
-- 事故:
--   CDET-016 検証で 「suspended creator (is_active=false)」の
--   /creators/{id} 詳細ページが 200 を返し、依頼 CTA・AI 見積もり
--   チャット・メッセージ導線が全部活きていた。
--   加えて /creators?count で 20 件、実描画 18 件の 不整合が発生
--   (count が RLS を貫通)。
--
-- 対策:
--   00095 で trigger 「is_active=false → is_searchable=false」を仕込んだ
--   ので、creator_profiles.SELECT policy を is_searchable=true 前提に
--   変更する。self / admin は例外で自分の (or 全部) 見られる。
--
-- 副作用:
--   - service_role (BYPASSRLS) は影響なし
--   - suspended creator 本人は 自分の詳細を編集で見られる (self 分岐)
--   - admin は全 creator 見える

-- ============================================================
-- creator_profiles SELECT policy 再構築
-- ============================================================
DROP POLICY IF EXISTS "Creator profiles are viewable by everyone" ON creator_profiles;
DROP POLICY IF EXISTS "Creator profiles visible to public if searchable" ON creator_profiles;

CREATE POLICY "Creator profiles visible to public if searchable"
  ON creator_profiles FOR SELECT
  USING (
    -- 自分の creator_profile (suspended/非公開でも)
    auth.uid() = user_id
    -- admin
    OR public.is_admin()
    -- 公開: is_searchable=true のみ (00095 trigger で suspend 時は false 化)
    OR is_searchable = true
  );
