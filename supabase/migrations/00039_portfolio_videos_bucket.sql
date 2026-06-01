-- ============================================
-- 00039: portfolio-videos バケットの構成
-- ============================================
-- 動画ファイルの直接アップロードを安定化させるため、storage バケット設定を明示。
-- - file_size_limit: 100MB
-- - allowed_mime_types: 画像 + 動画 (既存のサムネ用画像と共存)
-- - public: true (公開読み取り)
--
-- INSERT は ON CONFLICT で冪等。既存値があれば必要なら UPDATE で上書きする。

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-videos',
  'portfolio-videos',
  true,
  104857600, -- 100MB
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/webm','video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 認証ユーザーが自分の user_id フォルダに INSERT/UPDATE 可能
DROP POLICY IF EXISTS "portfolio-videos insert own" ON storage.objects;
CREATE POLICY "portfolio-videos insert own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "portfolio-videos update own" ON storage.objects;
CREATE POLICY "portfolio-videos update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "portfolio-videos delete own" ON storage.objects;
CREATE POLICY "portfolio-videos delete own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 公開読み取り (誰でも視聴可)
DROP POLICY IF EXISTS "portfolio-videos public select" ON storage.objects;
CREATE POLICY "portfolio-videos public select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-videos');
