-- ============================================
-- orders に編集要件カラムを追加
-- jobs (00015, 00016) と同じスキーマを持たせ、
-- /dashboard/orders/new での依頼作成時にクライアントが
-- 編集要件を入力できるようにする。
-- ============================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS footage_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS finish_duration_unit TEXT,
  ADD COLUMN IF NOT EXISTS finish_duration_min NUMERIC,
  ADD COLUMN IF NOT EXISTS finish_duration_max NUMERIC,
  ADD COLUMN IF NOT EXISTS count_min INTEGER,
  ADD COLUMN IF NOT EXISTS count_max INTEGER,
  ADD COLUMN IF NOT EXISTS work_types TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS revision_count INTEGER,
  ADD COLUMN IF NOT EXISTS software_options TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_formats TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_days INTEGER,
  ADD COLUMN IF NOT EXISTS reference_url TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS monthly_count INTEGER,
  ADD COLUMN IF NOT EXISTS client_type TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_finish_duration_unit_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_finish_duration_unit_check
    CHECK (finish_duration_unit IS NULL OR finish_duration_unit IN ('sec', 'min'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_count_min_positive;
ALTER TABLE orders
  ADD CONSTRAINT orders_count_min_positive
    CHECK (count_min IS NULL OR count_min >= 1);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_count_max_gte_min;
ALTER TABLE orders
  ADD CONSTRAINT orders_count_max_gte_min
    CHECK (count_max IS NULL OR count_min IS NULL OR count_max >= count_min);
