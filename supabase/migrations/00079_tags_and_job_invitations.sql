-- 00079: C-3 手動マッチング / スカウト基盤
--
-- 立ち上げ期は運営コンシェルジュ運用だが、将来の自動マッチング (アルゴリズム化)
-- を見据えたスケーラブル DB 設計。既存 creator_profiles.ai_tools / strengths /
-- genres (TEXT[] with GIN index) は互換維持のため残し、正規化されたタグマスタ
-- + 中間テーブルを "上位互換の候補集合" として並置する。
--
-- タグ移行方針:
--   Phase 1 (本 migration): tags マスタ に既存 constants の値を全件 seed +
--     中間テーブル定義のみ (creator/job の紐付けは application 側から書ける
--     ようにする)。既存 TEXT[] カラムは残す。
--   Phase 2 (将来): タグ選択 UI をマスタ参照型に切替、TEXT[] 側は
--     synchronized-write のミラーとして残しつつ検索は中間テーブルへ移行。
--   Phase 3 (将来): TEXT[] を廃止。

-- ============================================================
-- 1. tags マスタ
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- カテゴリで分類: 'skill' (映像表現 強み) / 'ai_tool' (Sora/Veo/Runway 等) /
  --                 'genre' (SNS 広告 / VP 等) / 'industry' (D2C / EdTech 等)
  category TEXT NOT NULL CHECK (category IN ('skill', 'ai_tool', 'genre', 'industry')),
  -- 表示名 (日本語 or 商品名)。同 category 内で unique
  name TEXT NOT NULL,
  -- URL や API 用の slug (ascii、任意)。category+slug で unique にする
  slug TEXT,
  -- 廃止済タグ (UI で新規選択不可、既存関連は保持)
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- 表示順 (小さいほど上位)
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_tags_category_name
  ON tags(category, name);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tags_category_slug
  ON tags(category, slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tags_active_sort
  ON tags(category, is_active, sort_order);

COMMENT ON TABLE tags IS
  '00079 C-3: マッチング用タグ マスタ (skill / ai_tool / genre / industry)。将来の自動マッチング アルゴリズムのベクトル化元データ。';

-- ============================================================
-- 2. 中間テーブル: creator_profiles ↔ tags
-- ============================================================
CREATE TABLE IF NOT EXISTS creator_tags (
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  -- 「主要スキル」フラグ。将来の重み付けマッチングで倍率をかける
  is_primary BOOLEAN NOT NULL DEFAULT false,
  -- クリエイターが自己申告 or 運営付与 の区別
  source TEXT NOT NULL DEFAULT 'self'
    CHECK (source IN ('self', 'admin', 'system_import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_profile_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_tags_tag
  ON creator_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_creator_tags_creator
  ON creator_tags(creator_profile_id);

COMMENT ON TABLE creator_tags IS
  '00079 C-3: クリエイター ↔ タグ 中間。既存 creator_profiles.ai_tools/strengths/genres の TEXT[] と並置 (Phase 1 では両方書く、将来はこちらのみに移行)。';

-- ============================================================
-- 3. 中間テーブル: jobs ↔ tags
-- ============================================================
CREATE TABLE IF NOT EXISTS job_tags (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  -- 必須 (must) or 推奨 (nice_to_have)
  requirement TEXT NOT NULL DEFAULT 'nice_to_have'
    CHECK (requirement IN ('must', 'nice_to_have')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_job_tags_tag ON job_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_job_tags_job ON job_tags(job_id);

COMMENT ON TABLE job_tags IS
  '00079 C-3: 案件 ↔ タグ 中間。requirement=must は アルゴリズム時に絶対条件。';

-- ============================================================
-- 4. job_invitations (運営からのスカウト通知)
-- ============================================================
CREATE TABLE IF NOT EXISTS job_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  -- スカウトを送った運営 (admin) user
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- クリエイター向けの一言メッセージ (任意、テンプレ + 個別調整可)
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  -- クリエイターが declined したときの理由 (任意)
  decline_reason TEXT,
  -- 有効期限 (デフォルト +14 日)。cron で expired に自動遷移させる
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days')
);

-- 同一案件 × 同一クリエイター への重複スカウト禁止
CREATE UNIQUE INDEX IF NOT EXISTS uniq_job_invitations_job_creator
  ON job_invitations(job_id, creator_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_creator_pending
  ON job_invitations(creator_id, status)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_invitations_job
  ON job_invitations(job_id);

COMMENT ON TABLE job_invitations IS
  '00079 C-3: 運営からクリエイターへの案件スカウト通知。同 job × creator は 1 件のみ (UNIQUE)。';

-- ============================================================
-- 5. RLS
-- ============================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_invitations ENABLE ROW LEVEL SECURITY;

-- tags: 公開情報として誰でも SELECT (未ログインでも)。INSERT/UPDATE は admin のみ
--   (service_role bypass 前提。app 側で認可)
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON tags;
CREATE POLICY "Tags are viewable by everyone" ON tags FOR SELECT
  USING (true);

-- creator_tags: 誰でも SELECT (公開プロフィールに使うため)
DROP POLICY IF EXISTS "Creator tags viewable by everyone" ON creator_tags;
CREATE POLICY "Creator tags viewable by everyone" ON creator_tags FOR SELECT
  USING (true);

-- creator_tags: 本人のみ INSERT / DELETE 可
DROP POLICY IF EXISTS "Creator tags editable by owner" ON creator_tags;
CREATE POLICY "Creator tags editable by owner" ON creator_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = creator_tags.creator_profile_id
        AND cp.user_id = auth.uid()
    )
  );

-- job_tags: 案件 SELECT が可能な人 = 案件表示が可能 (open jobs) と同じ
DROP POLICY IF EXISTS "Job tags viewable by everyone" ON job_tags;
CREATE POLICY "Job tags viewable by everyone" ON job_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_tags.job_id AND (j.status = 'open')
    )
  );

-- job_tags: 案件所有者 (client) のみ INSERT / DELETE
DROP POLICY IF EXISTS "Job tags editable by job owner" ON job_tags;
CREATE POLICY "Job tags editable by job owner" ON job_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN client_profiles cp ON cp.id = j.client_id
      WHERE j.id = job_tags.job_id AND cp.user_id = auth.uid()
    )
  );

