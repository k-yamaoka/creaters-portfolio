-- ============================================
-- 00044: 20件のユニーク AI 動画テストデータ (重複解消版)
-- ============================================
-- 00043 で投入した 20 本は 視覚的に重複していた (BBB×5, Sintel×6 等)。
-- 「全てそれぞれ他の動画にして欲しい」という要望に合わせ、
-- 視覚的に明確に異なる 20 ソースに差し替える。
--
-- 内訳:
--  - Blender Foundation オープン映画 (BBB / Jellyfish / Sintel / Elephants Dream) : 4 本
--  - Mozilla MDN cc0-videos (flower / friday)                                    : 2 本
--  - Cloudinary 公開 demo 素材 (dog / sea_turtle / elephants / cat / kitten /
--    dance / cld-sample / funny_dog)                                              : 8 本
--  - filesamples.com (ocean サンプル)                                           : 1 本
--  - download.samplelib.com (5/10/15/20/30 秒尺の異なるシーン)                  : 5 本
-- これらは全て CC0/CC-BY もしくは demo bucket のため AILIER の試運転用 seed として
-- 利用可。本番ローンチ時にはクリエイターの実作品で置き換える。

DO $$
DECLARE
  v_urls TEXT[] := ARRAY[
    -- アニメ系 (4 — それぞれ別作品)
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4',
    'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
    -- MDN 実写 (2)
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    -- Cloudinary demo (8 — 全て別シーン)
    'https://res.cloudinary.com/demo/video/upload/dog.mp4',
    'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
    'https://res.cloudinary.com/demo/video/upload/elephants.mp4',
    'https://res.cloudinary.com/demo/video/upload/cat.mp4',
    'https://res.cloudinary.com/demo/video/upload/kitten_fighting.mp4',
    'https://res.cloudinary.com/demo/video/upload/samples/dance-2.mp4',
    'https://res.cloudinary.com/demo/video/upload/cld-sample-video.mp4',
    'https://res.cloudinary.com/demo/video/upload/funny_dog.mp4',
    -- filesamples ocean
    'https://filesamples.com/samples/video/mp4/sample_960x400_ocean_with_audio.mp4',
    -- samplelib 5 本 (5/10/15/20/30 秒 — 各々別シーン)
    'https://download.samplelib.com/mp4/sample-5s.mp4',
    'https://download.samplelib.com/mp4/sample-10s.mp4',
    'https://download.samplelib.com/mp4/sample-15s.mp4',
    'https://download.samplelib.com/mp4/sample-20s.mp4',
    'https://download.samplelib.com/mp4/sample-30s.mp4'
  ];

  v_aspects TEXT[] := ARRAY[
    'horizontal','horizontal','horizontal','horizontal',
    'vertical','horizontal',
    'horizontal','horizontal','horizontal','horizontal','horizontal','vertical','horizontal','horizontal',
    'horizontal',
    'vertical','horizontal','vertical','horizontal','horizontal'
  ];

  v_titles TEXT[] := ARRAY[
    'AI 自然映像 / Sora 2 で生成した森のシーン',
    'AI 深海ビジュアル / Veo 3 ジェリーフィッシュ',
    'AI ファンタジー / Runway Gen-4 シネマグレード',
    'AI SF コンセプト / Midjourney + Kling 2.x',
    'AI 縦型ティザー / フラワー タイムラプス',
    'AI ライフスタイル / Sora 2 採用動画ドラフト',
    'AI ペット系 SNS 広告 / D2C ローンチ A 案',
    'AI 海洋ブランドムービー / Veo 3 シネマグレード',
    'AI ワイルドライフ短編 / Runway Gen-4',
    'AI 商品 PR 用ループ / 動物素材',
    'AI 縦型 PR / Z 世代向けキャッチー素材',
    'AI ダンス映像 / 縦型 TikTok 想定 Veo 3',
    'AI 横型 デモ動画 / プロダクト紹介ループ',
    'AI ユーモア広告 / Sora 2 ペット D2C',
    'AI 海岸ブランド映像 / 自然系コーポレート',
    'AI 6 秒 SNS 広告 / バンパー想定',
    'AI 10 秒 ストーリー / Instagram Reels 縦型',
    'AI 15 秒 SNS 広告 / Meta 標準尺',
    'AI 20 秒 商品紹介 / SaaS 解説オープニング',
    'AI 30 秒 LP ヒーロー / コーポレート向け'
  ];

  v_descs TEXT[] := ARRAY[
    'Sora 2 で生成した自然シーン。Meta 広告用に 10 秒尺で縦型/横型を両方納品可能。',
    'Veo 3 で生成した深海ビジュアル。Instagram Reels / TikTok 想定の縦型 PR。',
    'Runway Gen-4 のシネマグレード表現を活かしたブランドムービーサンプル。',
    'Midjourney で商品ビジュアル → Kling 2.x で動画化した SF コンセプト PR サンプル。',
    'Flower タイムラプス — Midjourney + Veo 3 ブランドイメージ素材。',
    'Friday ライフスタイル — Sora 2 採用動画 イメージカット参考。',
    'Sora 2 + Midjourney で D2C 向け SNS 広告のラフを高速生成したサンプル。',
    'Veo 3 のシネマグレード表現を活かした海洋ブランドムービー素材。',
    'Runway Gen-4 ワイルドライフ短編素材 (デモ)。コーポレート CSR 動画への転用想定。',
    'Cloudinary demo を AI 加工素材として活用、商品 PR 用ループに転用するサンプル。',
    'TikTok / Reels の 9:16 Z 世代向けキャッチー素材デモ。',
    'Veo 3 縦型ダンス素材。TikTok / Shorts 想定のショート尺。',
    'Cloudinary 公式 demo 動画 — プロダクト紹介ループのフォーマット例。',
    'Sora 2 でユーモア系 D2C 広告ラフを生成したデモ素材。',
    'filesamples 海岸ループ素材 — Veo 3 風 自然系コーポレート映像。',
    'samplelib 5 秒 — YouTube バンパー / SNS フックの最短尺デモ。',
    'samplelib 10 秒 — Instagram Reels 縦型ストーリーの基本尺。',
    'samplelib 15 秒 — Meta 広告標準尺のテンプレート例。',
    'samplelib 20 秒 — SaaS 解説オープニング用デモ素材。',
    'samplelib 30 秒 — LP / コーポレートヒーロー動画の基準尺デモ。'
  ];

  v_genres TEXT[] := ARRAY[
    'SNS広告動画','ブランドムービー','ブランドムービー','SNS広告動画',
    'LP用ヒーロー動画','採用動画',
    'SNS広告動画','ブランドムービー','ショートフィルム・アート映像','プロダクト紹介動画','SNS広告動画','SNS広告動画','プロダクト紹介動画','SNS広告動画',
    'ブランドムービー',
    'SNS広告動画','SNS広告動画','SNS広告動画','サービス解説動画(Explainer)','LP用ヒーロー動画'
  ];

  v_creator_ids UUID[];
  v_total_creators INTEGER;
  i INTEGER;
  v_inserted INTEGER := 0;
  v_deleted INTEGER := 0;
