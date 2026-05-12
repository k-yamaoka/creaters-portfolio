-- ============================================
-- ポートフォリオ作品の掲載許諾フラグを追加
-- クリエイターはクライアントから許諾を得た作品のみ掲載できる
-- 既存行は FALSE で初期化されるが、新規登録時は必須でチェックさせる
-- ============================================

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS has_publish_permission BOOLEAN NOT NULL DEFAULT FALSE;
