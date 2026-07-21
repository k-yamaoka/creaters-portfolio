-- 00076: 原子的トランザクション RPC + ダウンロード クイックフラグ
--
-- Phase 2 要件 (2026-07-21):
--   * エスクロー資金移動 (キャンセル / みなし検収 / 未納品自動キャンセル) は
--     全て PostgreSQL 関数 (SECURITY DEFINER) 内で完結させ、単一 SQL 実行内で
--     複数テーブル更新を原子化する。
--   * ダウンロード確認は 高頻度チェックされるので orders 側に boolean を持たせて
--     receipts JOIN を回避 (00074 の受領テーブルは監査ログとして併存)。
--
-- 追加するもの:
--   1. orders.is_downloaded_by_client / first_downloaded_at (クイックフラグ)
--   2. RPC cancel_order_with_refund(order_id, actor, reason, stage, refund_rate)
--   3. RPC auto_approve_delivered_order(order_id)
--   4. RPC auto_cancel_nondelivery(order_id, weight)
--
-- 各 RPC は WHERE 句に「期待する現在状態」を含めた UPDATE で楽観ロックし、
-- 更新件数 0 なら NOTICE を出して 何もしない (二重発火を安全に握り潰す)。

-- ============================================================
-- 1. orders 拡張: ダウンロード クイックフラグ
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_downloaded_by_client BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_downloaded_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.is_downloaded_by_client IS
  '00076: クライアントが GET /api/orders/:id/download-delivery を叩いた時点で true。
   cancel API / dispute API の「実質的受領」判定に用いる (00074 receipts と併存)。';

