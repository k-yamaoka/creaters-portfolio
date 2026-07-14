-- 00064: クリエイター アーリーメンバー特典 + カスタム手数料率
--
-- ビジネス要件:
--   1. クリエイター向けシステム手数料は当面 0% (立ち上げ期の優遇)
--   2. 立ち上げ期に登録したユーザーは「アーリーメンバー (創設メンバー)」として
--      恒久 0% を保証する
--
-- スキーマ:
--   - is_early_member: 立ち上げ期の登録者を true にマーク (デフォルト true)
--     → 一定期間後、以降の新規登録に対しては is_early_member=false でデフォルト化する
--       運用に切り替える (アプリ側で登録トリガーの default を変更)
--   - custom_fee_rate: ユーザー個別の特別手数料率 (0.0 〜 0.1, 0 〜 10%)
--     → NULL のときは lib/creator-fee.ts の DEFAULT_CREATOR_FEE_RATE を適用

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS is_early_member BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS custom_fee_rate NUMERIC(4, 3);

-- 個別料率は 0% 以上、10% 以下に制限 (将来的な有料化の上限を仕様に固定)
-- 2026-07-14: 部分適用済 DB での再実行 (constraint already exists) 対策として
-- DO ブロックで冪等化。ADD CONSTRAINT IF NOT EXISTS は Postgres 15+ 依存で
-- Supabase 環境依存を避けるため pg_constraint 参照方式に。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'creator_profiles_custom_fee_rate_range'
      AND conrelid = 'creator_profiles'::regclass
  ) THEN
    ALTER TABLE creator_profiles
      ADD CONSTRAINT creator_profiles_custom_fee_rate_range
      CHECK (custom_fee_rate IS NULL OR (custom_fee_rate >= 0 AND custom_fee_rate <= 0.1));
  END IF;
END
$$;

COMMENT ON COLUMN creator_profiles.is_early_member IS
  'アーリーメンバー (創設メンバー) フラグ。true = 手数料を恒久 0% とする特別待遇。ローンチ後の一定期間で新規登録のデフォルトを false に切替予定。';

COMMENT ON COLUMN creator_profiles.custom_fee_rate IS
  'ユーザー個別の特別手数料率 (0.0 〜 0.1)。NULL のときは lib/creator-fee.ts の DEFAULT_CREATOR_FEE_RATE を適用。is_early_member=true のときは 0% で上書きされる。';

-- 既存クリエイターは全員アーリーメンバー扱いに (立ち上げ期の登録者なので)
UPDATE creator_profiles SET is_early_member = true WHERE is_early_member IS NULL;

CREATE INDEX IF NOT EXISTS idx_creator_profiles_early_member
  ON creator_profiles(is_early_member)
  WHERE is_early_member = true;
