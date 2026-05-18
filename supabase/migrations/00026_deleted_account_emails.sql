-- ============================================
-- 退会済みメールアドレスのブロックリスト
--
-- アカウント削除後に同じメール (Google / LINE OAuth を含む) で
-- 再ログインや再登録ができてしまう挙動を防ぐためのテーブル。
-- 物理削除のみで再利用させる方針なら、このテーブルを使わずに済む。
-- ============================================

CREATE TABLE IF NOT EXISTS deleted_account_emails (
  email_lower TEXT PRIMARY KEY,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

-- RLS: 書き込みは service_role のみ。
-- 読み取りは「自分自身の email がブロック対象か」だけ確認できれば十分なので、
-- 認証済みユーザーが email_lower = lower(自分のメール) の行に限り SELECT を許可。
-- これにより middleware で blocklist 判定ができる一方、列挙はできない。
ALTER TABLE deleted_account_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Self can check blocked email" ON deleted_account_emails;
CREATE POLICY "Self can check blocked email"
  ON deleted_account_emails FOR SELECT
  USING (
    auth.jwt() IS NOT NULL
    AND email_lower = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "Nobody can write deleted_account_emails" ON deleted_account_emails;
CREATE POLICY "Nobody can write deleted_account_emails"
  ON deleted_account_emails FOR ALL USING (false);
