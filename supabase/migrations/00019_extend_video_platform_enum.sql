-- ============================================
-- video_platform enum に縦型系プラットフォームを追加
-- フォーム (portfolio-manager.tsx) と絞り込みタブ (portfolio-thumbnail-grid.tsx)
-- は以前から youtube_short / tiktok / instagram を扱う前提で書かれていたが、
-- enum には値が無く、登録/シード投入時に invalid_text_representation で失敗していた。
-- ============================================

ALTER TYPE video_platform ADD VALUE IF NOT EXISTS 'youtube_short';
ALTER TYPE video_platform ADD VALUE IF NOT EXISTS 'tiktok';
ALTER TYPE video_platform ADD VALUE IF NOT EXISTS 'instagram';