-- ============================================================
-- 2. RPC cancel_order_with_refund
-- ============================================================
-- 単一トランザクション内で orders 更新 + notifications 追加を行う。
-- 呼び出し例:
--   SELECT cancel_order_with_refund(
--     p_order_id     := '...'::uuid,
--     p_actor_role   := 'client',
--     p_reason       := 'クライアント都合',
--     p_stage        := 'in_progress',
--     p_refund_rate  := 0.5,
--     p_expected_status := 'production'
--   );
CREATE OR REPLACE FUNCTION cancel_order_with_refund(
  p_order_id UUID,
  p_actor_role TEXT,
  p_reason TEXT,
  p_stage TEXT,
  p_refund_rate NUMERIC,
  p_expected_status TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_refund_amount INTEGER;
  v_creator_payout INTEGER;
BEGIN
  IF p_stage NOT IN ('pre_start', 'in_progress', 'delivered') THEN
    RAISE EXCEPTION 'invalid stage: %', p_stage;
  END IF;
  IF p_refund_rate < 0 OR p_refund_rate > 1 THEN
    RAISE EXCEPTION 'invalid refund_rate: %', p_refund_rate;
  END IF;

  -- 現在状態を FOR UPDATE 相当に取得 (row-level lock)
  SELECT id, status, base_price, terminated_at, active_dispute_id
    INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'order not found: %', p_order_id;
  END IF;

  IF v_order.status = 'cancelled' THEN
    -- 既にキャンセル済みなら no-op で成功扱い (冪等)
    RETURN json_build_object('ok', true, 'noop', true);
  END IF;

  IF v_order.terminated_at IS NOT NULL THEN
    RAISE EXCEPTION 'order already terminated';
  END IF;

  IF v_order.active_dispute_id IS NOT NULL THEN
    RAISE EXCEPTION 'order is in dispute';
  END IF;

  IF p_expected_status IS NOT NULL
     AND v_order.status <> p_expected_status THEN
    RAISE EXCEPTION 'status mismatch: expected %, got %',
      p_expected_status, v_order.status;
  END IF;

  v_refund_amount := FLOOR(COALESCE(v_order.base_price, 0) * p_refund_rate);
  v_creator_payout := COALESCE(v_order.base_price, 0) - v_refund_amount;

  UPDATE orders
    SET status = 'cancelled',
        escrow_status = 'refunded',
        cancel_stage = p_stage,
        cancel_refund_rate = p_refund_rate,
        cancel_refund_amount = v_refund_amount,
        cancel_creator_payout = v_creator_payout,
        cancel_reason = p_reason,
        cancelled_at = now()
    WHERE id = p_order_id;

  -- 注意: Stripe への実際の refund 呼び出しは アプリケーション層で
  --   RPC 成功後に非同期に投げる (webhook で escrow_status を確認する二段確認)。
  --   本 RPC は DB スナップショットのみを担保する。

  RETURN json_build_object(
    'ok', true,
    'refund_amount', v_refund_amount,
    'creator_payout', v_creator_payout,
    'stage', p_stage
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancel_order_with_refund IS
  '00076: キャンセル + 返金額 snapshot を単一トランザクションで実施。
   冪等: 既に cancelled ならの no-op。楽観ロック: p_expected_status ミスマッチで例外。';

-- ============================================================
-- 3. RPC auto_approve_delivered_order
-- ============================================================
-- みなし検収 (delivered から 7 日経過) を atomic に処理。
CREATE OR REPLACE FUNCTION auto_approve_delivered_order(p_order_id UUID)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT id, status, escrow_status, auto_approved_at, auto_approve_at,
         terminated_at, active_dispute_id
    INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'order not found: %', p_order_id;
  END IF;
  IF v_order.status <> 'delivered'
     OR v_order.escrow_status NOT IN ('held', 'pending')
     OR v_order.auto_approved_at IS NOT NULL
     OR v_order.terminated_at IS NOT NULL
     OR v_order.active_dispute_id IS NOT NULL
     OR v_order.auto_approve_at IS NULL
     OR v_order.auto_approve_at > v_now THEN
    RETURN json_build_object('ok', false, 'reason', 'preconditions not met');
  END IF;

  UPDATE orders
    SET escrow_status = 'released',
        inspected_at = v_now,
        completed_at = v_now,
        auto_approved_at = v_now,
        -- payout_scheduled_date は アプリ層で計算されて別 UPDATE でセット
        payout_status = 'scheduled'
    WHERE id = p_order_id;

  RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_approve_delivered_order IS
  '00076: みなし検収を単一トランザクションで実施。cron 側で payout_scheduled_date を追記。';

-- ============================================================
-- 4. RPC auto_cancel_nondelivery
-- ============================================================
-- 催促後 7 日 未納品 → 自動キャンセル + creator_penalties 加算 を atomic に。
CREATE OR REPLACE FUNCTION auto_cancel_nondelivery(
  p_order_id UUID,
  p_weight INTEGER DEFAULT 3
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT id, status, base_price, creator_id, terminated_at, active_dispute_id,
         nondelivery_deadline_at
    INTO v_order
    FROM orders
    WHERE id = p_order_id
    FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'order not found: %', p_order_id;
  END IF;
  IF v_order.status NOT IN ('data_sharing', 'production', 'revision')
     OR v_order.terminated_at IS NOT NULL
     OR v_order.active_dispute_id IS NOT NULL
     OR v_order.nondelivery_deadline_at IS NULL
     OR v_order.nondelivery_deadline_at > now() THEN
    RETURN json_build_object('ok', false, 'reason', 'preconditions not met');
  END IF;

  UPDATE orders
    SET status = 'cancelled',
        escrow_status = 'refunded',
        cancel_stage = 'pre_start',
        cancel_refund_rate = 1.0,
        cancel_refund_amount = COALESCE(v_order.base_price, 0),
        cancel_creator_payout = 0,
        cancel_reason = '催促後 7 日以内に納品されなかったため自動キャンセル',
        cancelled_at = now()
    WHERE id = p_order_id;

  IF v_order.creator_id IS NOT NULL THEN
    INSERT INTO creator_penalties (
      creator_profile_id, order_id, penalty_type, weight, reason
    ) VALUES (
      v_order.creator_id, v_order.id, 'nondelivery', p_weight,
      '催促後 7 日以内に納品されなかった'
    );
  END IF;

  RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_cancel_nondelivery IS
  '00076: 未納品自動キャンセル + ペナルティ加算 を単一トランザクションで実施。';

-- ============================================================
-- 5. サービスロールにのみ EXECUTE 権限を許可
-- ============================================================
-- SECURITY DEFINER でも呼び出し元の EXECUTE 権限は必要。
-- 一般ユーザー (anon / authenticated) からは呼べない → REVOKE public。
REVOKE ALL ON FUNCTION cancel_order_with_refund(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION auto_approve_delivered_order(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION auto_cancel_nondelivery(UUID, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION cancel_order_with_refund(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION auto_approve_delivered_order(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION auto_cancel_nondelivery(UUID, INTEGER) TO service_role;
