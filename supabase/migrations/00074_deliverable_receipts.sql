-- 00074: 納品物 受領 / ダウンロード 追跡
--
-- 設計書 v1 §1.2 対応 (2026-07-21):
--   * クライアントが納品物をダウンロード / 使用したら receipt を記録
--   * cancel API / dispute API が receipts の存在をチェックし、
--     "全額返金 (100%)" を要求されても弾く (実質的受領のため)
--
-- 記録するのは "ダウンロード" と "運用開始マーク" の 2 種類。
--   'download' はサーバー側で file の PUT 直後に自動 insert 想定
--   'use_confirm' は将来の UI ボタン (「使用を開始しました」宣言) 用に予約

CREATE TABLE IF NOT EXISTS order_deliverable_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('client', 'creator', 'admin')),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'download',       -- ファイル ダウンロード
    'view_preview',   -- プレビュー閲覧 (弱いシグナル、返金ガードには使わない)
    'use_confirm'     -- 使用開始の明示宣言 (強いシグナル)
  )),
  file_key TEXT,      -- Supabase Storage path (message-attachments / etc)
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_order
  ON order_deliverable_receipts(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_effective
  ON order_deliverable_receipts(order_id)
  WHERE action_type IN ('download', 'use_confirm');

COMMENT ON TABLE order_deliverable_receipts IS
  '00074: 納品物の実質的受領 (ダウンロード / 使用宣言) 履歴。
   cancel/dispute API がこれを見て 100% 返金要求を弾く根拠にする。';

-- RLS: 取引当事者だけが自身の関わる receipt を SELECT 可
ALTER TABLE order_deliverable_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Receipts viewable by order parties" ON order_deliverable_receipts;
CREATE POLICY "Receipts viewable by order parties" ON order_deliverable_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN client_profiles cp ON cp.id = o.client_id
      LEFT JOIN creator_profiles cr ON cr.id = o.creator_id
      WHERE o.id = order_deliverable_receipts.order_id
        AND (cp.user_id = auth.uid() OR cr.user_id = auth.uid())
    )
  );

-- INSERT は当事者 (actor_user_id = auth.uid()) のみ
DROP POLICY IF EXISTS "Receipts insert by actor" ON order_deliverable_receipts;
CREATE POLICY "Receipts insert by actor" ON order_deliverable_receipts FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN client_profiles cp ON cp.id = o.client_id
      LEFT JOIN creator_profiles cr ON cr.id = o.creator_id
      WHERE o.id = order_deliverable_receipts.order_id
        AND (cp.user_id = auth.uid() OR cr.user_id = auth.uid())
    )
  );

-- 集計 view: order ごとの effective (download or use_confirm) 有無
CREATE OR REPLACE VIEW order_receipt_summary AS
  SELECT
    order_id,
    COUNT(*) FILTER (
      WHERE action_type IN ('download', 'use_confirm')
    ) AS effective_count,
    MAX(created_at) FILTER (
      WHERE action_type IN ('download', 'use_confirm')
    ) AS last_effective_at
  FROM order_deliverable_receipts
  GROUP BY order_id;

GRANT SELECT ON order_receipt_summary TO authenticated;
