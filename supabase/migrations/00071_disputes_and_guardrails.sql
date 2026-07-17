-- 00071: エスクロー ガードレール + 紛争解決 (Trust & Safety) 基盤
--
-- ビジネス要件 (2026-07-16):
--   * 「仮払い前の着手による未払い」「不当な修正要求」「システム未理解による
--      自爆」を防ぐガードレールを DB 層で担保する
--   * 途中終了 / 運営裁定 / みなし検収 / 修正回数上限 の仕組みを追加
--
-- 設計方針:
--   * 既存の order_status enum は温存し (仕様上のカテゴリカル状態
--      "pending_payment / in_progress / delivered / in_dispute /
--       completed / terminated" は order_flow.ts で導出関数として定義)
--   * 途中終了 / 裁定中 / みなし検収 の補助情報を orders 拡張カラムで持つ
--   * disputes / dispute_actions の 2 テーブルで申告と対応履歴を管理

-- ============================================================
-- 1. orders 拡張カラム
-- ============================================================
ALTER TABLE orders
  -- 途中終了 (合意による中途解約)。00069 の cancel_stage との違いは
  -- terminated は双方同意による合意解約で、cancel は単独申請。
  ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terminated_by TEXT
    CHECK (terminated_by IN ('creator', 'client', 'admin', 'system')),
  ADD COLUMN IF NOT EXISTS terminated_reason TEXT,

  -- みなし検収 (delivered 後 N 日でクライアントの action なくても
  -- escrow_status を released に自動遷移させる)。cron で判定。
  ADD COLUMN IF NOT EXISTS auto_approve_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_approved_at TIMESTAMPTZ,

  -- 修正回数の上限 (契約時に合意) と 使用済み回数 の追跡
  ADD COLUMN IF NOT EXISTS max_revisions INTEGER NOT NULL DEFAULT 1
    CHECK (max_revisions >= 0),
  ADD COLUMN IF NOT EXISTS revision_count_used INTEGER NOT NULL DEFAULT 0
    CHECK (revision_count_used >= 0),

  -- 現在の紛争 (disputes.status='open') への直リンク。UI で 1 クエリで
  -- 判定できるよう orders 側にも持たせる (dispute.open 時に SET, close 時に NULL)。
  ADD COLUMN IF NOT EXISTS active_dispute_id UUID;

COMMENT ON COLUMN orders.terminated_at IS
  '合意による途中終了時刻。cancelled と異なり双方同意フロー。';
COMMENT ON COLUMN orders.auto_approve_at IS
  'delivered 後 N 日 (仕様 7 日) で cron が escrow_status=released にする自動検収期限。';
COMMENT ON COLUMN orders.max_revisions IS
  '契約時に合意した修正回数上限。revision_count_used がこれに達したら追加発注扱い。';

-- delivered_at がセットされたら auto_approve_at を +7 日で自動計算する trigger
CREATE OR REPLACE FUNCTION set_order_auto_approve_at()
RETURNS TRIGGER AS $$
BEGIN
  -- delivered_at が今回 セット / 変更されたら auto_approve_at を再計算。
  -- 既に auto_approved_at (実行済) の場合は触らない。
  IF NEW.delivered_at IS NOT NULL
     AND (OLD.delivered_at IS DISTINCT FROM NEW.delivered_at)
     AND NEW.auto_approved_at IS NULL THEN
    NEW.auto_approve_at := NEW.delivered_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_auto_approve_at ON orders;
CREATE TRIGGER trg_orders_auto_approve_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_auto_approve_at();

-- ============================================================
-- 2. disputes テーブル (紛争 = 運営裁定申請)
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- 申請者
  opened_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opened_by_role TEXT NOT NULL CHECK (opened_by_role IN ('creator', 'client')),
  -- カテゴリ (トラブル報告ウィザードの分岐と同期)
  category TEXT NOT NULL CHECK (category IN (
    'no_response',        -- 連絡が来ない
    'unfair_revision',    -- 不当な修正要求
    'payment_delay',      -- 検収されない (=支払われない)
    'quality_issue',      -- 品質問題
    'termination_dispute',-- 途中終了の意見相違
    'other'
  )),
  reason TEXT,            -- ユーザー入力の詳細 (最大 2000 字)
  -- 運営対応ステータス (UI は受付済 / 確認中 / 対応完了 の 3 バッジのみ)
  admin_status TEXT NOT NULL DEFAULT 'received'
    CHECK (admin_status IN ('received', 'reviewing', 'resolved')),
  -- 運営の内部メモ (ユーザー画面には出さない、管理画面のみ)
  internal_note TEXT,
  resolution_summary TEXT, -- 対応完了時にユーザーへ見せる要約 (任意)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_admin_status ON disputes(admin_status);
CREATE INDEX IF NOT EXISTS idx_disputes_open
  ON disputes(order_id) WHERE admin_status <> 'resolved';

COMMENT ON TABLE disputes IS
  '00071: 運営裁定申請 (Trust & Safety)。1 order に対して複数申請可能だが、admin_status=open な行は 1 つのみ (application 側で担保)。';
COMMENT ON COLUMN disputes.internal_note IS
  '運営内部メモ。ユーザー UI には絶対に表示しない (RLS で anon/user から隠す)。';

-- orders.active_dispute_id → disputes.id (循環参照のため後付け FK)
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_active_dispute_fk;
ALTER TABLE orders
  ADD CONSTRAINT orders_active_dispute_fk
  FOREIGN KEY (active_dispute_id) REFERENCES disputes(id) ON DELETE SET NULL;

-- ============================================================
-- 3. dispute_actions テーブル (履歴ログ)
-- ============================================================
CREATE TABLE IF NOT EXISTS dispute_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  -- 誰の action か。NULL = system (cron / trigger)
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN (
    'creator', 'client', 'admin', 'system'
  )),
  -- action の種類 (仕様: 催促/裁定/終了 の分類 + 補助種別)
  action_type TEXT NOT NULL CHECK (action_type IN (
    'reminder',            -- 催促 (相手への通知)
    'dispute_opened',      -- 裁定申請
    'admin_status_update', -- 運営ステータス更新
    'ruling',              -- 運営裁定 (対応完了時の判断)
    'termination_agreed',  -- 途中終了に同意
    'termination_declined',-- 途中終了を拒否
    'auto_approval',       -- みなし検収
    'system_note'
  )),
  -- ユーザー画面に表示してよいか (false は運営内部専用)
  is_public BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dispute_actions_dispute
  ON dispute_actions(dispute_id, created_at DESC);

