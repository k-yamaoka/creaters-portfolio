-- 00093: MOD-028/029 対応 — deleted 作品の Storage 物理削除 cron の受け皿
--
-- 背景:
--   admin が portfolio_items を moderation_status='deleted' にした後も、
--   portfolio-videos バケットの動画本体は Storage に残り 公開 URL 経由で
--   アクセス可能な状態だった (MOD-028/029 で FAIL 検出)。
--
-- 対策:
--   /api/cron/purge-deleted-portfolios から 30 日経過分を対象に:
--     1. Storage から動画 / サムネイル / 画像 を remove
--     2. moderation_actions に 'hard_purge' 監査ログ INSERT
--     3. portfolio_items 行を物理 DELETE (audit ログで追跡可能)
--
--   本 migration はその 受け皿:
--     - moderation_actions.action_type に 'hard_purge' を許可
--     - portfolio_items(moderation_status, moderated_at) に部分 index
--       (deleted のみ、30 日経過分の高速抽出)

-- ============================================================
-- 1) moderation_actions.action_type CHECK を拡張
-- ============================================================
-- 00087 までの許可された組合わせを維持しつつ、
-- portfolio_item × 'hard_purge' を追加。

ALTER TABLE moderation_actions
  DROP CONSTRAINT IF EXISTS moderation_actions_target_action_check;

ALTER TABLE moderation_actions
  ADD CONSTRAINT moderation_actions_target_action_check
  CHECK (
    (target_type = 'portfolio_item' AND action_type IN (
      'unpublish', 'delete', 'restore', 'auto_unpublish', 'hard_purge'
    ))
    OR (target_type = 'profile' AND action_type IN (
      'account_suspend', 'account_restore', 'auto_account_suspend',
      'account_role_change'
    ))
    OR (target_type = 'job' AND action_type IN (
      'invitation_send'
    ))
  );

-- ============================================================
-- 2) portfolio_items: purge cron の高速抽出用 部分 index
--    deleted かつ moderated_at が 30 日以上前のレコードのみ。
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_portfolio_items_deleted_moderated_at
  ON portfolio_items (moderated_at)
  WHERE moderation_status = 'deleted';
