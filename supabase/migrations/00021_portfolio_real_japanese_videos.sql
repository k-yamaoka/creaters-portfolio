-- Migration 00021
-- portfolio_items のテストデータを「実在する日本語動画」に差し替える。
--
-- これまでは Rick Astley や架空 Vimeo ID、サンプルTikTok/Instagram URLが
-- 混ざっていたため、動画はリンク切れ・サムネは Unsplash の汎用画像という状態だった。
-- 本マイグレーションで:
--   - video_url     : 公式チャンネル等で公開されている実在する日本語MV/CM のURL に置換
--   - thumbnail_url : 同動画の YouTube サムネ (img.youtube.com/vi/{ID}/hqdefault.jpg) に統一
--   - video_platform: 'youtube' に統一
--   - title         : 実際の動画タイトルを反映
--   - description   : 「サンプル」と明示する文言に統一
-- すべて UPDATE 文なので冪等（複数回実行可）。
--
-- 注意: 動画自体の著作権は各権利者に帰属する。これは開発/テスト用ダミーデータの
--       置換であり、本番のクリエイター実績データではない。

BEGIN;

-- ---------------------------------------------------------------
-- 共通用の作業: video_platform カラムは enum なので 'youtube' に必ず戻す
-- ---------------------------------------------------------------

-- d0000000-...-001  →  YOASOBI「夜に駆ける」
UPDATE portfolio_items SET
  title = 'YOASOBI「夜に駆ける」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=x8VYWazR5mE',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/x8VYWazR5mE/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- d0000000-...-002  →  YOASOBI「アイドル」
UPDATE portfolio_items SET
  title = 'YOASOBI「アイドル」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=ZRtdQ81jPUQ',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/ZRtdQ81jPUQ/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000002';

-- d0000000-...-003  →  米津玄師「Lemon」
UPDATE portfolio_items SET
  title = '米津玄師「Lemon」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=SX_ViT4Ra7k',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/SX_ViT4Ra7k/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000003';

-- d0000000-...-004  →  米津玄師「KICK BACK」
UPDATE portfolio_items SET
  title = '米津玄師「KICK BACK」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=M2cckDmNLMI',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/M2cckDmNLMI/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000004';

-- d0000000-...-005  →  Official髭男dism「Pretender」
UPDATE portfolio_items SET
  title = 'Official髭男dism「Pretender」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=TQ8WlA2GXbk',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/TQ8WlA2GXbk/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000005';

-- d0000000-...-006  →  Official髭男dism「Subtitle」
UPDATE portfolio_items SET
  title = 'Official髭男dism「Subtitle」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=hN5MBlGv2Ac',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/hN5MBlGv2Ac/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000006';

-- d0000000-...-007  →  King Gnu「白日」
UPDATE portfolio_items SET
  title = 'King Gnu「白日」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=ony539T074w',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/ony539T074w/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000007';

-- d0000000-...-107  →  LiSA「紅蓮華」
UPDATE portfolio_items SET
  title = 'LiSA「紅蓮華」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=CwkzK-F0Y00',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/CwkzK-F0Y00/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000107';

-- d0000000-...-008  →  Ado「うっせぇわ」
UPDATE portfolio_items SET
  title = 'Ado「うっせぇわ」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=Qp3b-RXtz4w',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/Qp3b-RXtz4w/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000008';

-- d0000000-...-108  →  Vaundy「怪獣の花唄」
UPDATE portfolio_items SET
  title = 'Vaundy「怪獣の花唄」MUSIC VIDEO ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=UM9XNpgrqVk',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/UM9XNpgrqVk/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000108';

-- d0000000-...-009  →  あいみょん「マリーゴールド」
UPDATE portfolio_items SET
  title = 'あいみょん「マリーゴールド」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=0xSiBpUdW4E',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/0xSiBpUdW4E/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000009';

-- d0000000-...-010  →  Aimer「残響散歌」
UPDATE portfolio_items SET
  title = 'Aimer「残響散歌」MUSIC VIDEO ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=tLQLa6lM3Us',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/tLQLa6lM3Us/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000010';

