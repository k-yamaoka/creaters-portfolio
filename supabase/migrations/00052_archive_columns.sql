-- ============================================
-- 00052: 自分の一覧から非表示にするためのアーカイブカラム
-- ============================================
-- 応募済み案件 (job_applications) / 取引管理 (orders) で、
-- 不採用や終了したエントリを「自分の一覧からだけ消す」機能用。
-- 完全削除ではなく soft hide (相手側はそのまま見える)。
--
-- - applications: 創作者 (応募者) のみ操作可なので 1 カラムでよい
-- - orders: 両者がそれぞれ自分の一覧から消したいので 2 カラム

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS archived_by_creator_at TIMESTAMPTZ;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS archived_by_creator_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by_client_at  TIMESTAMPTZ;

COMMENT ON COLUMN job_applications.archived_by_creator_at IS
  'クリエイターが自分の「応募済み案件」一覧から非表示にした時刻 (相手側からは見える)';
COMMENT ON COLUMN orders.archived_by_creator_at IS
  'クリエイターが自分の「取引一覧」から非表示にした時刻';
COMMENT ON COLUMN orders.archived_by_client_at IS
  'クライアントが自分の「取引一覧」から非表示にした時刻';
