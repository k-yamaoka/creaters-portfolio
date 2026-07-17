-- 00072: 通報 (reports) と モデレーション (unpublish / delete) の基盤
--
-- ビジネス要件 (2026-07-16):
--   * 通報ベース + 運営の目視で著作権侵害等に対応
--   * 通報時は Email/Slack で運営に即時通知 (application 側で dispatch)
--   * 異なる IP からの通報が 3 件集まったら 自動的に一時非公開 (Unpublish)
--     同一 IP の連続通報は 無効化 (unique index)
--   * 運営は「一時非公開」と「削除」の 2 段階を持つ (どちらも 理由必須)
--   * 非公開/削除は クリエイターへ Email 通知 + 理由記録
--   * 実行者・日時・対象・理由 の監査ログ保存
--
-- 対象は現状 portfolio_items のみ。将来 messages / creator_profile なども
-- 拡張できるよう target_type カラムを持たせる。

-- ============================================================
-- 1. portfolio_items にモデレーション状態カラム
-- ============================================================
-- 状態:
--   published    通常公開 (デフォルト)
--   unpublished  一時非公開 (データ保持 / UI から除外)
--   deleted      論理削除 (データ保持 / どこにも表示しない)
--
-- 物理削除は行わない (異議申立ての証跡として保持)
ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'published'
    CHECK (moderation_status IN ('published', 'unpublished', 'deleted')),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_portfolio_items_moderation
  ON portfolio_items(moderation_status)
  WHERE moderation_status <> 'published';

COMMENT ON COLUMN portfolio_items.moderation_status IS
  '00072: published / unpublished / deleted。unpublished は データ保持 UI 非表示、deleted は 論理削除 (物理削除しない)。';

-- ============================================================
-- 2. content_reports (通報)
-- ============================================================
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- 対象コンテンツ
  target_type TEXT NOT NULL CHECK (target_type IN ('portfolio_item')),
  target_id UUID NOT NULL,
  -- 通報者 (匿名 = 未ログイン許可なし、ログイン必須)
  reporter_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_ip TEXT,             -- IP 単位重複判定用 (未取得は NULL)
  -- カテゴリ
  reason_category TEXT NOT NULL CHECK (reason_category IN (
    'copyright',            -- 著作権侵害
    'impersonation',        -- なりすまし / 他人の作品を自作として掲載
    'inappropriate',        -- 公序良俗違反 (性的 / 暴力 / 差別)
    'unauthorized_person',  -- 実在人物の無断生成
    'spam',                 -- スパム / 商業的なもの
    'other'
  )),
  reason_note TEXT,             -- 詳細 (任意 2000 字)
  -- 処理状態
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_target
  ON content_reports(target_type, target_id, status);
CREATE INDEX IF NOT EXISTS idx_content_reports_open
  ON content_reports(created_at DESC) WHERE status = 'open';

-- 同一ユーザーが同一ターゲットに複数回通報するのを 1 件に絞る
CREATE UNIQUE INDEX IF NOT EXISTS uniq_content_reports_user_target
  ON content_reports(reporter_user_id, target_type, target_id);

COMMENT ON TABLE content_reports IS
  '00072: コンテンツ通報。異なる IP から 3 件 (unique reporter_ip) 溜まると portfolio_items.moderation_status=unpublished に自動遷移する trigger を持つ。';

-- ============================================================
-- 3. moderation_actions (監査ログ)
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('portfolio_item')),
  target_id UUID NOT NULL,
  -- 実行者 (system の場合は NULL + actor_role='system')
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('admin', 'system')),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'unpublish',     -- 一時非公開
    'delete',        -- 論理削除
    'restore',       -- 復元 (unpublished → published)
    'auto_unpublish' -- 通報 3 件で自動非公開
  )),
  reason TEXT NOT NULL,   -- 理由記録 必須
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_target
  ON moderation_actions(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_actor
  ON moderation_actions(actor_user_id, created_at DESC);

COMMENT ON TABLE moderation_actions IS
  '00072: モデレーション 監査ログ (誰が / いつ / 何を / 何故 実行したか)。物理削除禁止。';

-- ============================================================
-- 4. 自動非公開 trigger — 異なる IP から 3 件通報
-- ============================================================
-- ロジック:
--   INSERT された reporter_ip が NULL でない場合、その target について
--   unique reporter_ip の open 通報数を集計。3 以上なら
--   portfolio_items.moderation_status を 'unpublished' に遷移させ、
--   moderation_actions に 'auto_unpublish' 行を追加する。
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
  unique_ip_count INTEGER;
  current_status TEXT;
BEGIN
  IF NEW.target_type <> 'portfolio_item' THEN
    RETURN NEW;
  END IF;

  -- 同一 target の open 通報のうち reporter_ip の DISTINCT を数える
  --  reporter_ip が NULL の行は count しない (要件: 同一 IP は無効化)
  SELECT COUNT(DISTINCT reporter_ip) INTO unique_ip_count
    FROM content_reports
    WHERE target_type = NEW.target_type
      AND target_id = NEW.target_id
      AND status = 'open'
      AND reporter_ip IS NOT NULL;

  IF unique_ip_count >= 3 THEN
    -- 既に unpublished / deleted なら触らない
    SELECT moderation_status INTO current_status
      FROM portfolio_items
      WHERE id = NEW.target_id;
    IF current_status = 'published' THEN
      UPDATE portfolio_items
        SET moderation_status = 'unpublished',
            moderation_reason = '通報 3 件による自動一時非公開 (運営確認待ち)',
            moderated_by = NULL,
            moderated_at = now()
        WHERE id = NEW.target_id;

      INSERT INTO moderation_actions (
        target_type, target_id, actor_user_id, actor_role,
        action_type, reason
      ) VALUES (
        NEW.target_type, NEW.target_id, NULL, 'system',
        'auto_unpublish',
        format('異なる IP から %s 件の通報が集まったため自動一時非公開',
               unique_ip_count)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_content_reports_threshold ON content_reports;
CREATE TRIGGER trg_content_reports_threshold
  AFTER INSERT ON content_reports
  FOR EACH ROW
  EXECUTE FUNCTION check_report_threshold();

-- ============================================================
-- 5. RLS
-- ============================================================
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- content_reports:
--  - 通報者本人は自分の通報を SELECT 可
--  - INSERT はログイン必須 + reporter_user_id=auth.uid()
--  - 他ユーザーは他人の通報を見られない (管理画面は service_role で bypass)
DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports" ON content_reports FOR SELECT
  USING (reporter_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own reports" ON content_reports;
CREATE POLICY "Users can insert own reports" ON content_reports FOR INSERT
  WITH CHECK (reporter_user_id = auth.uid());

-- moderation_actions: 管理画面専用 (service_role bypass 想定)
-- 一般ユーザーからは SELECT / INSERT 不可
DROP POLICY IF EXISTS "Moderation actions denied to normal users" ON moderation_actions;
CREATE POLICY "Moderation actions denied to normal users" ON moderation_actions FOR SELECT
  USING (false);
