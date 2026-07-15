-- 00067: クリエイター アカウント種別 + プロフィール公開条件
--
-- ビジネス要件 (2026-07-14):
--   1. アカウント種別: 個人 (individual) / 法人 (corporate) を選択可能に
--   2. プロフィール公開条件: ポートフォリオを 1 点以上登録するまで
--      企業側の検索・一覧に表示しない (is_searchable=false デフォルト)
--   3. ポートフォリオの INSERT / DELETE で is_searchable を自動更新
--      (trigger で作品数を判定)

-- ============================================================
-- 1. カラム追加
-- ============================================================
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS user_type TEXT
    CHECK (user_type IN ('individual', 'corporate'))
    NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS is_searchable BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN creator_profiles.user_type IS
  'クリエイターの事業形態: individual (個人・フリーランス) / corporate (法人)。登録時にラジオボタンで選択。';
COMMENT ON COLUMN creator_profiles.is_searchable IS
  '企業側の検索・一覧に表示するかのフラグ。ポートフォリオ 1 点以上で自動 true、0 点で自動 false。trigger 00067 で portfolio_items の INSERT/DELETE を監視。';

-- 検索クエリを軽量化: 公開クリエイターだけを引く用の部分インデックス
CREATE INDEX IF NOT EXISTS idx_creator_profiles_searchable
  ON creator_profiles(is_searchable)
  WHERE is_searchable = true;

-- ============================================================
-- 2. 既存レコード backfill
-- ============================================================
-- 既存クリエイターは portfolio_items の有無で is_searchable を確定
UPDATE creator_profiles cp
  SET is_searchable = EXISTS (
    SELECT 1 FROM portfolio_items pi WHERE pi.creator_id = cp.id
  )
  WHERE is_searchable = false;

-- ============================================================
-- 3. Trigger: portfolio_items INSERT/DELETE で is_searchable を自動更新
-- ============================================================
-- ロジック:
--   INSERT 時: 対象 creator の is_searchable を true (作品が 1 点以上に増えた)
--   DELETE 時: 残作品数を数え、0 なら false, 1+ なら true (ちょうど 0 になった時のみ更新)
--   UPDATE (creator_id 変更) は非対応 (通常発生しない前提)

CREATE OR REPLACE FUNCTION update_creator_is_searchable()
RETURNS TRIGGER AS $$
DECLARE
  target_creator_id UUID;
  remaining_count INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_creator_id := NEW.creator_id;
    -- 1 点以上あれば true (少なくとも今回の 1 点で条件成立)
    UPDATE creator_profiles
      SET is_searchable = true
      WHERE id = target_creator_id
        AND is_searchable = false;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    target_creator_id := OLD.creator_id;
    SELECT COUNT(*) INTO remaining_count
      FROM portfolio_items
      WHERE creator_id = target_creator_id;
    -- 残作品 0 なら false に落とす。1+ なら true に保つ
    UPDATE creator_profiles
      SET is_searchable = (remaining_count > 0)
      WHERE id = target_creator_id
        AND is_searchable <> (remaining_count > 0);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_creator_is_searchable() IS
  'portfolio_items INSERT/DELETE を受けて creator_profiles.is_searchable を自動更新するトリガー関数。00067 で追加。';

DROP TRIGGER IF EXISTS trg_portfolio_items_is_searchable ON portfolio_items;
CREATE TRIGGER trg_portfolio_items_is_searchable
  AFTER INSERT OR DELETE ON portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_is_searchable();

-- ============================================================
-- 4. handle_new_user 拡張: 登録時 metadata の user_type を creator_profiles に反映
-- ============================================================
-- 既存 handle_new_user は profiles 行のみ作成していた。
-- /register で email signup した場合、その後 /select-role を経由せず
-- 直接 dashboard に到達する動線があり、そこで creator_profiles が無く
-- 混乱するケースが起きていた。ここで role=creator/client のとき
-- 対応する role-specific profile 行も同時に作成する。
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role TEXT;
  meta_user_type TEXT;
  meta_display_name TEXT;
BEGIN
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  meta_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  meta_user_type := NEW.raw_user_meta_data->>'user_type';
  IF meta_user_type NOT IN ('individual', 'corporate') THEN
    meta_user_type := 'individual';
  END IF;

  INSERT INTO profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    meta_display_name,
    meta_role::user_role
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

-- creator_profiles.user_id / client_profiles.user_id に UNIQUE がある前提
-- (00001_initial_schema.sql で REFERENCES profiles(id) の設計だが UNIQUE も
--  必要なので念のため IF NOT EXISTS で保証しておく)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'creator_profiles_user_id_key'
      AND conrelid = 'creator_profiles'::regclass
  ) THEN
    ALTER TABLE creator_profiles ADD CONSTRAINT creator_profiles_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_profiles_user_id_key'
      AND conrelid = 'client_profiles'::regclass
  ) THEN
    ALTER TABLE client_profiles ADD CONSTRAINT client_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
