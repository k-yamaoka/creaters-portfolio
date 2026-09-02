-- 2026-09-02: moderation_actions に「アカウント (profile)」ターゲット + suspend/restore アクションを追加。
--
-- 既存の CHECK 制約:
--   target_type IN ('portfolio_item')
--   action_type IN ('unpublish', 'delete', 'restore', 'auto_unpublish')
-- では admin/users の 利用停止・再開・認証切替 の履歴が書けない。
--
-- 制約を drop → 拡張して 再作成 (既存 履歴には影響なし、単に許可幅を広げるだけ)。

ALTER TABLE public.moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_target_type_check;

ALTER TABLE public.moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_action_type_check;

ALTER TABLE public.moderation_actions
  ADD CONSTRAINT moderation_actions_target_type_check
  CHECK (target_type IN ('portfolio_item', 'profile'));

ALTER TABLE public.moderation_actions
  ADD CONSTRAINT moderation_actions_action_type_check
  CHECK (action_type IN (
    -- portfolio_item 用 (既存)
    'unpublish',
    'delete',
    'restore',
    'auto_unpublish',
    -- profile 用 (今回追加)
    'account_suspend',    -- 管理者が利用停止
    'account_restore',    -- 管理者が利用再開
    'account_verify',     -- 管理者が認証済にマーク
    'account_unverify',   -- 管理者が認証を取り消し
    'auto_account_suspend' -- cron による自動停止 (penalty score >= 15)
  ));

COMMENT ON CONSTRAINT moderation_actions_action_type_check ON public.moderation_actions IS
  '2026-09-02 拡張: portfolio_item / profile 両方のアクション種別をカバー。
   auto_account_suspend は cron/suspend-repeat-offenders 用。
   account_verify / _unverify は 認証済トグル記録。';
