-- 00077: アカウント停止 (§7) + 運営裁定 ruling (§6)
--
-- 監査 §B 対応 (2026-07-21):
--   §7 未納品を繰返すクリエイターの自動停止:
--     profiles.suspended_at / suspension_reason を追加
--     既存 is_active カラム + middleware.ts の強制ログアウト を利用
--   §6 運営裁定の 一部返金 / 再制作 / 全額返金 の記録:
--     disputes.ruling_type / ruling_refund_rate を追加

-- ============================================================
-- 1. profiles にサスペンション情報
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

COMMENT ON COLUMN profiles.suspended_at IS
  'アカウント停止の実行時刻。is_active=false と併用。手動 (admin) or 自動 (cron) 起因を問わず。';
COMMENT ON COLUMN profiles.suspension_reason IS
  'サスペンション理由 (システム: "未納品繰返しによる自動停止 (score=XX)" / 手動: admin 記入)';

CREATE INDEX IF NOT EXISTS idx_profiles_suspended
  ON profiles(suspended_at) WHERE suspended_at IS NOT NULL;

-- ============================================================
-- 2. disputes に ruling (裁定結果) 情報
-- ============================================================
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS ruling_type TEXT
    CHECK (ruling_type IN (
      'partial_refund',   -- 一部返金 (rate 指定)
      'full_refund',      -- 全額返金 (仕様未達 / 未納品確定)
      'reproduction',     -- 再制作 (revision に戻す)
      'no_action',        -- 申告却下 (証拠不十分等)
      'as_is'             -- 満額支払 (クリエイター有利判断)
    )),
  ADD COLUMN IF NOT EXISTS ruling_refund_rate NUMERIC(3,2)
    CHECK (ruling_refund_rate >= 0.0 AND ruling_refund_rate <= 1.0),
  ADD COLUMN IF NOT EXISTS ruling_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN disputes.ruling_type IS
  '運営裁定の結果。resolution_summary はユーザー向け要約、内部詳細は internal_note。';
COMMENT ON COLUMN disputes.ruling_refund_rate IS
  'partial_refund / full_refund のとき使用する 返金率 (クライアントへの返金割合)。';

