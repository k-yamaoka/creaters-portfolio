-- 00073: STEP1 催促ガード + 2 年データ保持 + 未納品期限
--
-- 設計書 v1 §1.1 / §2.3 / §3-C 対応 (2026-07-21):
--   * orders.first_reminder_sent_at   STEP1 催促の証跡。dispute open 時に必須
--   * orders.nondelivery_deadline_at  催促後 +7 日、超過で cron が全額返金
--   * orders.data_retention_until     取引終了時に +2 年、cron の物理削除ガード
--   * orders.soft_deleted_at          論理削除フラグ (物理削除は retention 経過後のみ)
--   * messages.is_deleted / retention_until  同上の 2 年保持を messages にも
--
-- どのカラムも既存挙動に影響しない (default NULL / false)。

-- ============================================================
-- 1. orders 拡張
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS first_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nondelivery_deadline_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS soft_deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.first_reminder_sent_at IS
  'STEP1 催促 (POST /api/orders/:id/remind) の初回発火時刻。dispute open API は
   NULL のときリクエストを拒否 (仕様 §2.3 順序ガード)。';
COMMENT ON COLUMN orders.nondelivery_deadline_at IS
  '未納品自動キャンセル期限。催促発火時に +7 日でセット。cron が過ぎたら
   status=cancelled + escrow refunded + penalty 追加。';
COMMENT ON COLUMN orders.data_retention_until IS
  '取引終了 (completed / cancelled / terminated) 時に +2 年でセット。
   物理削除 cron はこの日付を過ぎた行だけ削除対象にする。';
COMMENT ON COLUMN orders.soft_deleted_at IS
  '論理削除フラグ。UI 一覧では non-null を除外、管理画面と retention cron からのみ参照。';

-- 既存の completed / cancelled / terminated 行に retention をレトロフィット
UPDATE orders
  SET data_retention_until = COALESCE(
    completed_at,
    cancelled_at,
    terminated_at,
    updated_at
  ) + INTERVAL '2 years'
  WHERE data_retention_until IS NULL
    AND (
      status IN ('cancelled', 'delivered')
      OR terminated_at IS NOT NULL
      OR cancelled_at IS NOT NULL
    );

-- ============================================================
-- 2. messages 拡張 (論理削除 + 保持期限)
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ;

COMMENT ON COLUMN messages.is_deleted IS
  '論理削除フラグ (UI 非表示)。物理削除は retention_until 経過後の cron でのみ実行。';
COMMENT ON COLUMN messages.retention_until IS
  '2 年保持期限。取引終了時に order.data_retention_until と同期。NULL は無期限保持扱い。';

CREATE INDEX IF NOT EXISTS idx_messages_retention_purge
  ON messages(retention_until)
  WHERE retention_until IS NOT NULL AND is_deleted = false;

-- ============================================================
-- 3. 取引終了 trigger — retention_until を自動セット
-- ============================================================
-- orders の cancelled_at / terminated_at / (delivered + escrow_status=released)
-- が新たにセットされたら、data_retention_until を +2 年で埋める。
-- 既存 trigger set_order_auto_approve_at と共存 (BEFORE UPDATE で同じ行を触る)。
CREATE OR REPLACE FUNCTION set_order_retention_until()
RETURNS TRIGGER AS $$
DECLARE
  end_ts TIMESTAMPTZ;
BEGIN
  -- 終了判定: cancelled / terminated / (delivered + escrow released)
  IF NEW.data_retention_until IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.terminated_at IS NOT NULL AND OLD.terminated_at IS NULL THEN
    end_ts := NEW.terminated_at;
  ELSIF NEW.cancelled_at IS NOT NULL AND OLD.cancelled_at IS NULL THEN
    end_ts := NEW.cancelled_at;
  ELSIF NEW.escrow_status = 'released'
        AND OLD.escrow_status <> 'released' THEN
    end_ts := COALESCE(NEW.completed_at, now());
  ELSE
    RETURN NEW;
  END IF;

  NEW.data_retention_until := end_ts + INTERVAL '2 years';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_retention_until ON orders;
CREATE TRIGGER trg_orders_retention_until
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_retention_until();

-- ============================================================
-- 4. messages retention 同期 trigger
-- ============================================================
-- orders.data_retention_until がセット / 変更されたら、
-- 同 order に紐づく messages の retention_until も同じ値に揃える。
CREATE OR REPLACE FUNCTION sync_messages_retention()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_retention_until IS DISTINCT FROM OLD.data_retention_until
     AND NEW.data_retention_until IS NOT NULL THEN
    UPDATE messages
      SET retention_until = NEW.data_retention_until
      WHERE order_id = NEW.id
        AND (retention_until IS NULL OR retention_until <> NEW.data_retention_until);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_sync_msg_retention ON orders;
CREATE TRIGGER trg_orders_sync_msg_retention
  AFTER UPDATE OF data_retention_until ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_messages_retention();
