-- 2026-06-17: 00059 で showcase@ailier.app の auth.users を削除したが、
-- auth.identities (OAuth/Email provider mapping) に残骸が残っており、
-- 再 createUser が "email_exists" で落ちる。auth.identities も併せて DELETE する。
-- auth.users の soft delete (deleted_at) もハード削除する。

-- 1) auth.identities にぶら下がる showcase 行を削除
DELETE FROM auth.identities
  WHERE provider_id = 'showcase@ailier.app'
     OR identity_data->>'email' = 'showcase@ailier.app';

-- 2) auth.users から soft-deleted 含めて完全削除
DELETE FROM auth.users
  WHERE email = 'showcase@ailier.app'
     OR raw_user_meta_data->>'email' = 'showcase@ailier.app';

-- 3) profiles / creator_profiles / portfolio_items の orphan も念のため掃除
DELETE FROM portfolio_items
  WHERE creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id NOT IN (SELECT id FROM auth.users)
  );

DELETE FROM creator_profiles
  WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM profiles
  WHERE email = 'showcase@ailier.app';
