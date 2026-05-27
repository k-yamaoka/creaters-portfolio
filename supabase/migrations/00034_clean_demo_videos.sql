-- ============================================
-- 00034: デモ動画 seed を信頼 CDN のみに統一
-- ============================================
-- 00031〜00033 で seed したサンプル動画のうち、
-- Pexels / W3C / W3Schools / Blender は実ブラウザでロードに失敗する
-- ケースがあるため、test-videos.co.uk と MDN cc0-videos の URL だけに統一する。
--
-- 1. 既存のテスト用 portfolio_items を一旦 DELETE
-- 2. 確実に再生できる URL でちょうど 25 行を INSERT
--    (5カラム × 5タイル のレイアウトを全て埋める)

DO $$
DECLARE
  v_creator_id UUID;
  -- 全て CORS:* / content-type=video/mp4 を確認済みの信頼 CDN
  v_videos TEXT[] := ARRAY[
    -- BigBuckBunny 系 (8本)
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_10MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4',
    -- Jellyfish 系 (7本)
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_2MB.mp4',
    -- Sintel 系 (8本)
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_10MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_1MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_2MB.mp4',
    -- MDN cc0-videos (2本)
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4'
  ];
  v_aspects TEXT[] := ARRAY[
    'horizontal','vertical','square','horizontal','vertical',
    'horizontal','square','vertical','horizontal','vertical',
    'square','horizontal','vertical','horizontal','square',
    'vertical','horizontal','square','vertical','horizontal',
    'square','vertical','horizontal','vertical','horizontal'
  ];
  v_titles TEXT[] := ARRAY[
    'AI 自然映像 サンプル 01','AI 縦型広告 サンプル 02','AI スクエア素材 03','AI シネマグレード 04','AI 縦型コンセプト 05',
    'AI 横型バナー素材 06','AI 商品ループ 07','AI 縦型ティザー 08','AI 高解像広告 09','AI 縦型ショート 10',
    'AI スクエアバナー 11','AI ブランドムービー 12','AI Reels サンプル 13','AI 横型解説 14','AI 商品アップ 15',
    'AI 縦型ストーリー 16','AI シネマ広告 17','AI ロゴアニメ 18','AI 縦型ヒーロー 19','AI 横型短尺 20',
    'AI スクエアループ 21','AI 縦型コンテンツ 22','AI ハイエンド映像 23','AI 縦型 BGV 24','AI ループ素材 25'
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
    RAISE NOTICE '[00034] No creator_profiles found, skipping';
    RETURN;
  END IF;

  -- 古い demo seed を一掃 (description で識別)
  DELETE FROM portfolio_items
  WHERE creator_id = v_creator_id
    AND (description LIKE 'AILIER テスト用%' OR description LIKE 'AILIER テスト動画%');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '[00034] Deleted % old demo items', deleted_count;

  -- 信頼 URL で 25 件 INSERT
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

  RAISE NOTICE '[00034] Inserted % demo videos (reliable CDN only)', inserted_count;
END $$;
