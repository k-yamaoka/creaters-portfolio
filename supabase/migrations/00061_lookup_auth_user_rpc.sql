-- 2026-06-17: auth.admin.listUsers / REST /admin/users が本プロジェクトで
-- "Database error finding users" を起こすため、seed スクリプトから auth.users を
-- email で引けるよう SECURITY DEFINER の RPC を追加。
-- service_role からしか実行できないようにする。

CREATE OR REPLACE FUNCTION public.admin_lookup_auth_user_by_email(p_email TEXT)
RETURNS TABLE (id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.admin_lookup_auth_user_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_lookup_auth_user_by_email(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_lookup_auth_user_by_email(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_lookup_auth_user_by_email(TEXT) TO service_role;

COMMENT ON FUNCTION public.admin_lookup_auth_user_by_email(TEXT) IS
  'seed-sample-works.mjs から auth.users を email 引きするための一時 RPC。本番運用では不要。';
