-- 00075: クリエイター ペナルティ 蓄積
--
-- 設計書 v1 §1.5 対応 (2026-07-21):
--   * 未納品 / 途中終了 / 品質裁定敗訴 などのペナルティを row として累積
--   * 集計 view で 直近 12 ヶ月の合計 weight を creator ごとに算出
--   * 検索順位 / バッジ表示への反映は次フェーズ (本 migration は INSERT のみ)

CREATE TABLE IF NOT EXISTS creator_penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  penalty_type TEXT NOT NULL CHECK (penalty_type IN (
    'nondelivery',              -- 催促後 7 日 納品なし → 自動キャンセル
    'termination_by_creator',   -- クリエイター側都合の途中終了
    'quality_dispute_lost',     -- 品質を巡る運営裁定で敗訴
    'other'
  )),
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 0),
  reason TEXT,
  admin_review_note TEXT,       -- 運営内部メモ (UI 非表示)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_penalties_creator_recent
  ON creator_penalties(creator_profile_id, created_at DESC);

COMMENT ON TABLE creator_penalties IS
  '00075: クリエイターのペナルティ履歴。信頼度スコア算出の元データ。';

-- 集計 view: 直近 12 ヶ月の weight 合計
CREATE OR REPLACE VIEW creator_reliability_score AS
  SELECT
    creator_profile_id,
    COALESCE(SUM(weight), 0)::INTEGER AS penalty_score,
    COUNT(*)::INTEGER AS penalty_count,
    MAX(created_at) AS last_penalty_at
  FROM creator_penalties
  WHERE created_at > now() - INTERVAL '12 months'
  GROUP BY creator_profile_id;

GRANT SELECT ON creator_reliability_score TO authenticated, service_role;

-- RLS: 管理画面 (service_role) からのみ SELECT / INSERT。一般ユーザーは触れない
ALTER TABLE creator_penalties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Penalties are admin only" ON creator_penalties;
CREATE POLICY "Penalties are admin only" ON creator_penalties FOR SELECT USING (false);
