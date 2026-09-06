-- 00092: Storage bucket RLS の再構築 (RLS-Storage 検証で発覚した抜け穴の是正)
--
-- 事故:
--   RLS-Storage 検証で 攻撃者 が portfolio-videos/{victim_uid}/hack.mp4 に
--   正常に upload できた (HTTP 200)。
--   avatars 側の同種テストは 403 で正しく弾かれた。
--   → portfolio-videos の INSERT policy が Supabase Dashboard 経由で 過去に
--     緩められていた or 別 policy が競合していた可能性 (migration 00039 の
--     文面と実状が乖離)。
--
-- 対策:
--   両バケット (portfolio-videos / avatars) について、storage.objects の
--   INSERT / UPDATE / DELETE policy を「一旦 全 DROP → 厳格版を再作成」で
--   確実に固定する。
--
--   厳格版 = 認証ユーザーが 自 uid フォルダにしか触れないポリシー。
--            SELECT は public bucket のため誰でも読める運用は継続。
--
-- 冪等: 既知の policy name を全 DROP + DO block で bucket_id 参照の残存
--       policy も 一括 DROP。CREATE POLICY 側は 各操作 1 本ずつ。
--
-- ロールバック: このコミットの状態が「あるべき姿」なので、rollback 用の
--   逆マイグレーションは用意しない (緩めるのは意図的に難しくしておく)。

-- ============================================================
-- 1) portfolio-videos / avatars バケットに関係する 全 policy を洗い流す
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND (
        qual  ILIKE '%portfolio-videos%'
        OR with_check ILIKE '%portfolio-videos%'
        OR qual  ILIKE '%avatars%'
        OR with_check ILIKE '%avatars%'
        OR policyname ILIKE '%portfolio-videos%'
        OR policyname ILIKE '%avatars%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    RAISE NOTICE 'dropped storage.objects policy: %', r.policyname;
  END LOOP;
END $$;

-- ============================================================
-- 2) portfolio-videos: 厳格ポリシー 4 本 (INSERT/UPDATE/DELETE 自 uid folder、SELECT 公開)
-- ============================================================
CREATE POLICY "portfolio-videos insert own strict"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "portfolio-videos update own strict"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'portfolio-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "portfolio-videos delete own strict"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "portfolio-videos public select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-videos');

-- ============================================================
-- 3) avatars: 同じく厳格ポリシー 4 本
-- ============================================================
CREATE POLICY "avatars insert own strict"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars update own strict"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars delete own strict"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars public select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