-- d0000000-...-110  →  優里「ドライフラワー」
UPDATE portfolio_items SET
  title = '優里「ドライフラワー」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=kzZ6KXDM1RI',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/kzZ6KXDM1RI/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000110';

-- d0000000-...-011  →  MISIA「アイノカタチ」
UPDATE portfolio_items SET
  title = 'MISIA「アイノカタチ feat.HIDE(GReeeeN)」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=IX87le_EokM',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/IX87le_EokM/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000011';

-- d0000000-...-012  →  サザンオールスターズ「ピースとハイライト」
UPDATE portfolio_items SET
  title = 'サザンオールスターズ「ピースとハイライト」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=f0FKO6PuYrE',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/f0FKO6PuYrE/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000012';

-- d0000000-...-112  →  星野源「恋」
UPDATE portfolio_items SET
  title = '星野源「恋」Official Video ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=jhOVibLEDhA',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/jhOVibLEDhA/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000112';

-- d0000000-...-013  →  SPYAIR「現状ディストラクション」
UPDATE portfolio_items SET
  title = 'SPYAIR「現状ディストラクション」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=L2dKjnmWRkk',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/L2dKjnmWRkk/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000013';

-- d0000000-...-014  →  SUPER BEAVER「名前を呼ぶよ」
UPDATE portfolio_items SET
  title = 'SUPER BEAVER「名前を呼ぶよ」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=gTePfOIDLao',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/gTePfOIDLao/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000014';

-- d0000000-...-114  →  SEKAI NO OWARI「Habit」
UPDATE portfolio_items SET
  title = 'SEKAI NO OWARI「Habit」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=8OZDgBmehbA',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/8OZDgBmehbA/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000114';

-- d0000000-...-015  →  ヨルシカ「花に亡霊」
UPDATE portfolio_items SET
  title = 'ヨルシカ「花に亡霊」OFFICIAL VIDEO ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=9lVPAWLWtWc',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/9lVPAWLWtWc/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000015';

-- d0000000-...-016  →  RADWIMPS「前前前世」
UPDATE portfolio_items SET
  title = 'RADWIMPS「前前前世」(movie ver.) MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=PDSkFeMVNFs',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/PDSkFeMVNFs/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000016';

-- d0000000-...-017  →  PIKOTARO「PPAP」
UPDATE portfolio_items SET
  title = 'PIKOTARO「PPAP (Pen-Pineapple-Apple-Pen)」 ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=0E00Zuayv9Q',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/0E00Zuayv9Q/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000017';

-- d0000000-...-117  →  YOASOBI「群青」
UPDATE portfolio_items SET
  title = 'YOASOBI「群青」Official MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=Y4nEEZwckuU',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/Y4nEEZwckuU/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000117';

-- d0000000-...-018  →  米津玄師「パプリカ」
UPDATE portfolio_items SET
  title = '米津玄師「パプリカ」MV ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=s582L3gujnw',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/s582L3gujnw/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000018';

-- d0000000-...-019  →  サントリー BOSS「宇宙人ジョーンズ・昭和」篇
UPDATE portfolio_items SET
  title = 'サントリー BOSS 宇宙人ジョーンズ「昭和」篇 ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=FYfNMbdgl9s',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/FYfNMbdgl9s/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000019';

-- d0000000-...-119  →  クラフトボス『甘くないイタリアーノ・真実かフェイクか／第1弾』
UPDATE portfolio_items SET
  title = 'サントリー クラフトボス『真実かフェイクか／第1弾』篇 ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=K7DT1uY3QXo',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/K7DT1uY3QXo/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000119';

-- d0000000-...-020  →  トヨタシステムズ コンセプトムービー
UPDATE portfolio_items SET
  title = 'トヨタシステムズ コンセプトムービー ─ サンプル素材',
  description = '実在する日本語動画を表示しているサンプル素材です（権利は各権利者に帰属）。',
  video_url = 'https://www.youtube.com/watch?v=VIYF8VnmGYs',
  video_platform = 'youtube',
  thumbnail_url = 'https://img.youtube.com/vi/VIYF8VnmGYs/hqdefault.jpg'
WHERE id = 'd0000000-0000-0000-0000-000000000020';

COMMIT;
