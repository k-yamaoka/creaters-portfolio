-- 00078: クリエイター単位の通報・モデレーション集計 view (常習者可視化)
--
-- 監査 (2026-07-21):
--   /admin/moderation に「累積通報数 上位」「累積非公開回数 上位」の
--   常習者ハイライトを表示するためのバックエンド集計を用意する。
--
-- creator_report_stats view:
--   - creator_profile_id を key に
--   - report_total: 過去に受けた通報件数 (open + resolved)
--   - report_open: 未対応通報件数 (status='open')
--   - unpublished_total: 一時非公開回数 (moderation_actions.action_type IN
--     ('unpublish','auto_unpublish'))
--   - deleted_total: 削除回数
--   - last_incident_at: 最新のインシデント日時

CREATE OR REPLACE VIEW creator_report_stats AS
WITH portfolio_owner AS (
  SELECT id AS portfolio_item_id, creator_id
  FROM portfolio_items
),
reports_per_creator AS (
  SELECT
    po.creator_id AS creator_profile_id,
    COUNT(*)::INTEGER AS report_total,
    COUNT(*) FILTER (WHERE cr.status = 'open')::INTEGER AS report_open,
    MAX(cr.created_at) AS last_report_at
  FROM content_reports cr
  JOIN portfolio_owner po
    ON po.portfolio_item_id = cr.target_id
  WHERE cr.target_type = 'portfolio_item'
  GROUP BY po.creator_id
),
mod_per_creator AS (
  SELECT
    po.creator_id AS creator_profile_id,
    COUNT(*) FILTER (
      WHERE ma.action_type IN ('unpublish', 'auto_unpublish')
    )::INTEGER AS unpublished_total,
    COUNT(*) FILTER (WHERE ma.action_type = 'delete')::INTEGER AS deleted_total,
    MAX(ma.created_at) AS last_moderation_at
  FROM moderation_actions ma
  JOIN portfolio_owner po
    ON po.portfolio_item_id = ma.target_id
  WHERE ma.target_type = 'portfolio_item'
  GROUP BY po.creator_id
)
SELECT
  COALESCE(r.creator_profile_id, m.creator_profile_id) AS creator_profile_id,
  COALESCE(r.report_total, 0) AS report_total,
  COALESCE(r.report_open, 0) AS report_open,
  COALESCE(m.unpublished_total, 0) AS unpublished_total,
  COALESCE(m.deleted_total, 0) AS deleted_total,
  GREATEST(r.last_report_at, m.last_moderation_at) AS last_incident_at
FROM reports_per_creator r
FULL OUTER JOIN mod_per_creator m
  ON r.creator_profile_id = m.creator_profile_id;

COMMENT ON VIEW creator_report_stats IS
  '00078: クリエイター単位の通報・モデレーション累積 (常習者可視化用)。';

-- 管理画面 (service_role bypass 前提) から SELECT できるように付与。
-- 一般ユーザーは他人の統計を見られない (RLS は基テーブル側)。
GRANT SELECT ON creator_report_stats TO service_role;
