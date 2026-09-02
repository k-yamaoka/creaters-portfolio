-- 2026-09-02: moderation_actions の target_type に 'job' を追加。
-- 併せて action_type に 'invitation_send' を追加。
--
-- 目的: 管理者による 案件スカウト一括送信 (POST /api/admin/jobs/:id/invite) の
--   実行履歴を監査ログに記録する。
--   target = job (どの案件へ), reason = 「N 名へ invitation 送信」等の要約。

ALTER TABLE public.moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_target_type_check;

ALTER TABLE public.moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_action_type_check;

ALTER TABLE public.moderation_actions
  ADD CONSTRAINT moderation_actions_target_type_check
  CHECK (target_type IN ('portfolio_item', 'profile', 'job'));

ALTER TABLE public.moderation_actions
  ADD CONSTRAINT moderation_actions_action_type_check
  CHECK (action_type IN (
    'unpublish',
    'delete',
    'restore',
    'auto_unpublish',
    'account_suspend',
    'account_restore',
    'account_verify',
    'account_unverify',
    'auto_account_suspend',
    'invitation_send'      -- 案件への 一括スカウト送信 (今回追加)
  ));
