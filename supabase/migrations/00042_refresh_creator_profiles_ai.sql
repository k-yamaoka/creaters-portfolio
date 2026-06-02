-- ============================================
-- 00042: 全クリエイタープロフィールを AI 特化に書き換え
-- ============================================
-- bio / ai_tools / video_lengths / strengths / genres を、それぞれ
-- 10 種類のテンプレートから ORDINAL (created_at 順) ベースで循環選択して
-- 個性ある AI 特化型データに統一する。
-- (display_name / avatar_url / location / years_of_experience は触らない)
--
-- PostgreSQL の 2 次元配列は内側の長さが一定でなければならないため、
-- CASE WHEN で 10 パターンに分岐する形にする。

DO $$
DECLARE
  v_creator RECORD;
  i INTEGER := 0;
  v_slot INTEGER;
  v_updated INTEGER := 0;
BEGIN
  FOR v_creator IN
    SELECT id FROM creator_profiles ORDER BY created_at
  LOOP
    v_slot := i % 10;

    UPDATE creator_profiles
    SET
      bio = CASE v_slot
        WHEN 0 THEN 'Meta/TikTok 広告に特化した AI クリエイター。Sora 2 と Runway Gen-4 を組み合わせて、AB案を 1 週間で 30 案出すスタイル。CTR 改善実績多数。'
        WHEN 1 THEN 'Veo 3 のシネマグレード表現が得意。中堅企業のコーポレートサイトトップ動画を中心に、音響設計込みでブランド体験を構築します。'
        WHEN 2 THEN 'EC商品PRに特化。商品写真1枚から AI 生成で 30 秒動画を作る独自パイプライン。Shopify/BASE 出店者 100 社以上の取引実績。'
        WHEN 3 THEN 'TikTok 縦型広告に振り切ったクリエイター。Sora 2 + CapCut Pro + Suno でトレンド音源と AI 映像を高速量産。Z 世代エンゲージ最大化。'
        WHEN 4 THEN 'Runway Gen-4 × アーティスト MV 制作。インディーズアーティスト向けに、AI ならではの非現実表現で楽曲の世界観を拡張します。'
        WHEN 5 THEN 'SaaS プロダクト動画を専門。Midjourney × After Effects で UI 解説と AI 生成カットを組み合わせ、複雑な機能を 1 分で理解させる構成が得意。'
        WHEN 6 THEN 'Kling 2.x × Photoshop × Live2D で「アニメ調キャラクター広告」を制作。キャラクターブランディング提案も可能、アニメ業界作画経験 10 年。'
        WHEN 7 THEN 'AI で「人を映さない採用動画」を確立。Veo 3 + Sora 2 でプライバシー配慮 + 撮影コストゼロ。中堅企業の応募者数 150% 実績。'
        WHEN 8 THEN 'Midjourney × Stable Diffusion で AI 静止画クリエイティブ制作。Meta 広告バナー / EC 商品ビジュアルを 5 営業日で 50 枚納品スタイル。'
        ELSE      'AI ブランドムービー専門。ElevenLabs ナレーション + Veo 3 映像 + Suno BGM の組み合わせで、フル AI ワークフローを実現しています。'
      END,
      ai_tools = CASE v_slot
        WHEN 0 THEN ARRAY['Sora 2','Runway Gen-4','CapCut Pro','Premiere Pro']
        WHEN 1 THEN ARRAY['Veo 3','ElevenLabs','DaVinci Resolve']
        WHEN 2 THEN ARRAY['Midjourney','Kling 2.x','After Effects']
        WHEN 3 THEN ARRAY['Sora 2','CapCut Pro','Suno']
        WHEN 4 THEN ARRAY['Runway Gen-4','Stable Diffusion','Premiere Pro']
        WHEN 5 THEN ARRAY['Midjourney','After Effects','Veo 3']
        WHEN 6 THEN ARRAY['Kling 2.x','Photoshop','Live2D']
        WHEN 7 THEN ARRAY['Veo 3','Sora 2','Premiere Pro']
        WHEN 8 THEN ARRAY['Midjourney','Stable Diffusion','Flux','Photoshop']
        ELSE      ARRAY['Veo 3','ElevenLabs','Suno','DaVinci Resolve']
      END,
      video_lengths = CASE v_slot
        WHEN 0 THEN ARRAY['〜15秒(SNS広告標準)','〜30秒(SNS広告長め)']
        WHEN 1 THEN ARRAY['〜60秒','1〜3分(解説動画 / ショートドラマ)']
        WHEN 2 THEN ARRAY['〜15秒(SNS広告標準)','〜30秒(SNS広告長め)','ループ動画(無限再生用 / GIF代替)']
        WHEN 3 THEN ARRAY['〜6秒','〜15秒(SNS広告標準)']
        WHEN 4 THEN ARRAY['1〜3分(解説動画 / ショートドラマ)','3〜10分(長尺解説 / ドキュメンタリー)']
        WHEN 5 THEN ARRAY['〜60秒','1〜3分(解説動画 / ショートドラマ)']
        WHEN 6 THEN ARRAY['〜15秒(SNS広告標準)','〜30秒(SNS広告長め)']
        WHEN 7 THEN ARRAY['〜60秒','1〜3分(解説動画 / ショートドラマ)']
        WHEN 8 THEN ARRAY['ループ動画(無限再生用 / GIF代替)']
        ELSE      ARRAY['〜60秒','1〜3分(解説動画 / ショートドラマ)','3〜10分(長尺解説 / ドキュメンタリー)']
      END,
      strengths = CASE v_slot
        WHEN 0 THEN ARRAY['スピード納品','トレンド先取り型']
        WHEN 1 THEN ARRAY['こだわり高品質型','映像制作会社出身']
        WHEN 2 THEN ARRAY['スピード納品','気軽に相談OK']
        WHEN 3 THEN ARRAY['トレンド先取り型','1時間以内返信']
        WHEN 4 THEN ARRAY['こだわり高品質型','トレンド先取り型']
        WHEN 5 THEN ARRAY['大手企業実績あり','こだわり高品質型']
        WHEN 6 THEN ARRAY['映像制作会社出身','こだわり高品質型']
        WHEN 7 THEN ARRAY['大手企業実績あり','土日対応可能']
        WHEN 8 THEN ARRAY['スピード納品','緊急案件対応可']
        ELSE      ARRAY['多言語ローカライズ対応','大手企業実績あり']
      END,
      genres = CASE v_slot
        WHEN 0 THEN ARRAY['SNS広告動画','プロダクト紹介動画']
        WHEN 1 THEN ARRAY['ブランドムービー','新商品ローンチ動画']
        WHEN 2 THEN ARRAY['SNS広告動画','プロダクト紹介動画','LP用ヒーロー動画']
        WHEN 3 THEN ARRAY['SNS広告動画']
        WHEN 4 THEN ARRAY['ミュージックビデオ','ショートフィルム・アート映像']
        WHEN 5 THEN ARRAY['サービス解説動画(Explainer)','プロダクト紹介動画']
        WHEN 6 THEN ARRAY['AIアバター・キャラクター動画','SNS広告動画']
        WHEN 7 THEN ARRAY['採用動画','ブランドムービー']
        WHEN 8 THEN ARRAY['SNS広告動画','プロダクト紹介動画']
        ELSE      ARRAY['ブランドムービー','多言語ローカライズ動画','展示会・イベント映像']
      END
    WHERE id = v_creator.id;
    v_updated := v_updated + 1;
    i := i + 1;
  END LOOP;

  RAISE NOTICE '[00042] AI 特化に書き換えたクリエイター数: %', v_updated;
END $$;