-- job_invitations: 招待された creator 本人だけが SELECT / UPDATE (status 遷移)
DROP POLICY IF EXISTS "Invitations viewable by target creator" ON job_invitations;
CREATE POLICY "Invitations viewable by target creator" ON job_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = job_invitations.creator_id
        AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Invitations updatable by target creator" ON job_invitations;
CREATE POLICY "Invitations updatable by target creator" ON job_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM creator_profiles cp
      WHERE cp.id = job_invitations.creator_id
        AND cp.user_id = auth.uid()
    )
  );
-- INSERT は service_role (admin API) からのみ

-- ============================================================
-- 6. tags マスタの seed (既存 constants.ts と同期)
-- ============================================================
-- ai_tool
INSERT INTO tags (category, name, slug, sort_order) VALUES
  ('ai_tool', 'Sora 2',        'sora-2',        10),
  ('ai_tool', 'Sora',          'sora',          15),
  ('ai_tool', 'Veo 3',         'veo-3',         20),
  ('ai_tool', 'Veo 2',         'veo-2',         25),
  ('ai_tool', 'Runway Gen-4',  'runway-gen-4',  30),
  ('ai_tool', 'Runway Gen-3',  'runway-gen-3',  35),
  ('ai_tool', 'Kling 2',       'kling-2',       40),
  ('ai_tool', 'Hailuo',        'hailuo',        50),
  ('ai_tool', 'Pika 2',        'pika-2',        60),
  ('ai_tool', 'Luma Dream Machine', 'luma-dream-machine', 70),
  ('ai_tool', 'Midjourney',    'midjourney',    80),
  ('ai_tool', 'DALL-E',        'dall-e',        85),
  ('ai_tool', 'Stable Diffusion', 'stable-diffusion', 90),
  ('ai_tool', 'Adobe Firefly', 'adobe-firefly', 95),
  ('ai_tool', 'CapCut',        'capcut',       120),
  ('ai_tool', 'After Effects', 'after-effects', 130),
  ('ai_tool', 'Premiere Pro',  'premiere-pro', 140),
  ('ai_tool', 'DaVinci Resolve','davinci-resolve', 150)
