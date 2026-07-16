-- 00070: handle_new_user() を防御的に書き直す
--
-- 背景 (2026-07-16):
--   00068 で拡張した handle_new_user() が auth.admin.createUser() を叩いた際に
--   Supabase から "Database error creating new user (unexpected_failure)" を返す
--   問題が発生した。auth.users の INSERT トリガーが例外を投げると Supabase Auth
--   側でロールバックされ、auth.users の作成自体が失敗する。
--
-- 修正方針:
--   1. user_type の NULL 判定を明示 (IS NULL チェックを先に置く)。旧実装は
--      "NULL NOT IN (...)" が NULL を返して IF が実行されず、meta_user_type が
--      NULL のまま creator_profiles.user_type (NOT NULL) に流れて失敗する経路
--      があった。
--   2. 各 INSERT を EXCEPTION ハンドラで包み、失敗しても RAISE WARNING に留めて
--      NEW を返す (auth.users の作成成功を優先する)。プロファイル生成に失敗
--      してもユーザーは後から /select-role や getCurrentUser 内のフォールバック
--      で復元可能。
--   3. avatar_url は元の 00001 スキーマに従い NULLIF() で空文字排除だけ行う。

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role TEXT;
  meta_user_type TEXT;
  meta_display_name TEXT;
  meta_avatar_url TEXT;
BEGIN
  meta_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'client');
  IF meta_role NOT IN ('creator', 'client', 'admin') THEN
    meta_role := 'client';
  END IF;

  meta_display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );

  -- 明示的な IS NULL / '' チェックを先に置いてから NOT IN を評価する
  meta_user_type := NULLIF(NEW.raw_user_meta_data->>'user_type', '');
  IF meta_user_type IS NULL OR meta_user_type NOT IN ('individual', 'corporate') THEN
    meta_user_type := 'individual';
  END IF;

  meta_avatar_url := NULLIF(NEW.raw_user_meta_data->>'avatar_url', '');

  -- ---- profiles ----
  BEGIN
    INSERT INTO profiles (id, email, display_name, role, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      meta_display_name,
      meta_role::user_role,
      meta_avatar_url
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profiles insert failed for %: % / %',
      NEW.id, SQLSTATE, SQLERRM;
  END;

  -- ---- role-specific profile ----
  IF meta_role = 'creator' THEN
    BEGIN
      INSERT INTO creator_profiles (
        user_id, bio, video_lengths, strengths, genres,
        years_of_experience, user_type, is_searchable
      )
      VALUES (
        NEW.id, '', ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[],
        0, meta_user_type, false
      )
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: creator_profiles insert failed for %: % / %',
        NEW.id, SQLSTATE, SQLERRM;
    END;
  ELSIF meta_role = 'client' THEN
    BEGIN
      INSERT INTO client_profiles (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: client_profiles insert failed for %: % / %',
        NEW.id, SQLSTATE, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS
  '00070 再定義: 各 INSERT を EXCEPTION でラップし、部分失敗でも auth.users の作成をブロックしない。user_type NULL 分岐を明示化。';

-- ============================================================
-- 参考: 00069 の auto_flag_founding_creator も同様に防御化
-- ============================================================
-- creator_profiles INSERT 時にカウント SELECT が何らかの理由で失敗した場合
-- (view / index 破損等) でも INSERT 自体は成功させる。
CREATE OR REPLACE FUNCTION auto_flag_founding_creator()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF NEW.is_early_member IS TRUE THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT COUNT(*) INTO current_count
      FROM creator_profiles
      WHERE is_early_member = true;
    IF current_count < 50 THEN
      NEW.is_early_member := true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'auto_flag_founding_creator: count check failed: % / %',
      SQLSTATE, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
