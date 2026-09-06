-- 00089: RLS-001 テストで検出された PII 漏洩の根治
--
-- 事故:
--   RLS-001 検証 (anon key で /rest/v1/profiles?select=email) の結果、
--   profiles.email / phone が anon から丸見えだった (0.5 秒で全ユーザー
--   の email が抜き取れる状態)。
--
-- 原因:
--   00082 では REVOKE SELECT (email, phone) を発行したが、Supabase の
--   デフォルトで anon / authenticated に「テーブル全体の SELECT」が
--   GRANT されているため、Postgres 仕様上「テーブル全体 SELECT が
--   存在すると、列単位 REVOKE は無効化される」に該当し 00082 が
--   一切効いていなかった。
--
-- 対策 (今回):
--   1. profiles / client_profiles / creator_profiles のテーブル全体
--      SELECT を anon, authenticated から REVOKE する
--   2. 公開して問題ない列 のみ 列単位で GRANT する
--   3. own-row の email 参照は 引き続き auth.users (supabase.auth.getUser)
--      経由で解決 (getCurrentUser を別コミットで修正)
--   4. サーバ側 (admin export / notify-external / admin/users) は
--      service_role client を使うので影響なし (BYPASSRLS + 全列 GRANT
--      保持)
--
-- ロールバック手順:
--   GRANT SELECT ON profiles TO anon, authenticated;
--   GRANT SELECT ON client_profiles TO anon, authenticated;
--   GRANT SELECT ON creator_profiles TO anon, authenticated;

-- ============================================================
-- 1) profiles: PII (email / phone / line_user_id / notify_*) 除外
-- ============================================================
REVOKE SELECT ON TABLE profiles FROM anon, authenticated;

GRANT SELECT (
  id,
  role,
  display_name,
  avatar_url,
  is_verified,
  is_active,
  created_at,
  updated_at,
  suspended_at,
  suspension_reason
) ON TABLE profiles TO anon, authenticated;

-- ============================================================
-- 2) client_profiles: stripe_customer_id / 通知系を除外
-- ============================================================
REVOKE SELECT ON TABLE client_profiles FROM anon, authenticated;

GRANT SELECT (
  id,
  user_id,
  company_name,
  company_url,
  industry,
  logo_url,
  company_description,
  invoice_registration_number,
  created_at,
  updated_at
) ON TABLE client_profiles TO anon, authenticated;

-- ============================================================
-- 3) creator_profiles: stripe_account_id / 内部フラグを除外
-- ============================================================
--   保有情報が多いテーブルなので、公開して問題ない (creator ページで
--   実際に表示している) 列だけを列挙する。custom_fee_rate は本人 UI
--   に出す値なので self 参照 は select("*") 相当のサーバ側 (service_role)
--   経由でのみ取得する。
REVOKE SELECT ON TABLE creator_profiles FROM anon, authenticated;

GRANT SELECT (
  id,
  user_id,
  bio,
  video_lengths,
  strengths,
  ai_tools,
  genres,
  location,
  years_of_experience,
  rating,
  review_count,
  profile_views,
  cover_image_url,
  availability_status,
  typical_first_draft_days,
  social_links,
  minimum_order_amount,
  is_early_member,
  is_searchable,
  user_type,
  custom_fee_rate,
  created_at,
  updated_at
) ON TABLE creator_profiles TO anon, authenticated;

-- ============================================================
-- 4) service_role には従来通り全列アクセスを明示保証 (安全弁)
-- ============================================================
GRANT SELECT ON TABLE profiles TO service_role;
GRANT SELECT ON TABLE client_profiles TO service_role;
GRANT SELECT ON TABLE creator_profiles TO service_role;

-- 00082 で追加した service_role 個別列 GRANT は不要 (テーブル全体で
-- カバーされる) が、互換のためそのまま残す。冪等。