ON CONFLICT (category, name) DO NOTHING;

-- genre
INSERT INTO tags (category, name, slug, sort_order) VALUES
  ('genre', 'SNS広告動画',       'sns-ads',           10),
  ('genre', 'SNS広告 静止画バナー','sns-banner',      15),
  ('genre', '商品紹介動画',       'product-video',     20),
  ('genre', '会社紹介・コーポレートVP', 'corporate-vp', 30),
  ('genre', '採用動画',           'recruit-video',     40),
  ('genre', 'ミュージックビデオ',  'music-video',       50),
  ('genre', 'ショートドラマ',      'short-drama',       60),
  ('genre', 'AI絵コンテ',         'ai-storyboard',     70),
  ('genre', 'アニメーション',      'animation',         80),
  ('genre', 'AIアバター・キャラクター動画', 'ai-avatar', 90),
  ('genre', 'YouTube動画編集',    'youtube-edit',     100)
ON CONFLICT (category, name) DO NOTHING;

-- skill (映像表現の強み)
INSERT INTO tags (category, name, slug, sort_order) VALUES
  ('skill', 'シネマティック演出', 'cinematic',       10),
  ('skill', 'AI 生成全般',        'ai-generation',   20),
  ('skill', 'プロンプト設計',     'prompt-design',   30),
  ('skill', '実写×AI ハイブリッド', 'hybrid-live-ai', 40),
  ('skill', 'キャラクター一貫性',  'character-consistency', 50),
  ('skill', 'モーショングラフィックス', 'motion-graphics', 60),
  ('skill', 'カラーグレーディング','color-grading',   70),
  ('skill', '英語 / バイリンガル', 'bilingual',       80)
ON CONFLICT (category, name) DO NOTHING;

-- industry (発注元の業種、案件側で使うことが多い)
INSERT INTO tags (category, name, slug, sort_order) VALUES
  ('industry', 'D2C・EC',        'd2c-ec',          10),
  ('industry', 'SaaS',           'saas',            20),
  ('industry', 'エンタープライズ', 'enterprise',      30),
  ('industry', '化粧品・美容',    'beauty',          40),
  ('industry', 'フード・飲食',    'food',            50),
  ('industry', 'アパレル',        'apparel',         60),
  ('industry', 'エンタメ',        'entertainment',   70),
  ('industry', '教育・EdTech',    'edtech',          80),
  ('industry', '医療・ヘルスケア', 'healthcare',      90),
  ('industry', 'ゲーム',          'gaming',         100),
  ('industry', '不動産',          'realestate',     110)
ON CONFLICT (category, name) DO NOTHING;

-- ============================================================
-- 7. 既存 TEXT[] からの片方向 backfill (creator_tags のみ)
-- ============================================================
-- 既存 creator_profiles.ai_tools / genres / strengths を creator_tags に
-- ミラー。名前完全一致で tags と紐付ける。マッチしないものは skip (application
-- 側でタグマスタに新規追加してから再実行する運用)。
INSERT INTO creator_tags (creator_profile_id, tag_id, source)
SELECT cp.id, t.id, 'system_import'
  FROM creator_profiles cp
  CROSS JOIN LATERAL unnest(cp.ai_tools) AS tool_name
  JOIN tags t ON t.category = 'ai_tool' AND t.name = tool_name
ON CONFLICT DO NOTHING;

INSERT INTO creator_tags (creator_profile_id, tag_id, source)
SELECT cp.id, t.id, 'system_import'
  FROM creator_profiles cp
  CROSS JOIN LATERAL unnest(cp.genres) AS g
  JOIN tags t ON t.category = 'genre' AND t.name = g
ON CONFLICT DO NOTHING;

INSERT INTO creator_tags (creator_profile_id, tag_id, source, is_primary)
SELECT cp.id, t.id, 'system_import', true
  FROM creator_profiles cp
  CROSS JOIN LATERAL unnest(cp.strengths) AS s
  JOIN tags t ON t.category = 'skill' AND t.name = s
ON CONFLICT DO NOTHING;
