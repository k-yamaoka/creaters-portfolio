-- 2026-06-17: scripts/seed-sample-works.mjs を最初に走らせたとき、
-- auth.users 行は作成されたが creator_profiles INSERT が落ちて partial state に
-- なった。auth.admin.listUsers が "Database error finding users" で落ちるため、
-- 手で orphan auth.users 行 + 関連 profile を削除して clean state にする。
-- このスクリプトは「showcase@ailier.app」だけを対象にした冪等な DELETE で、
-- 既に居なければ no-op。

-- profile に紐づく portfolio_items / creator_profiles も ON DELETE CASCADE で
-- 連鎖削除されるが、念のため明示的に消す。
DELETE FROM portfolio_items
  WHERE creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id IN (
      SELECT id FROM auth.users WHERE email = 'showcase@ailier.app'
    )
  );

DELETE FROM creator_profiles
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'showcase@ailier.app'
  );

DELETE FROM profiles
  WHERE email = 'showcase@ailier.app';

DELETE FROM auth.users
  WHERE email = 'showcase@ailier.app';
