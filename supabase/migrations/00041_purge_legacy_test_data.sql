-- ============================================
-- 00041: 旧 CreatorsHub 系テストデータの全面パージ + AI 特化型に書き換え
-- ============================================
-- AILIER (AI クリエイター特化型) 仕様に合わせて、CreatorsHub 由来の
-- レガシーテストデータを一掃する。
--
-- 1. portfolio_items: 動画タイプで video_platform が 'mp4' 以外
--    (youtube / youtube_short / vimeo / tiktok / instagram / other) を削除。
--    動画は MP4 アップロード一本化、画像 (media_type='image') は維持。
-- 2. creator_profiles.bio: 旧 CreatorsHub 由来の文言 (映像制作歴 / Premiere /
--    After Effects 等) を AI クリエイター向け汎用 bio に置換。
-- 3. service_packages.description / name: 旧テンプレ文言を AI 動画/静止画
--    制作用に書き換え。

-- =====================
-- 1. レガシー SNS 埋め込みポートフォリオを削除
-- =====================
DELETE FROM portfolio_items
WHERE media_type = 'video'
  AND video_platform IN (
    'youtube', 'youtube_short', 'vimeo',
    'tiktok', 'instagram', 'other'
  );

-- =====================
-- 2. 旧 CreatorsHub bio を AI 特化型に書き換え
-- =====================
-- 「映像制作歴 X 年」「Premiere」「After Effects (AI 文脈なし)」などの
-- 旧フレーズを含む bio を、汎用 AI クリエイター bio に差し替える。
UPDATE creator_profiles
SET bio = 'Sora 2 / Veo 3 / Runway Gen-4 / Midjourney を駆使した AI 映像クリエイター。SNS 広告動画・ブランドムービー・静止画クリエイティブを高速かつ高品質で制作します。'
WHERE
  bio IS NOT NULL
  AND (
       bio LIKE '%映像制作歴%'
    OR bio LIKE '%Premiere Pro%'
    OR bio LIKE '%After Effects%'
    OR bio LIKE '%CreatorsHub%'
    OR bio LIKE '%企業VP%'
    OR bio LIKE '%ウェディング%'
    OR bio LIKE '%プロフィールムービー%'
  )
  -- すでに AI 関連キーワードが含まれていれば触らない
  AND bio NOT LIKE '%Sora%'
  AND bio NOT LIKE '%Veo%'
  AND bio NOT LIKE '%Runway%'
  AND bio NOT LIKE '%Midjourney%'
  AND bio NOT LIKE '%AI %'
  AND bio NOT LIKE '%AI生成%'
  AND bio NOT LIKE '%AIクリエイター%';

-- =====================
-- 3. service_packages の名前・説明を AI 特化に書き換え
-- =====================
-- 旧 CreatorsHub 由来の汎用映像制作パッケージ説明を、AI 動画制作向けに更新。
UPDATE service_packages
SET
  name = CASE
    WHEN name LIKE '%企業VP%' OR name LIKE '%コーポレート%'
      THEN 'AI ブランドムービー'
    WHEN name LIKE '%ウェディング%' OR name LIKE '%イベント%'
      THEN 'AI イベント・展示会映像'
    WHEN name LIKE '%プロフィール%'
      THEN 'AI コンセプトムービー'
    WHEN name LIKE '%MV%' OR name LIKE '%ミュージック%'
      THEN 'AI ミュージックビデオ'
    ELSE name
  END,
  description = CASE
    WHEN description LIKE '%映像制作%' OR description LIKE '%動画編集%'
      THEN 'Sora 2 / Veo 3 / Runway Gen-4 / Midjourney を組み合わせ、撮影不要で短納期に納品する AI 動画制作プラン。'
    WHEN description LIKE '%企業VP%' OR description LIKE '%採用動画%'
      THEN 'AI で企業ブランド・採用シーンを表現する映像を制作。撮影不要・低コスト・修正高速。'
    ELSE description
  END
WHERE
  name LIKE '%企業VP%'
  OR name LIKE '%コーポレート%'
  OR name LIKE '%ウェディング%'
  OR name LIKE '%イベント%'
  OR name LIKE '%プロフィール%'
  OR name LIKE '%MV%'
  OR name LIKE '%ミュージック%'
  OR description LIKE '%映像制作%'
  OR description LIKE '%動画編集%'
  OR description LIKE '%企業VP%'
  OR description LIKE '%採用動画%';

-- =====================
-- 4. ログ用 NOTICE
-- =====================
DO $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining
  FROM portfolio_items
  WHERE media_type = 'video' AND video_platform != 'mp4';
  RAISE NOTICE '[00041] 残存する非mp4 動画アイテム: %', v_remaining;
END $$;
