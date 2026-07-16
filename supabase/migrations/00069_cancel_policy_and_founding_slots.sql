-- 00069: キャンセルポリシー履歴カラム + ファウンディング クリエイター 50 名枠
--
-- ビジネス要件 (2026-07-15):
--   A-4  発注後キャンセル時の報酬:
--          - 着手前 (consultation / quoting / contract / data_sharing) → 0%
--          - 制作中 (production / revision)                             → 50%
--          - 納品後 (delivered)                                         → 100%
--        キャンセル履歴を orders 行に snapshot し、後から監査可能にする。
--
--   D-1  ファウンディング クリエイター 50 名枠:
--          creator_profiles INSERT 時に「現在の is_early_member=true 件数
--          が 50 未満」なら自動で is_early_member=true をセットする DB
--          トリガー。50 名到達後は false のまま (application 側から
--          個別に true に立てる余地は残す)。

-- ============================================================
-- 1. orders テーブルにキャンセル履歴カラム
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancel_stage TEXT
    CHECK (cancel_stage IN ('pre_start', 'in_progress', 'delivered')),
  ADD COLUMN IF NOT EXISTS cancel_refund_rate NUMERIC(3,2)
    CHECK (cancel_refund_rate >= 0.0 AND cancel_refund_rate <= 1.0),
  ADD COLUMN IF NOT EXISTS cancel_refund_amount INTEGER,
  ADD COLUMN IF NOT EXISTS cancel_creator_payout INTEGER,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.cancel_stage IS
  'キャンセル時点の段階分類。pre_start=着手前(0%クリエイター報酬), in_progress=制作中(50%), delivered=納品後(100%)。';
COMMENT ON COLUMN orders.cancel_refund_rate IS
  'クライアントへの返金率 (0.0〜1.0)。cancel_stage の逆数で決まる。';
COMMENT ON COLUMN orders.cancel_refund_amount IS
  'クライアントへの返金額 (円、整数)。cancel_refund_rate × base_price。';
COMMENT ON COLUMN orders.cancel_creator_payout IS
  'キャンセル時のクリエイター補償額 (円、整数)。base_price - cancel_refund_amount。';

-- ============================================================
-- 2. ファウンディング クリエイター 50 名枠 (D-1)
-- ============================================================
-- 定数 FOUNDING_SLOT_LIMIT はアプリケーション側 (src/lib/founding-creator.ts)
-- と DB トリガーの両方で 50 に固定。将来変更する場合は両方を同時に更新する。

CREATE OR REPLACE FUNCTION auto_flag_founding_creator()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- 明示的に is_early_member=true で INSERT された場合は尊重してカウントに含める
  IF NEW.is_early_member IS TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
    FROM creator_profiles
    WHERE is_early_member = true;

  -- 50 未満なら自動で早期メンバー特典を付与
  IF current_count < 50 THEN
    NEW.is_early_member := true;
    -- custom_fee_rate は NULL のままにして resolveCreatorFeeRate() の
    -- 分岐 "is_early_member=true → rate=0" に載せる
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_flag_founding_creator() IS
  '00069: creator_profiles INSERT 時に先着 50 名まで自動で is_early_member=true をセットする。';

DROP TRIGGER IF EXISTS trg_auto_flag_founding_creator ON creator_profiles;
CREATE TRIGGER trg_auto_flag_founding_creator
  BEFORE INSERT ON creator_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_flag_founding_creator();

-- ============================================================
-- 3. 先着カウント取得用の高速 view
-- ============================================================
-- COUNT(*) WHERE is_early_member=true を毎リクエスト叩くのは軽量だが、
-- 呼び出し側 (募集ページ) が SELECT しやすいように view で公開する。
-- (SECURITY: anon でも読める。数字だけなので個人情報漏洩リスクは無し)
CREATE OR REPLACE VIEW founding_creator_stats AS
  SELECT
    50 AS slot_limit,
    COUNT(*)::INTEGER AS filled,
    GREATEST(0, 50 - COUNT(*)::INTEGER) AS remaining,
    (COUNT(*) >= 50) AS is_full
  FROM creator_profiles
  WHERE is_early_member = true;

COMMENT ON VIEW founding_creator_stats IS
  '00069: ファウンディング クリエイター枠の現在数。募集ページ / registration UI で使用。';

-- 匿名クライアントからも数値だけ読めるように
GRANT SELECT ON founding_creator_stats TO anon, authenticated;
