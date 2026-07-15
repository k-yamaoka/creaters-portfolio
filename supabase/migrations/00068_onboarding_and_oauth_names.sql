-- 00068: オンボーディング状態 + OAuth プロバイダから取得した名前の
--        自動反映を実装する。
--
-- ビジネス要件 (2026-07-15):
--   - Google / X 等の OAuth 経由でサインアップした場合、プロバイダから
--     取得した `full_name` / `name` を profiles.display_name に自動反映
--   - 登録直後にウィザードで初回ポートフォリオを登録するフローを追加
--     するため、完了時刻を profiles.onboarding_completed_at に記録する
--   - 中断ユーザー (登録だけしてポートフォリオを 1 点も持たない状態)
--     を判定するため、auth callback で以下 3 条件のとき /onboarding へ
--     リダイレクトする:
--       role='creator' AND onboarding_completed_at IS NULL
--       AND creator_profiles に紐づく portfolio_items が 0 件
--
-- スキーマ変更 (非破壊):
--   1. profiles.onboarding_completed_at TIMESTAMPTZ NULL (新規)
--   2. handle_new_user() を再定義し、OAuth の full_name / name を拾う

-- ============================================================
-- 1. onboarding_completed_at カラム
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.onboarding_completed_at IS
  '登録直後のウィザード (初回ポートフォリオ投稿等) を完了した時刻。NULL の間は auth callback から /onboarding へリダイレクトされる。';

-- 既存ユーザーはウィザード対象外扱い (再度見せない)。
-- 新規登録ユーザーだけ NULL のまま残り、初回投稿完了時に埋まる。
UPDATE profiles
  SET onboarding_completed_at = created_at
  WHERE onboarding_completed_at IS NULL;

-- ============================================================
-- 2. handle_new_user 再定義: OAuth プロバイダの氏名を拾う
-- ============================================================
-- 00067 で追加した user_type 反映ロジックを維持しつつ、
-- Google (full_name) / GitHub (name) / メタ標準 (display_name)
-- のいずれから来ても display_name を埋められるようにする。
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role TEXT;
  meta_user_type TEXT;
  meta_display_name TEXT;
BEGIN
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  -- 優先順位:
  --   1. 明示的な display_name (メール登録フォーム)
  --   2. OAuth プロバイダの full_name / name (Google/GitHub 等)
  --   3. メール @ 前
  meta_display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(NEW.email, '@', 1)
  );
  meta_user_type := NEW.raw_user_meta_data->>'user_type';
  IF meta_user_type NOT IN ('individual', 'corporate') THEN
    meta_user_type := 'individual';
  END IF;

  INSERT INTO profiles (id, email, display_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    meta_display_name,
    meta_role::user_role,
    -- Google/GitHub の avatar_url があればそのまま反映 (nullable)
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  IF meta_role = 'creator' THEN
    INSERT INTO creator_profiles (
      user_id, bio, video_lengths, strengths, genres,
      years_of_experience, user_type, is_searchable
    )
    VALUES (
      NEW.id, '', ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[],
      0, meta_user_type, false
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF meta_role = 'client' THEN
    INSERT INTO client_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS
  '00068 再定義: OAuth プロバイダの full_name / name / avatar_url も profiles に反映。role=creator のとき creator_profiles を user_type 付きで作成。';

-- ============================================================
-- 3. Nullability 監査 (必須は display_name/email/role のみ)
-- ============================================================
-- profiles.bio は DEFAULT '' の NOT NULL。UX 上は "任意" だが、
-- 空文字を許容する既存挙動を維持 (バリデーションは UI 側でスキップ可)。
-- avatar_url / cover_image_url / social_links / location などは既に nullable。
-- creator_profiles.bio も DEFAULT '' で "後から追加可能" を担保済み。
-- 追加のスキーマ変更は不要。
