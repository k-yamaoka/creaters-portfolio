-- ============================================
-- 00035: デモ動画の視覚バリエーションを増やす
-- ============================================
-- 00034 では同じ 3 コンテンツ (BBB / Jellyfish / Sintel) ばかりで
-- 視覚的に単調だったため、Elephants Dream / Flower / Friday / Ocean /
-- その他 filesamples コンテンツを加えて 8〜11 種の異なる視覚に増やす。
--
-- 全 URL は curl で 200 + video/mp4 を確認済みの安定 CDN:
--   - test-videos.co.uk (BBB/Jellyfish/Sintel)
--   - media.w3.org (BBB/Sintel)
--   - archive.org (Sintel/ElephantsDream)
--   - interactive-examples.mdn.mozilla.net (flower/friday)
--   - filesamples.com (Ocean等の多様なコンテンツ)

DO $$
DECLARE
  v_creator_id UUID;
  v_videos TEXT[] := ARRAY[
    -- 1-3: Big Buck Bunny (test-videos.co.uk)
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4',
    -- 4-6: Jellyfish (deep sea)
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4',
    -- 7-9: Sintel (fantasy)
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4',
    -- 10-13: W3 (BBB trailer + Sintel HD + 別コンテンツ)
    'https://media.w3.org/2010/05/bunny/trailer.mp4',
    'https://media.w3.org/2010/05/sintel/trailer.mp4',
    'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
    'https://media.w3.org/2010/05/video/movie_300.mp4',
    -- 14-16: archive.org (Sintel フル + Elephants Dream)
    'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
    'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4',
    'https://archive.org/download/ElephantsDream/ed_hd.mp4',
    -- 17-18: MDN cc0-videos (花のタイムラプス / ライフスタイル)
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    -- 19-23: filesamples (海・その他多様コンテンツ)
    'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
    'https://filesamples.com/samples/video/mp4/sample_960x400_ocean_with_audio.mp4',
    'https://filesamples.com/samples/video/mp4/sample_1280x720.mp4',
    'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    'https://filesamples.com/samples/video/mp4/sample_1920x1080.mp4',
    -- 24-25: 残り (低解像で軽量、ロード高速)
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_2MB.mp4'
  ];
  v_aspects TEXT[] := ARRAY[
    'horizontal','vertical','square',
    'vertical','horizontal','vertical',
    'horizontal','vertical','square',
    'horizontal','vertical','horizontal','square',
    'horizontal','vertical','horizontal',
    'vertical','horizontal',
    'square','horizontal','vertical','horizontal','square',
    'vertical','horizontal'
  ];
  v_titles TEXT[] := ARRAY[
    'AI 自然映像 (Forest Scene)','AI ファンタジー縦型','AI フォレスト スクエア',
    'AI 深海縦型映像','AI 深海バナー','AI 縦型コンセプト',
    'AI Sintel ブランド映像','AI Sintel 縦型予告','AI Sintel スクエア',
    'AI BBB トレーラー','AI Sintel ティザー','AI Sintel HD',
    'AI 動画 サンプル','AI シネマグレード Sintel','AI Elephants Dream 縦型',
    'AI Elephants Dream HD','AI 花のタイムラプス','AI ライフスタイル金曜',
    'AI スクエア素材 01','AI 海中映像 (Ocean)','AI 縦型 1280',
    'AI 横型 960','AI 高解像 スクエア','AI ループ素材 軽量縦','AI ループ素材 軽量横'
  ];
  v_url TEXT;
  v_title TEXT;
  v_aspect TEXT;
  i INTEGER;
  inserted_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  SELECT id INTO v_creator_id
  FROM creator_profiles
  ORDER BY created_at
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE NOTICE '[00035] No creator_profiles found, skipping';
    RETURN;
  END IF;

  DELETE FROM portfolio_items
  WHERE creator_id = v_creator_id
    AND (description LIKE 'AILIER テスト用%' OR description LIKE 'AILIER テスト動画%');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '[00035] Deleted % old demo items', deleted_count;

  FOR i IN 1..array_length(v_videos, 1) LOOP
    v_url := v_videos[i];
    v_title := v_titles[i];
    v_aspect := v_aspects[i];

    INSERT INTO portfolio_items (
      creator_id, title, description,
      video_url, video_platform,
      media_type, aspect_ratio,
      thumbnail_url,
      genre, tags,
      has_publish_permission,
      sort_order
    ) VALUES (
      v_creator_id, v_title,
      'AILIER テスト用サンプル動画 (CC ライセンス、本番では差し替え予定)',
      v_url, 'mp4',
      'video', v_aspect,
      NULL,
      'SNS広告動画',
      ARRAY['AI','サンプル','デモ'],
      TRUE,
      100 + i
    );
    inserted_count := inserted_count + 1;
  END LOOP;

  RAISE NOTICE '[00035] Inserted % diverse demo videos', inserted_count;
END $$;
