-- ============================================
-- 既存の5段階レビューを3段階に変換
-- 4-5 → 3 (満足), 2-3 → 2 (普通), 1 → 1 (不満)
-- ※ CHECK制約変更前に実行が必要
-- ============================================

UPDATE reviews SET rating = 3 WHERE rating >= 4;
UPDATE reviews SET rating = 2 WHERE rating IN (2, 3);
-- rating = 1 はそのまま
