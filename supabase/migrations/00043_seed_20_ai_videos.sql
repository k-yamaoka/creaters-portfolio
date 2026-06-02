-- ============================================
-- 00043: 20件のユニーク AI 動画テストデータ
-- ============================================
-- 既存のデモポートフォリオを一掃し、CC ライセンス CDN から
-- 視覚的に異なる 20 本の動画を AI 文脈の タイトル/説明 で再 seed する。
-- 全クリエイターに対し round-robin で分配し、
-- 個々の portfolio に偏らないようにする。
--
-- 本物の AI 生成動画 (Sora/Veo/Runway) は公開 CDN がなく安定供給できないため、
-- CC0/CC-BY のオープンソース 短編 (Blender Foundation 制作映画 + Mozilla MDN 公開)
-- を「AI 生成風 デモ」として転用する。本番ローンチ時にはクリエイターの実作品で
-- 置き換える運用とする。

DO $$
DECLARE
  -- 20本の (URL, アスペクト比, タイトル, 説明, ジャンル) を順序保持で並べる
  v_urls TEXT[] := ARRAY[
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_2MB.mp4',
    'https://media.w3.org/2010/05/sintel/trailer.mp4',
    'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
    'https://media.w3.org/2010/05/bunny/trailer.mp4',
    'https://media.w3.org/2010/05/bunny/movie.mp4',
    'https://media.w3.org/2010/05/video/movie_300.mp4',
    'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
    'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
    'https://archive.org/download/ElephantsDream/ed_hd.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4'
  ];

  v_aspects TEXT[] := ARRAY[
    'horizontal','vertical','horizontal',
    'vertical','horizontal','vertical',
    'horizontal','vertical','horizontal','square',
    'horizontal','vertical','horizontal','horizontal','square',
    'horizontal','vertical','horizontal','vertical','horizontal'
  ];

  v_titles TEXT[] := ARRAY[
    'AI 自然映像 / Sora 2 で生成した森のシーン',
    'AI 縦型広告 / コスメ D2C ローンチ A 案',
    'AI ブランド映像 / Runway Gen-4 シネマグレード',
    'AI 縦型コンセプト / Veo 3 深海ビジュアル',
    'AI EC 商品 PR / Midjourney + Kling 2.x',
    'AI 縦型 PR / Sora 2 で生成した抽象パターン',
    'AI Sintel ブランドムービー / 高解像 1080p',
    'AI 縦型ストーリー / ファンタジー世界観',
    'AI ハイエンド広告 / Sora 2 で 10 秒尺',
    'AI スクエア商品ループ / バナー転用想定',
    'AI トレーラー / Veo 3 短編',
    'AI 縦型ティザー / Runway Gen-4 ',
    'AI BBB トレーラー / Pika 2.0 生成風',
    'AI フル尺ブランド映像 / 自社プロダクト',
    'AI 高解像 スクエア / プロダクト紹介ループ',
    'AI シネマ短編 / Sintel + Runway 合成',
    'AI Elephants Dream 縦型 / SF 表現',
    'AI Elephants Dream HD / コンセプト映像',
    'AI 花のタイムラプス / ブランドイメージ素材',
    'AI ライフスタイル金曜 / 採用動画イメージ'
  ];

  v_descs TEXT[] := ARRAY[
    'Sora 2 で生成した自然シーン。Meta 広告用に 10 秒尺で縦型/横型を両方納品可能。',
    'Veo 3 とMidjourney キーフレームを組み合わせた D2C ローンチ向け 縦型広告サンプル。',
    'Runway Gen-4 のシネマグレード表現を活かしたブランドムービーサンプル。',
    'Veo 3 で生成した深海ビジュアル。Instagram Reels / TikTok 想定の縦型 PR。',
    'Midjourney で商品ビジュアル → Kling 2.x で動画化した EC PR サンプル。',
    'Sora 2 で生成した抽象パターン。TikTok 広告のループ素材として活用可能。',
    'Sintel 1080p — Runway Gen-4 のスタイル転送を AI ブランドムービーに応用したデモ。',
    'AI 縦型ストーリーテリング。9:16 のショートドラマ展開を AB テスト想定で。',
    'Sora 2 で生成した 10 秒尺ハイエンド広告クリエイティブのデモ素材。',
    'AI 静止画 → Kling 2.x の流れで作る正方形ループ動画 (バナー転用想定)。',
    'Veo 3 で生成した短編トレーラーのサンプル。',
    'Runway Gen-4 縦型ティザー。コスメ/D2C 向け広告クリエイティブ。',
    'Pika 2.0 風 AI 生成トレーラー素材。',
    'Veo 3 によるフル尺ブランド映像のデモ。',
    'AI で生成した高解像スクエア素材。プロダクト紹介ループ用。',
    'Sintel × Runway 合成 — AI シネマ短編のサンプル。',
    'Elephants Dream 縦型 — SF 表現 + Sora 2 風生成テスト。',
    'Elephants Dream HD — コンセプト映像の参考素材。',
    'Flower タイムラプス — Midjourney + Veo 3 ブランドイメージ素材。',
    'Friday ライフスタイル — Sora 2 採用動画 イメージカット参考。'
  ];

  v_genres TEXT[] := ARRAY[
    'SNS広告動画','SNS広告動画','ブランドムービー',
    'SNS広告動画','プロダクト紹介動画','SNS広告動画',
    'ブランドムービー','ショートフィルム・アート映像','SNS広告動画','プロダクト紹介動画',
    '新商品ローンチ動画','SNS広告動画','ブランドムービー','ブランドムービー','プロダクト紹介動画',
    'ショートフィルム・アート映像','ショートフィルム・アート映像','ブランドムービー','LP用ヒーロー動画','採用動画'
  ];

  v_creator_ids UUID[];
  v_total_creators INTEGER;
  i INTEGER;
  v_inserted INTEGER := 0;
  v_deleted INTEGER := 0;
BEGIN
  -- 既存のデモ portfolio_items を削除
  DELETE FROM portfolio_items
  WHERE description LIKE '%AILIER テスト%'
     OR description LIKE '%サンプル動画%';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE '[00043] 削除した旧デモアイテム: %', v_deleted;

  -- 全クリエイターIDを取得
  SELECT array_agg(id ORDER BY created_at) INTO v_creator_ids
  FROM creator_profiles;
  v_total_creators := COALESCE(array_length(v_creator_ids, 1), 0);

  IF v_total_creators = 0 THEN
    RAISE NOTICE '[00043] クリエイターが存在しないので seed をスキップ';
    RETURN;
  END IF;

  -- 20本を round-robin で配布
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

  RAISE NOTICE '[00043] 投入した AI 動画: %, 配布先クリエイター数: %',
    v_inserted, v_total_creators;
END $$;
