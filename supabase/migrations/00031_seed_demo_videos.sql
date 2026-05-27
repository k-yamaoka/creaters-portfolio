-- ============================================
-- 00031: TOP ギャラリー用テスト動画を seed
-- ============================================
-- AILIER の TOP ページ縦カラム ビデオウォールで使用する
-- サンプル MP4 動画を portfolio_items に挿入する。
--
-- - 動画URLは Google 公開 sample bucket (CC ライセンス)
-- - 既存の任意のクリエイター 1 名に紐づける
-- - 同じ video_url が既にある場合はスキップ (再実行安全)
-- - クリエイターが 1 人も存在しない環境では何もしない

DO $$
DECLARE
  v_creator_id UUID;
  v_videos TEXT[] := ARRAY[
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
  ];
  -- ジャンルと尺、アスペクト比を散らす
  v_titles TEXT[] := ARRAY[
    'Sora 2 + Runway で生成した SNS 広告サンプル',
    'AI ブランドムービー(ファンタジー世界観)',
    'D2C 商品紹介ショート',
    'コスメ D2C ローンチ広告 A 案',
    'Meta 広告 縦型 15秒 サンプル',
    'TikTok 向けトレンド演出',
    'AI コンセプト映像(炎エフェクト)',
    'AI シネマグレード ブランドムービー',
    'プロダクトデモ(ライフスタイル)',
    'SaaS プロダクト解説 1分',
    '採用動画 イメージカット',
    'イベント映像 ハイライト',
    'ローンチティザー 6秒'
  ];
  v_aspects TEXT[] := ARRAY[
    'horizontal','horizontal','vertical','vertical','vertical',
    'vertical','horizontal','horizontal','horizontal','horizontal',
    'horizontal','horizontal','square'
  ];
  v_url TEXT;
  v_title TEXT;
  v_aspect TEXT;
  i INTEGER;
BEGIN
  -- 最古のクリエイターに紐づける(本番でも最初の登録者なので問題なし)
  SELECT id INTO v_creator_id
  FROM creator_profiles
  ORDER BY created_at
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE NOTICE '[00031] No creator_profiles found, skipping seed';
    RETURN;
  END IF;

  RAISE NOTICE '[00031] Seeding % demo videos for creator_id=%',
    array_length(v_videos, 1), v_creator_id;

  FOR i IN 1..array_length(v_videos, 1) LOOP
    v_url := v_videos[i];
    v_title := v_titles[i];
    v_aspect := v_aspects[i];

    -- 既に同じ video_url で seed 済みならスキップ
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
        v_creator_id,
        v_title,
        'AILIER テスト用サンプル動画(CC ライセンス、本番リリース時に差し替え予定)',
        v_url, 'mp4',
        'video', v_aspect,
        NULL,
        'SNS広告動画',
        ARRAY['AI','サンプル','デモ'],
        TRUE,
        100 + i
      );
    END IF;
  END LOOP;
END $$;
