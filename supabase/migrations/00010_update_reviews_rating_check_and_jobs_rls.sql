-- ============================================
-- 1. reviews テーブル: rating の CHECK 制約を 1-5 → 1-3 に変更
--    (3段階評価: 3=満足, 2=普通, 1=不満)
-- ============================================

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1 AND rating <= 3);

-- ============================================
-- 2. jobs テーブル: RLS ポリシーを更新
--    closed ステータスの案件も一般閲覧可能にする
--    (案件一覧で「全て」「募集中案件」の切り替えに対応)
-- ============================================

DROP POLICY IF EXISTS "Open jobs are viewable by everyone" ON jobs;

CREATE POLICY "Published jobs are viewable by everyone"
  ON jobs FOR SELECT USING (
    status IN ('open', 'closed')
    OR EXISTS (
      SELECT 1 FROM client_profiles
      WHERE id = jobs.client_id AND user_id = auth.uid()
    )
  );
