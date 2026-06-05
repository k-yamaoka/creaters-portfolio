-- ============================================
-- 00045: avatars バケットの構成
-- ============================================
-- プロフィールアイコン (アバター画像) を直接アップロードするための
-- Storage バケット。クライアントから Supabase SDK 経由で直接 PUT する。
--
-- 設計上の注意:
-- - 画像のみ (jpeg/png/webp/gif)、5MB 上限
-- - パスは `{auth.uid()}/avatar.<ext>` を想定 (同じユーザは同じパスで上書き)
-- - public 読み取り (avatar_url は profiles テーブルに保存し誰でも閲覧)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 認証ユーザーは自分の user_id フォルダにのみ INSERT/UPDATE/DELETE 可能
DROP POLICY IF EXISTS "avatars insert own" ON storage.objects;
CREATE POLICY "avatars insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars update own" ON storage.objects;
CREATE POLICY "avatars update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars delete own" ON storage.objects;
CREATE POLICY "avatars delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 公開読み取り (アイコンは誰でも閲覧可)
DROP POLICY IF EXISTS "avatars public select" ON storage.objects;
CREATE POLICY "avatars public select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
