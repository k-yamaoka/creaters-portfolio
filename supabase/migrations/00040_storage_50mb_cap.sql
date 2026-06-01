-- ============================================
-- 00040: ストレージ上限を Free tier に合わせて 50MB に統一
-- ============================================
-- Supabase Free tier は **ファイル単位で 50MB 上限**(プラン側の制約)。
-- バケットの file_size_limit は 50MB を超えて指定しても無視されるため、
-- 実態に合わせて整合する。
-- 50MB 超の動画を扱う必要が出たら:
--   1. Supabase Pro 以上にアップグレード → bucket limit を上げる
--   2. もしくは Cloudflare Stream に移行

UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50 * 1024 * 1024
WHERE id = 'portfolio-videos';
