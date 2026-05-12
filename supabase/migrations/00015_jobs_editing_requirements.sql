-- ============================================
-- Editing requirements (編集要件) を jobs に追加
-- 企業が案件掲載時に記入し、クリエイターが
-- 案件詳細・メッセージ画面で常に参照できる構造化情報
-- ============================================

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS footage_minutes INTEGER,                 -- 素材時間 (約◯分)
  ADD COLUMN IF NOT EXISTS finish_duration_unit TEXT,               -- 完成尺の単位: 'sec' | 'min'
  ADD COLUMN IF NOT EXISTS finish_duration_min NUMERIC,             -- 完成尺の下限
  ADD COLUMN IF NOT EXISTS finish_duration_max NUMERIC,             -- 完成尺の上限
  ADD COLUMN IF NOT EXISTS work_types TEXT[] NOT NULL DEFAULT '{}', -- 作業: カット/テロップ/BGM/SE/カラグレ/MA
  ADD COLUMN IF NOT EXISTS revision_count INTEGER,                  -- 修正回数
  ADD COLUMN IF NOT EXISTS software_options TEXT[] NOT NULL DEFAULT '{}', -- 使用ソフト (任意)
  ADD COLUMN IF NOT EXISTS delivery_formats TEXT[] NOT NULL DEFAULT '{}', -- 納品形式
  ADD COLUMN IF NOT EXISTS delivery_days INTEGER,                   -- 素材受け取りから◯日
  ADD COLUMN IF NOT EXISTS reference_url TEXT,                      -- 参考動画URL (任意)
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false, -- 継続案件 (月◯本)
  ADD COLUMN IF NOT EXISTS monthly_count INTEGER,                   -- 月◯本 (is_recurring=true のとき)
  ADD COLUMN IF NOT EXISTS client_type TEXT;                        -- 個人 / 中小企業 / 上場企業 (任意)

-- 値の整合性チェック (NULL は許可。既存行は NULL のまま)
ALTER TABLE jobs
  ADD CONSTRAINT jobs_finish_duration_unit_check
    CHECK (finish_duration_unit IS NULL OR finish_duration_unit IN ('sec', 'min'));

ALTER TABLE jobs
  ADD CONSTRAINT jobs_client_type_check
    CHECK (client_type IS NULL OR client_type IN ('individual', 'sme', 'listed'));
