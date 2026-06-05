-- ============================================
-- 00048: service_packages に詳細設定項目を追加
-- ============================================
-- 企業とのミスマッチを防ぐため、料金プランに「制作プロセス」「使用ツール」
-- 「納品物・権利」「スケジュール」の各観点を詳細に明示できるよう拡充する。
--
-- 既存カラムは触らず、追加カラムはすべて NULLABLE / DEFAULT 値ありで
-- 後方互換を維持する (旧データは追加項目が空のまま表示される)。

ALTER TABLE service_packages
  -- ===== 制作プロセス・範囲 =====
  -- 企画・構成・絵コンテの対応: 'included' / 'optional' / 'client_supplied' / 'not_included'
  ADD COLUMN IF NOT EXISTS planning_support TEXT,
  -- 無料修正回数。NULL = 「無制限」を意図する場合は revisions_unlimited で表現
  ADD COLUMN IF NOT EXISTS revisions_unlimited BOOLEAN NOT NULL DEFAULT FALSE,

  -- ===== AI / ツール =====
  -- 使用ツール (Sora / Veo / Runway / Luma / Midjourney / Premiere Pro 等)
  ADD COLUMN IF NOT EXISTS tools TEXT[] NOT NULL DEFAULT '{}'::text[],
  -- ナレーション / 音声生成: 'none' / 'ai_voice' / 'human' / 'client_supplied'
  ADD COLUMN IF NOT EXISTS voiceover_type TEXT,
  -- BGM: ライセンス込み / 自前持込 / 不要 等の説明 (自由文字列)
  ADD COLUMN IF NOT EXISTS bgm_policy TEXT,

  -- ===== 納品物・権利 =====
  -- 納品解像度 (例: 'fhd' / '4k' / 自由文字列も許容するため TEXT)
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  -- プロジェクトファイル (元データ・生成プロンプト) の納品可否
  ADD COLUMN IF NOT EXISTS project_files_included BOOLEAN NOT NULL DEFAULT FALSE,
  -- 商用利用 / 著作権の扱い: 'web_only' / 'commercial' / 'transfer' / 'custom'
  ADD COLUMN IF NOT EXISTS commercial_use TEXT,
  ADD COLUMN IF NOT EXISTS commercial_use_note TEXT,

  -- ===== スケジュール =====
  -- 提供する映像尺の目安: 自由文字列 ('〜15秒', '〜60秒', '3分以内' 等)
  ADD COLUMN IF NOT EXISTS duration_target TEXT,
  -- 特急納品の対応
  ADD COLUMN IF NOT EXISTS rush_available BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rush_delivery_days INTEGER,
  ADD COLUMN IF NOT EXISTS rush_surcharge INTEGER;

COMMENT ON COLUMN service_packages.planning_support IS
  '企画・構成・絵コンテの対応 (included/optional/client_supplied/not_included)';
COMMENT ON COLUMN service_packages.revisions_unlimited IS
  'true の場合 revisions 列の値は無視し「無制限」として扱う';
COMMENT ON COLUMN service_packages.tools IS
  '使用ソフト / 生成 AI ツールのリスト';
COMMENT ON COLUMN service_packages.voiceover_type IS
  'ナレーション/音声: none / ai_voice / human / client_supplied';
COMMENT ON COLUMN service_packages.bgm_policy IS
  'BGM のライセンス方針 (自由記述)';
COMMENT ON COLUMN service_packages.resolution IS
  '納品解像度 (fhd / 4k / 自由記述)';
COMMENT ON COLUMN service_packages.project_files_included IS
  'プロジェクトファイル (元データ / プロンプト等) を納品物に含めるか';
COMMENT ON COLUMN service_packages.commercial_use IS
  '商用利用の範囲 (web_only / commercial / transfer / custom)';
COMMENT ON COLUMN service_packages.commercial_use_note IS
  '商用利用範囲の補足説明 (自由記述)';
COMMENT ON COLUMN service_packages.duration_target IS
  '提供する映像尺の目安 (〜15秒, 〜60秒 など)';
COMMENT ON COLUMN service_packages.rush_available IS
  '特急納品オプションを提供するか';
COMMENT ON COLUMN service_packages.rush_delivery_days IS
  '特急納品時の日数 (rush_available=true のとき有効)';
COMMENT ON COLUMN service_packages.rush_surcharge IS
  '特急納品時の追加料金 (円)。rush_available=true のとき有効';
