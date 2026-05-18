-- ============================================
-- 退会済みメール blocklist に 30 日の猶予期間を設定
--
-- 仕様変更:
--   - 退会後 30 日以内は再登録不可 (これまで通り)
--   - 30 日以上経過した行は SELECT で見えなくなり、再登録可能になる
--
-- 実装:
--   - SELECT policy を deleted_at + 30 days < now() の行は返さないように更新
--   - deleted_at の検索を速くするため部分インデックスを追加
-- ============================================

DROP POLICY IF EXISTS "Self can check blocked email" ON deleted_account_emails;
CREATE POLICY "Self can check blocked email"
  ON deleted_account_emails FOR SELECT
  USING (
    auth.jwt() IS NOT NULL
    AND email_lower = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND deleted_at > now() - interval '30 days'
  );

-- 30 日以内の行だけを引く検索用インデックス
DROP INDEX IF EXISTS idx_deleted_account_emails_recent;
CREATE INDEX idx_deleted_account_emails_recent
  ON deleted_account_emails (email_lower, deleted_at DESC);
