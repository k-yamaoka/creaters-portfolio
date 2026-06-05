-- ============================================
-- 00049: service_packages.tools を 2 カラムに分割
-- ============================================
-- 「使用ソフト (編集ツール)」と「生成 AI ツール」は性質が異なるため UI/表示で
-- 分けて扱いたい (ユーザー要望)。
--
-- 旧: tools text[] (混在)
-- 新: used_softwares text[]  (Premiere / AE / DaVinci / FCP / Photoshop 等)
--    used_ai_tools  text[]  (Sora / Veo / Runway / Midjourney / ElevenLabs 等)
--
-- 既存データは AI ツールの代表的キーワードで分類してから移行。
-- マッチしなかったエントリは安全側として used_softwares に振り分ける。

ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS used_softwares text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS used_ai_tools  text[] NOT NULL DEFAULT '{}'::text[];

-- AI ツール判定用ホワイトリスト (lower 比較)
WITH ai_keywords AS (
  SELECT ARRAY[
    'sora','veo','runway','luma','pika','kling','hailuo','midjourney',
    'stable diffusion','sd','flux','elevenlabs','chatgpt','claude',
    'gemini','suno','udio','dalle','dall·e','dall-e','leonardo',
    'higgsfield','topaz','magnific'
  ]::text[] AS kw
),
-- 既存 tools を 1 行ずつ分解
exploded AS (
  SELECT
    sp.id AS pkg_id,
    t AS tool
  FROM service_packages sp,
       LATERAL unnest(COALESCE(sp.tools, '{}'::text[])) AS t
),
-- 各 tool を ai/software に分類
classified AS (
  SELECT
    e.pkg_id,
    e.tool,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM ai_keywords ak,
             LATERAL unnest(ak.kw) AS k
        WHERE lower(e.tool) LIKE '%' || k || '%'
      ) THEN 'ai'
      ELSE 'sw'
    END AS kind
  FROM exploded e
),
-- 種類ごとに集約
agg AS (
  SELECT
    pkg_id,
    array_agg(DISTINCT tool) FILTER (WHERE kind = 'ai') AS ai_arr,
    array_agg(DISTINCT tool) FILTER (WHERE kind = 'sw') AS sw_arr
  FROM classified
  GROUP BY pkg_id
)
UPDATE service_packages sp
SET
  used_ai_tools  = COALESCE(agg.ai_arr, '{}'::text[]),
  used_softwares = COALESCE(agg.sw_arr, '{}'::text[])
FROM agg
WHERE sp.id = agg.pkg_id;

-- 旧カラムは削除 (要件: 「現在 1 つにまとまっているツール関連のカラムを 2 つに分割」)
ALTER TABLE service_packages DROP COLUMN IF EXISTS tools;

COMMENT ON COLUMN service_packages.used_softwares IS
  '使用ソフト / 編集ツール (Premiere Pro / AE / DaVinci / FCP / Photoshop 等)';
COMMENT ON COLUMN service_packages.used_ai_tools IS
  '使用 生成 AI ツール (Sora / Veo / Runway / Midjourney / ElevenLabs 等)';