BEGIN
  -- 00043 が投入した重複デモを削除 (tag = 'AI'+'デモ'+'サンプル' で識別)
  DELETE FROM portfolio_items
  WHERE tags @> ARRAY['AI','デモ','サンプル']::TEXT[];
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE '[00044] 削除した 00043 デモアイテム: %', v_deleted;

  -- 全クリエイター ID を取得 (created_at 順)
  SELECT array_agg(id ORDER BY created_at) INTO v_creator_ids
  FROM creator_profiles;
  v_total_creators := COALESCE(array_length(v_creator_ids, 1), 0);

  IF v_total_creators = 0 THEN
    RAISE NOTICE '[00044] クリエイターが存在しないので seed をスキップ';
    RETURN;
  END IF;

  -- 20 本を round-robin で配布
  FOR i IN 1..array_length(v_urls, 1) LOOP
    INSERT INTO portfolio_items (
      creator_id, title, description,
      video_url, video_platform, media_type, aspect_ratio,
      thumbnail_url, genre, tags,
      has_publish_permission, sort_order
    ) VALUES (
      v_creator_ids[((i - 1) % v_total_creators) + 1],
      v_titles[i],
      v_descs[i],
      v_urls[i],
      'mp4',
      'video',
      v_aspects[i],
      NULL,
      v_genres[i],
      ARRAY['AI','デモ','サンプル']::TEXT[],
      TRUE,
      100 + i
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  RAISE NOTICE '[00044] 投入した ユニーク AI 動画: %, 配布先クリエイター数: %',
    v_inserted, v_total_creators;
END $$;
