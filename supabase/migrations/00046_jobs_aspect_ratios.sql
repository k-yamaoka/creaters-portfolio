-- ============================================
-- 00046: jobs テーブルにアスペクト比カラムを追加
-- ============================================
-- 新規案件作成フォームで「横型/縦型/その他」のアスペクト比を
-- 複数選択できるようにするためのカラム。
-- "horizontal" / "vertical" / 自由入力文字列を text[] で保持。

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS aspect_ratios text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN jobs.aspect_ratios IS
  '案件のアスペクト比 (horizontal/vertical/自由入力)。複数選択可。';