-- ============================================================
-- 3. RPC: 未納品ペナルティ蓄積で自動停止
-- ============================================================
-- 閾値: 直近 12 ヶ月の penalty_score >= 15 (nondelivery 5 回相当)
-- 呼び出し: cron が全 creator_profiles を scan して呼び出す (単位テスト可能に
-- するため RPC 化)
CREATE OR REPLACE FUNCTION auto_suspend_repeat_offender(
  p_creator_profile_id UUID,
  p_threshold INTEGER DEFAULT 15
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_score INTEGER;
  v_current_active BOOLEAN;
BEGIN
  SELECT user_id INTO v_user_id
    FROM creator_profiles
    WHERE id = p_creator_profile_id;
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ok', false, 'reason', 'creator not found');
  END IF;

  SELECT COALESCE(SUM(weight), 0)::INTEGER INTO v_score
    FROM creator_penalties
    WHERE creator_profile_id = p_creator_profile_id
      AND created_at > now() - INTERVAL '12 months';

  IF v_score < p_threshold THEN
    RETURN json_build_object('ok', false, 'reason', 'below threshold', 'score', v_score);
  END IF;

  -- 既に is_active=false ならスキップ
  SELECT is_active INTO v_current_active
    FROM profiles
    WHERE id = v_user_id
    FOR UPDATE;
  IF v_current_active = false THEN
    RETURN json_build_object('ok', false, 'reason', 'already suspended');
  END IF;

  UPDATE profiles
    SET is_active = false,
        suspended_at = now(),
        suspension_reason = format(
          '未納品などのペナルティ蓄積による自動停止 (直近12ヶ月 penalty_score=%s)',
          v_score
        )
    WHERE id = v_user_id;

  RETURN json_build_object('ok', true, 'score', v_score, 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_suspend_repeat_offender IS
  '00077: 未納品ペナルティ score が閾値超過なら profiles.is_active=false + suspended_at を atomic に立てる。middleware が次アクセス時に強制ログアウト。';

REVOKE ALL ON FUNCTION auto_suspend_repeat_offender(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auto_suspend_repeat_offender(UUID, INTEGER) TO service_role;

-- ============================================================
-- 4. RPC: 運営裁定 ruling を atomic に確定
-- ============================================================
-- 挙動:
--   1. dispute を resolved に更新 (ruling_type / rate / summary / by)
--   2. orders.active_dispute_id を NULL に戻す
--   3. ruling_type に応じて 追加処理:
--        partial_refund / full_refund → cancel_order_with_refund
--        reproduction → status を revision に戻す
--        no_action / as_is → orders は触らない (dispute を閉じるだけ)
--   4. dispute_actions に public な "ruling" 履歴
CREATE OR REPLACE FUNCTION resolve_dispute_with_ruling(
  p_dispute_id UUID,
  p_admin_user_id UUID,
  p_ruling_type TEXT,
  p_ruling_refund_rate NUMERIC,
  p_resolution_summary TEXT,
  p_internal_note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_dispute RECORD;
  v_order RECORD;
  v_cancel_result JSON;
BEGIN
  IF p_ruling_type NOT IN (
    'partial_refund', 'full_refund', 'reproduction', 'no_action', 'as_is'
  ) THEN
    RAISE EXCEPTION 'invalid ruling_type: %', p_ruling_type;
  END IF;

  SELECT id, order_id, admin_status
    INTO v_dispute
    FROM disputes
    WHERE id = p_dispute_id
    FOR UPDATE;
  IF v_dispute IS NULL THEN
    RAISE EXCEPTION 'dispute not found: %', p_dispute_id;
  END IF;
  IF v_dispute.admin_status = 'resolved' THEN
    RETURN json_build_object('ok', false, 'reason', 'already resolved');
  END IF;

  SELECT id, status, terminated_at
    INTO v_order
    FROM orders
    WHERE id = v_dispute.order_id
    FOR UPDATE;

  -- 1. ruling_type ごとの実処理
  IF p_ruling_type = 'partial_refund' OR p_ruling_type = 'full_refund' THEN
    IF p_ruling_refund_rate IS NULL
       OR p_ruling_refund_rate < 0
       OR p_ruling_refund_rate > 1 THEN
      RAISE EXCEPTION 'ruling_refund_rate must be between 0 and 1 for %', p_ruling_type;
    END IF;
    -- cancel を経由して原子的に snapshot 記録 (stage は現在ステータスから導出)
    -- cancel_order_with_refund の p_stage は 'in_progress' 固定 (裁定ケース)
    v_cancel_result := cancel_order_with_refund(
      p_order_id := v_order.id,
      p_actor_role := 'admin',
      p_reason := format('運営裁定: %s (%s)', p_ruling_type, p_resolution_summary),
      p_stage := 'in_progress',
      p_refund_rate := p_ruling_refund_rate,
      p_expected_status := NULL
    );
  ELSIF p_ruling_type = 'reproduction' THEN
    -- revision に戻す (status のみ、escrow は保持)
    UPDATE orders
      SET status = 'revision'
      WHERE id = v_order.id
        AND status NOT IN ('cancelled', 'delivered');
  END IF;
  -- no_action / as_is は orders 側を触らない

  -- 2. dispute を resolved に更新
  UPDATE disputes
    SET admin_status = 'resolved',
        resolved_at = now(),
        reviewed_by = p_admin_user_id,
        reviewed_at = now(),
        ruling_type = p_ruling_type,
        ruling_refund_rate = p_ruling_refund_rate,
        ruling_by = p_admin_user_id,
        resolution_summary = p_resolution_summary,
        internal_note = COALESCE(p_internal_note, internal_note)
    WHERE id = p_dispute_id;

  -- 3. orders.active_dispute_id を解除
  UPDATE orders
    SET active_dispute_id = NULL
    WHERE id = v_order.id
      AND active_dispute_id = p_dispute_id;

  -- 4. 公開履歴
  INSERT INTO dispute_actions (
    dispute_id, actor_user_id, actor_role, action_type, is_public, note
  ) VALUES (
    p_dispute_id, p_admin_user_id, 'admin', 'ruling', true,
    format('裁定: %s / %s', p_ruling_type, p_resolution_summary)
  );

  RETURN json_build_object(
    'ok', true,
    'ruling_type', p_ruling_type,
    'cancel_result', v_cancel_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION resolve_dispute_with_ruling IS
  '00077: 運営裁定を atomic に確定。ruling_type に応じて cancel/revision/no-op を実行し、dispute を resolved に + orders.active_dispute_id を解除。';

REVOKE ALL ON FUNCTION resolve_dispute_with_ruling(
  UUID, UUID, TEXT, NUMERIC, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_dispute_with_ruling(
  UUID, UUID, TEXT, NUMERIC, TEXT, TEXT
) TO service_role;
