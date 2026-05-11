-- ============================================
-- 取引ステータスを 7 段階に再定義
--   1.consultation  相談中
--   2.quoting       見積もり
--   3.contract      契約
--   4.data_sharing  データ共有
--   5.production    制作中
--   6.revision      修正中
--   7.delivered     納品完了
-- + cancelled (キャンセル)
-- ============================================

-- 0. 旧 status 値に依存する RLS ポリシーを退避
DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;

-- 1. enum 型変更のため、一旦 TEXT 化
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE TEXT;

-- 2. 旧値→新値マッピング
UPDATE orders SET status = CASE status
  WHEN 'inquiry'     THEN 'consultation'
  WHEN 'quoted'      THEN 'quoting'
  WHEN 'accepted'    THEN 'contract'
  WHEN 'paid'        THEN 'data_sharing'
  WHEN 'in_progress' THEN 'production'
  WHEN 'completed'   THEN 'delivered'
  ELSE status -- delivered / revision / cancelled はそのまま
END;

-- 3. 旧 enum を削除して新 enum を作成
DROP TYPE order_status;
CREATE TYPE order_status AS ENUM (
  'consultation',
  'quoting',
  'contract',
  'data_sharing',
  'production',
  'revision',
  'delivered',
  'cancelled'
);

-- 4. column を新 enum に戻す + デフォルト値設定
ALTER TABLE orders
  ALTER COLUMN status TYPE order_status USING status::order_status;
ALTER TABLE orders
  ALTER COLUMN status SET DEFAULT 'consultation';

-- 5. レビュー作成ポリシー再作成（新値: 納品完了 + 検収済み(escrow released)）
CREATE POLICY "Clients can create reviews"
  ON reviews FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE id = reviews.client_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE id = reviews.order_id
        AND status = 'delivered'
        AND escrow_status = 'released'
    )
  );