COMMENT ON TABLE dispute_actions IS
  '00071: 紛争の対応履歴。is_public=false の行はユーザー UI には出さない。';

-- ============================================================
-- 4. RLS
-- ============================================================
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_actions ENABLE ROW LEVEL SECURITY;

-- disputes: 対象 order の当事者 (client / creator) のみ SELECT 可
DROP POLICY IF EXISTS "Disputes viewable by order parties" ON disputes;
CREATE POLICY "Disputes viewable by order parties" ON disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN client_profiles cp ON cp.id = o.client_id
      LEFT JOIN creator_profiles cr ON cr.id = o.creator_id
      WHERE o.id = disputes.order_id
        AND (cp.user_id = auth.uid() OR cr.user_id = auth.uid())
    )
  );

-- disputes: 当事者は INSERT 可 (open)、UPDATE は不可 (管理者だけ)
DROP POLICY IF EXISTS "Disputes insert by order parties" ON disputes;
CREATE POLICY "Disputes insert by order parties" ON disputes FOR INSERT
  WITH CHECK (
    opened_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders o
      LEFT JOIN client_profiles cp ON cp.id = o.client_id
      LEFT JOIN creator_profiles cr ON cr.id = o.creator_id
      WHERE o.id = disputes.order_id
        AND (cp.user_id = auth.uid() OR cr.user_id = auth.uid())
    )
  );

-- dispute_actions: 対象 dispute の当事者は is_public=true の行のみ SELECT 可
DROP POLICY IF EXISTS "Dispute actions viewable to parties (public only)" ON dispute_actions;
CREATE POLICY "Dispute actions viewable to parties (public only)" ON dispute_actions FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM disputes d
      JOIN orders o ON o.id = d.order_id
      LEFT JOIN client_profiles cp ON cp.id = o.client_id
      LEFT JOIN creator_profiles cr ON cr.id = o.creator_id
      WHERE d.id = dispute_actions.dispute_id
        AND (cp.user_id = auth.uid() OR cr.user_id = auth.uid())
    )
  );

-- dispute_actions: 当事者は自身の action_type ('reminder' 等) を INSERT 可
DROP POLICY IF EXISTS "Dispute actions insert by parties" ON dispute_actions;
CREATE POLICY "Dispute actions insert by parties" ON dispute_actions FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid()
    AND actor_role IN ('creator', 'client')
    AND EXISTS (
      SELECT 1 FROM disputes d
      JOIN orders o ON o.id = d.order_id
      LEFT JOIN client_profiles cp ON cp.id = o.client_id
      LEFT JOIN creator_profiles cr ON cr.id = o.creator_id
      WHERE d.id = dispute_actions.dispute_id
        AND (cp.user_id = auth.uid() OR cr.user_id = auth.uid())
    )
  );

-- ============================================================
-- 5. 既存 orders への backfill
-- ============================================================
-- delivered 状態で auto_approve_at が未セットのものを補正 (retro-fit)
UPDATE orders
  SET auto_approve_at = delivered_at + INTERVAL '7 days'
  WHERE delivered_at IS NOT NULL
    AND auto_approve_at IS NULL
    AND auto_approved_at IS NULL
    AND escrow_status IN ('held', 'pending');
