-- ============================================
-- client_type に「その他」自由入力を許容するため
-- enum 風の CHECK 制約を撤廃する
-- ============================================

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_client_type_check;
