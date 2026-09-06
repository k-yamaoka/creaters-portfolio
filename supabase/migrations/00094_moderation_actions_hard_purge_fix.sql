-- 00094: MOD-028/029 実 cron 発火時に発覚した 制約不足の修正
--
-- 事故:
--   00093 で portfolio_item × 'hard_purge' を許可する 複合 CHECK
--   (moderation_actions_target_action_check) を追加したが、実 cron 発火時
--   INSERT が
--     new row for relation "moderation_actions" violates check constraint
--     "moderation_actions_action_type_check"
--   で拒否された。
--
-- 原因:
--   moderation_actions テーブルには 独立した 2 本の CHECK 制約が存在:
--     - moderation_actions_target_type_check (target_type 単独)
--     - moderation_actions_action_type_check (action_type 単独)
--   00086/00087 で これらを個別に維持してきた。
--   00093 の複合 CHECK は追加しただけで、既存 action_type 単独 CHECK は
--   'hard_purge' を含まない旧値のまま。
--
-- 対策:
--   1. 00093 で追加した重複 複合 CHECK を DROP (独立 CHECK 2 本で
--      十分に整合性が取れる)
--   2. moderation_actions_action_type_check を DROP → 'hard_purge' を追加
--      した完全版で再作成

-- ============================================================
-- 1) 00093 の複合 CHECK を撤去 (独立 2 本で十分)
-- ============================================================
ALTER TABLE moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_target_action_check;

-- ============================================================
-- 2) action_type 単独 CHECK に 'hard_purge' 追加
-- ============================================================
ALTER TABLE moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_action_type_check;

ALTER TABLE moderation_actions
  ADD CONSTRAINT moderation_actions_action_type_check
  CHECK (action_type IN (
    -- portfolio_item 用
    'unpublish',
    'delete',
    'restore',
    'auto_unpublish',
    'hard_purge',           -- 2026-09-06 追加: 30 日 grace 経過後の 物理削除
    -- profile 用
    'account_suspend',
    'account_restore',
    'account_verify',
    'account_unverify',
    'auto_account_suspend',
    -- job 用
    'invitation_send'
  ));

COMMENT ON CONSTRAINT moderation_actions_action_type_check ON public.moderation_actions IS
  '2026-09-06 拡張: hard_purge (deleted 作品の 30 日経過後 Storage + DB 物理削除) を追加。cron/purge-deleted-portfolios から INSERT される。';
