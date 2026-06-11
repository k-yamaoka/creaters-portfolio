-- 00053: クリエイタープロフィールの閲覧カウンター
--
-- ダッシュボード ④ アナリティクスで「プロフィール閲覧数」を出すための列。
-- /creators/[id] が表示されたときに +1 する (自分自身による閲覧は除外する)。
-- DEFAULT 0 + NOT NULL なので、既存行はゼロから始まる。

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS profile_views BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN creator_profiles.profile_views IS
  'プロフィール累計閲覧数。/creators/[id] 表示時にインクリメント。自分自身は除外。';

-- 原子的にインクリメントするための RPC。
-- viewer_user_id を渡し、viewer がそのプロフィールの user_id と一致する場合は
-- 加算しない (自己閲覧によるインフレ防止)。
CREATE OR REPLACE FUNCTION increment_creator_profile_view(
  p_creator_id UUID,
  p_viewer_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  SELECT user_id INTO v_owner_id FROM creator_profiles WHERE id = p_creator_id;
  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;
  -- viewer が未ログイン (null) なら加算、ログインしていて自分自身でなければ加算
  IF p_viewer_user_id IS NULL OR p_viewer_user_id != v_owner_id THEN
    UPDATE creator_profiles
      SET profile_views = COALESCE(profile_views, 0) + 1
      WHERE id = p_creator_id;
  END IF;
END;
$$;
