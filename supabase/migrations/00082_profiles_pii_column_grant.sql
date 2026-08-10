-- 2026-08-10: profiles テーブルの PII (email / phone) が anon key で 全公開だった。
-- 個人情報保護法違反レベルのリスクだったため、列単位 GRANT で塞ぐ。
--
-- 対策: anon / authenticated から SELECT (email, phone) を REVOKE する。
--   PostgREST の select("*") は 権限のある列だけを返すため、既存の
--   select("*") 呼び出しは 403 にはならず email/phone だけが除外される。
--   own row の email は Supabase Auth の auth.users.email から
--   supabase.auth.getUser() で従来通り取得可能。
--   通知経路 (notify-external / admin-notify) は service_role client
--   経由に変更してあるので影響なし。
--
-- ロールバック: GRANT SELECT (email, phone) ON profiles TO anon, authenticated;

REVOKE SELECT (email, phone) ON profiles FROM anon, authenticated;

-- service_role は BYPASSRLS で全列アクセス可能 (デフォルト)、明示宣言は不要。
-- ただしドキュメント目的で残す:
GRANT SELECT (email, phone) ON profiles TO service_role;

-- client_profiles / creator_profiles の stripe_* も 直接的攻撃価値は低いが
-- 露出する意義もないので同様に絞る。
REVOKE SELECT (stripe_customer_id) ON client_profiles FROM anon, authenticated;
REVOKE SELECT (stripe_account_id) ON creator_profiles FROM anon, authenticated;
GRANT SELECT (stripe_customer_id) ON client_profiles TO service_role;
GRANT SELECT (stripe_account_id) ON creator_profiles TO service_role;
