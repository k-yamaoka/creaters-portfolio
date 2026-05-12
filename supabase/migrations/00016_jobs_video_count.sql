-- ============================================
-- 本数 (count_min/count_max) を編集要件として jobs に追加
-- 見積もり (budget) は本数 × 単価 で算出されるが、
-- 本数自体は編集要件の必須項目としてクリエイターに常に見せる
-- ============================================

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS count_min INTEGER,
  ADD COLUMN IF NOT EXISTS count_max INTEGER;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_count_min_positive
    CHECK (count_min IS NULL OR count_min >= 1);

ALTER TABLE jobs
  ADD CONSTRAINT jobs_count_max_gte_min
    CHECK (count_max IS NULL OR count_min IS NULL OR count_max >= count_min);
