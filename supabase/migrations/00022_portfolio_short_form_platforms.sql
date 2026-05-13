-- Migration 00022
-- portfolio_items に「縦型・ショート系プラットフォーム」のテストデータを追加。
-- 00021 では全 27 件が video_platform='youtube' に統一されたため、
-- /portfolios の YouTube Shorts / TikTok / Instagram タブが空になっていた。
-- このマイグレーションでは 7 件を以下に振り分ける:
--   - youtube_short  ×4 : サントリー/ユニクロ 公式の縦型 CM (実在 URL・実在サムネ)
--   - instagram      ×2 : 公式系アカウントの Reel (実在 URL・サムネは ライブラリで auto-fetch)
--   - tiktok         ×1 : @uniqlo_jp プロフィール (実在 URL・サムネは ライブラリで auto-fetch)
--
-- - youtube_short のサムネは img.youtube.com/vi/{ID}/hqdefault.jpg を直書き
-- - instagram / tiktok のサムネは NULL にして、サーバ側の fixMissingThumbnails が
--   og:image / oembed から実サムネを取得する (Instagram CDN URL は数日で失効
--   するが、その都度 fixMissingThumbnails が再取得するので運用上問題ない)
--
-- 注意: 動画自体の著作権は各権利者に帰属する。これは開発/テスト用ダミーデータの
--       置換であり、本番のクリエイター実績データではない。

BEGIN;

-- ---------------------------------------------------------------
-- youtube_short ×4 : 実在の日本企業 公式縦型CM
-- ---------------------------------------------------------------

-- d0000000-...-005 →  サントリー生ビール『サン生のCM決まったよ』60秒 縦型 JUNON LEO
UPDATE portfolio_items SET
  title = 'サントリー生ビール『サン生のCM決まったよ』60秒 縦型 JUNON LEO ─ サンプル素材',
  description = '実在する日本語の縦型ショート動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/shorts/9pMxDkHW1-E',
  video_platform = 'youtube_short',
  thumbnail_url = 'https://img.youtube.com/vi/9pMxDkHW1-E/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000005';

-- d0000000-...-006 →  サントリー生ビール『サン生のCM決まったよ』30秒 縦型
UPDATE portfolio_items SET
  title = 'サントリー生ビール『サン生のCM決まったよ』30秒 縦型 ─ サンプル素材',
  description = '実在する日本語の縦型ショート動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/shorts/CNidwNKYu5M',
  video_platform = 'youtube_short',
  thumbnail_url = 'https://img.youtube.com/vi/CNidwNKYu5M/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000006';

-- d0000000-...-108 →  ジムビーム『JIM友、歓喜の夏フェス』30秒 縦型 香取慎吾
UPDATE portfolio_items SET
  title = 'ジムビーム『JIM友、歓喜の夏フェス』30秒 縦型 香取慎吾 ─ サンプル素材',
  description = '実在する日本語の縦型ショート動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/shorts/HjhwArdxa4U',
  video_platform = 'youtube_short',
  thumbnail_url = 'https://img.youtube.com/vi/HjhwArdxa4U/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000108';

-- d0000000-...-114 →  水曜日のダウンタウン × ユニクロ コラボCM (縦型)
UPDATE portfolio_items SET
  title = 'ユニクロ × 水曜日のダウンタウン「名探偵津田」コラボ CM 縦型 ─ サンプル素材',
  description = '実在する日本語の縦型ショート動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/shorts/Ql58tGV0Qyk',
  video_platform = 'youtube_short',
  thumbnail_url = 'https://img.youtube.com/vi/Ql58tGV0Qyk/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000114';

-- ---------------------------------------------------------------
-- instagram ×2 : 実在の Reel URL
-- thumbnail_url = NULL にして fixMissingThumbnails で og:image を取得させる
-- ---------------------------------------------------------------

-- d0000000-...-112 →  kobe_sc のユニクロ神戸三宮店オープニング鏡割り Reel
UPDATE portfolio_items SET
  title = 'UNIQLO 神戸三宮店 オープニング鏡割り Reel ─ サンプル素材',
  description = '実在する日本語の Instagram Reel を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.instagram.com/kobe_sc/reel/C5E8cBJye9w/',
  video_platform = 'instagram',
  thumbnail_url = NULL
WHERE id = 'd0000000-0000-0000-0000-000000000112';

-- d0000000-...-119 →  FASHIONSNAP のニュース Reel
UPDATE portfolio_items SET
  title = 'FASHIONSNAP ニュース Reel ─ サンプル素材',
  description = '実在する日本語の Instagram Reel を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.instagram.com/fashionsnapcom/reel/DBdpjg8qzqD/',
  video_platform = 'instagram',
  thumbnail_url = NULL
WHERE id = 'd0000000-0000-0000-0000-000000000119';

-- ---------------------------------------------------------------
-- tiktok ×1 : 実在の公式アカウント
-- thumbnail_url = NULL にして fixMissingThumbnails で取得を試みる
-- (TikTok は個別動画URL がないとサムネ取得できないので、ここでは
-- profile URL を使用。実運用ではユーザーが個別動画URL を入力する想定)
-- ---------------------------------------------------------------

-- d0000000-...-017 →  TikTok @uniqlo_jp 公式プロフィール
UPDATE portfolio_items SET
  title = 'TikTok ユニクロ【公式】(@uniqlo_jp) プロフィール ─ サンプル素材',
  description = '実在する日本企業の TikTok 公式アカウントを表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.tiktok.com/@uniqlo_jp',
  video_platform = 'tiktok',
  thumbnail_url = NULL
WHERE id = 'd0000000-0000-0000-0000-000000000017';

COMMIT;
