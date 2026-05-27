-- ============================================
-- 00033: TOP ギャラリーのタイル枚数を増やすため追加 seed
-- ============================================
-- 00031/00032 で seed した 13本に加えて、追加 17本を投入。
-- 5カラム × 5タイル = 25 スロット全てに別 URL のサンプル動画が
-- 充当されるようにする。
--
-- - 各 URL は content-type=video/mp4 で 200 を返すことを確認済み
-- - 同じ video_url が既にあればスキップ (再実行安全)

DO $$
DECLARE
  v_creator_id UUID;
  v_videos TEXT[] := ARRAY[
    -- test-videos.co.uk バリエーション
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_10MB.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_2MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/1080/Sintel_1080_10s_5MB.mp4',
    'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_2MB.mp4',
    -- Blender 公式 (Sintel trailer 別バージョン)
    'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
    -- Pexels 公開 CDN (CC0)
    'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
    'https://videos.pexels.com/video-files/2103099/2103099-hd_1920_1080_30fps.mp4',
    -- MDN cc0-videos (再使用、別タイル枠へ配置)
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
    -- W3C / W3Schools サンプル
    'https://media.w3.org/2010/05/sintel/trailer.mp4',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    -- test-videos.co.uk 小サイズ (高速ロード)
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4'
  ];
  v_aspects TEXT[] := ARRAY[
    'horizontal','horizontal','horizontal',
    'vertical','vertical','vertical',
    'horizontal','horizontal','horizontal',
    'horizontal',
    'horizontal','horizontal',
    'square','square',
    'vertical','square',
    'horizontal'
  ];
  v_titles TEXT[] := ARRAY[
    'AI 自然風景生成 (Sora 2)',
    'AI 海中映像 (Veo 3)',
    'AI ファンタジー (Runway Gen-4)',
    'AI 縦型広告サンプル A',
    'AI 縦型広告サンプル B',
    'AI 縦型ショートサンプル',
    'AI シネマグレード ブランド映像',
    'AI ハイエンド広告映像',
    'AI 短尺ループ素材',
    'AI ティザー (短編)',
    'AI 高解像 抽象アート',
    'AI ライフスタイル映像',
    'AI 商品アップカット 1',
    'AI 商品アップカット 2',
    'AI コンセプト映像',
    'AI ループ素材 (GIF代替)',
    'AI 軽量サムネ用動画'
  ];
  v_url TEXT;
  v_title TEXT;
  v_aspect TEXT;
  i INTEGER;
  inserted_count INTEGER := 0;
BEGIN
  SELECT id INTO v_creator_id
  FROM creator_profiles
  ORDER BY created_at
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE NOTICE '[00033] No creator_profiles found, skipping';
    RETURN;
  END IF;

  FOR i IN 1..array_length(v_videos, 1) LOOP
    v_url := v_videos[i];
    v_title := v_titles[i];
    v_aspect := v_aspects[i];

    IF NOT EXISTS (
      SELECT 1 FROM portfolio_items
      WHERE video_url = v_url AND creator_id = v_creator_id
    ) THEN
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
        'AILIER テスト用サンプル動画 (CC ライセンス)',
        v_url, 'mp4',
        'video', v_aspect,
        NULL,
        'SNS広告動画',
        ARRAY['AI','サンプル','デモ'],
        TRUE,
        200 + i
      );
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '[00033] Inserted % additional demo videos', inserted_count;
END $$;
