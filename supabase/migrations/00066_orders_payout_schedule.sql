-- 00066: orders テーブルに検収完了日 + 入金予定日 + 入金ステータスを追加
--
-- ビジネス要件 (A-3, 2026-07-14):
--   - 検収完了 (escrow_status='released') 時に inspected_at をセット
--   - 入金予定日 payout_scheduled_date = inspected_at + 3 営業日 (規約準拠)
--   - payout_status で入金処理の進捗を追跡:
--       pending    : 検収未完了 (入金対象外)
--       scheduled  : 検収済 / 入金待ち (payout_scheduled_date に入金予定)
--       paid       : 入金済 (Stripe Connect 経由で実行)
--       failed     : 入金失敗 (再送または手動対応)
--
-- 既存レコード backfill:
--   - escrow_status='released' の order は inspected_at = completed_at
--   - payout_scheduled_date = inspected_at::date + 3 days
--   - payout_status = 'scheduled' (実際の Stripe 送金状況は個別確認)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS payout_status TEXT
    CHECK (payout_status IN ('pending', 'scheduled', 'paid', 'failed'))
    DEFAULT 'pending';

-- 検索用インデックス: 入金予定日順にクリエイター別で照会するのが典型パターン
CREATE INDEX IF NOT EXISTS idx_orders_payout_scheduled_date
  ON orders(creator_id, payout_scheduled_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_orders_payout_status
  ON orders(payout_status)
  WHERE payout_status IN ('scheduled', 'paid');

-- 既存 released order の backfill (冪等: 既に inspected_at がある場合はスキップ)
UPDATE orders
  SET
    inspected_at = COALESCE(completed_at, delivered_at, NOW()),
    payout_scheduled_date =
      (COALESCE(completed_at, delivered_at, NOW())::date + INTERVAL '3 days')::date,
    payout_status = 'scheduled'
  WHERE escrow_status = 'released'
    AND inspected_at IS NULL;

COMMENT ON COLUMN orders.inspected_at IS
  '検収完了日時 (escrow_status→released の時点)。入金スケジュールの起点。';
COMMENT ON COLUMN orders.payout_scheduled_date IS
  'クリエイターへの入金予定日 (通常 inspected_at + 3 営業日、規約準拠)。';
COMMENT ON COLUMN orders.payout_status IS
  '入金処理進捗: pending / scheduled / paid / failed';
