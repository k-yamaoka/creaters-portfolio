-- 2026-08-24: job_applications と orders の紐付けを 専用カラム化。
--
-- 旧: /dashboard/applications で 「採用 → 作成された order」を client_id ベースの
--    近似検索 (同 client の 最新 order) で表示していた。
--    複数の order がある client では 別の order にリンクしてしまう バグの温床。
-- 新: job_applications.order_id を追加し、採用時に生成した order の ID を直接記録。
--    /jobs/applications/update route.ts で INSERT 後に UPDATE。

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS order_id UUID
  REFERENCES orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_applications_order_id
  ON job_applications(order_id)
  WHERE order_id IS NOT NULL;
