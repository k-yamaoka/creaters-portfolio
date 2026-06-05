-- ============================================
-- 00047: jobs テーブルにビジュアルスタイル列を追加
-- ============================================
-- 新規案件作成フォームで、企業が「想定するビジュアルの方向性」を
-- ビジュアルタイル UI で選べるようにするためのカラム。
-- 値は JOB_VISUAL_STYLES (lib/constants) の slug (例: "cinematic", "anime_2d") を保持。
-- 自由入力ではなく定義済みリストからの選択に限定する想定だが、
-- text[] にして将来の拡張 (自由入力 / 複数選択) に余白を残す。

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS visual_styles text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN jobs.visual_styles IS
  '案件のビジュアルスタイル (cinematic / documentary / anime_2d 等)。複数選択可。';
