-- ============================================
-- Seed Re-apply (idempotent, email-driven)
-- Supabase SQL Editor で実行する想定。
--
-- 方針:
--  1. メールアドレスを「論理キー」として扱う。
--  2. auth.users に同じメールが居れば再利用、無ければ追加する。
--  3. 既存ユーザーの id を seed_user_map.actual_id に取り込み、以降の
--     creator_profiles / portfolio_items / service_packages / jobs は
--     その id に紐付ける。
--  4. 何度実行しても安全 (ON CONFLICT DO NOTHING を全箇所で使用)。
-- ============================================

-- 実行前の現状確認 ---------------------------
DO $$
DECLARE
  v_users INT;
  v_creators INT;
  v_portfolio INT;
  v_packages INT;
  v_clients INT;
  v_jobs INT;
BEGIN
  SELECT count(*) INTO v_users FROM auth.users
    WHERE email IN ('tanaka@example.com','suzuki@example.com','sato@example.com','takahashi@example.com',
                    'yamada@example.com','ito@example.com','nakamura@example.com','kobayashi@example.com',
                    'watanabe@example.com','kato@example.com','yoshida@example.com','matsumoto@example.com',
                    'inoue@example.com','kimura@example.com','hayashi@example.com','shimizu@example.com',
                    'saito@example.com','yamamoto@example.com','mori@example.com','ogawa@example.com');
  SELECT count(*) INTO v_creators  FROM creator_profiles WHERE id::text LIKE 'c0000000-%';
  SELECT count(*) INTO v_portfolio FROM portfolio_items  WHERE id::text LIKE 'd0000000-%';
  SELECT count(*) INTO v_packages  FROM service_packages WHERE id::text LIKE 'e0000000-%';
  SELECT count(*) INTO v_clients   FROM client_profiles  WHERE id::text LIKE 'c1000000-%';
  SELECT count(*) INTO v_jobs      FROM jobs             WHERE id::text LIKE 'f0000000-%';
  RAISE NOTICE 'BEFORE -- seed users(by email):% creator_profiles:% portfolio_items:% service_packages:% client_profiles:% jobs:%',
    v_users, v_creators, v_portfolio, v_packages, v_clients, v_jobs;
END$$;

-- ============================================
-- 0) seed_user_map: 論理id ⇔ email ⇔ 実際の auth.users.id
-- ============================================
DROP TABLE IF EXISTS seed_user_map;
CREATE TEMP TABLE seed_user_map (
  logical_id  UUID PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url  TEXT,
  is_verified BOOLEAN,
  actual_id   UUID            -- 後で埋める
);

INSERT INTO seed_user_map (logical_id, email, display_name, avatar_url, is_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'tanaka@example.com',     '田中 映像',           'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000002', 'suzuki@example.com',     '鈴木 クリエイティブ', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000003', 'sato@example.com',       '佐藤 モーション',     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000004', 'takahashi@example.com',  '高橋 ウェディング',   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000005', 'yamada@example.com',     '山田 デジタル',       'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', FALSE),
('00000000-0000-0000-0000-000000000006', 'ito@example.com',        '伊藤 フィルム',       'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000007', 'nakamura@example.com',   '中村 アニメーション', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000008', 'kobayashi@example.com',  '小林 CM制作',         'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000009', 'watanabe@example.com',   '渡辺 ショートドラマ', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000010', 'kato@example.com',       '加藤 MV制作',         'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000011', 'yoshida@example.com',    '吉田 教育映像',       'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', FALSE),
('00000000-0000-0000-0000-000000000012', 'matsumoto@example.com',  '松本 SNSクリエイター','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000013', 'inoue@example.com',      '井上 バラエティ',     'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000014', 'kimura@example.com',     '木村 商品撮影',       'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000015', 'hayashi@example.com',    '林 インタビュー映像', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000016', 'shimizu@example.com',    '清水 マニュアル動画', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face', FALSE),
('00000000-0000-0000-0000-000000000017', 'saito@example.com',      '斎藤 CG映像',         'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000018', 'yamamoto@example.com',   '山本 縦型動画',       'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000019', 'mori@example.com',       '森 企業ブランディング','https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face', TRUE),
('00000000-0000-0000-0000-000000000020', 'ogawa@example.com',      '小川 イベント映像',   'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=150&h=150&fit=crop&crop=face', TRUE);

-- ============================================
-- 1) auth.users: 無いメールだけ追加 (ON CONFLICT DO NOTHING で id/email どちらの重複も無視)
-- ============================================
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
SELECT m.logical_id,
       '00000000-0000-0000-0000-000000000000'::uuid,
       'authenticated', 'authenticated',
       m.email,
       crypt('password123', gen_salt('bf')),
       now(),
       jsonb_build_object('display_name', m.display_name, 'role', 'creator'),
       now(), now()
FROM seed_user_map m
ON CONFLICT DO NOTHING;

-- 実際の id を seed_user_map.actual_id に取り込み
UPDATE seed_user_map m
   SET actual_id = u.id
  FROM auth.users u
 WHERE u.email = m.email;

-- ============================================
-- 2) auth.identities: 自分が新規挿入したユーザー (actual_id = logical_id) のみ追加
-- ============================================
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT m.actual_id, m.actual_id, m.actual_id::text, 'email',
       jsonb_build_object('sub', m.actual_id::text, 'email', m.email),
       now(), now(), now()
FROM seed_user_map m
WHERE m.actual_id = m.logical_id
ON CONFLICT DO NOTHING;

-- ============================================
-- 3) profiles: trigger で作成されている想定だが、欠けていれば追加し、avatar 等を反映
-- ============================================
INSERT INTO profiles (id, role, email, display_name, avatar_url, is_verified)
SELECT m.actual_id, 'creator'::user_role, m.email, m.display_name, m.avatar_url, m.is_verified
FROM seed_user_map m
WHERE m.actual_id IS NOT NULL
ON CONFLICT (id) DO UPDATE
   SET avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
       is_verified  = EXCLUDED.is_verified,
       display_name = EXCLUDED.display_name,
       role         = 'creator';

-- ============================================
-- 4) seed_creator_data: クリエイター本体データ
-- ============================================
DROP TABLE IF EXISTS seed_creator_data;
CREATE TEMP TABLE seed_creator_data (
  creator_id UUID PRIMARY KEY,
  email      TEXT NOT NULL,
  bio        TEXT NOT NULL,
  skills     TEXT[] NOT NULL,
  genres     TEXT[] NOT NULL,
  location   TEXT,
  years_of_experience INT NOT NULL,
  rating     NUMERIC(2,1) NOT NULL,
  review_count INT NOT NULL
);

INSERT INTO seed_creator_data VALUES
('c0000000-0000-0000-0000-000000000001', 'tanaka@example.com',
 '映像制作歴10年。企業VPやミュージックビデオを中心に、年間50本以上の制作実績があります。ストーリー性のある映像で、クライアントのメッセージを的確に伝えます。',
 ARRAY['Premiere Pro', 'After Effects', 'カラーグレーディング', 'ドローン撮影'],
 ARRAY['企業VP', 'ミュージックビデオ', '広告・CM'],
 '東京都', 10, 4.9, 127),
('c0000000-0000-0000-0000-000000000002', 'suzuki@example.com',
 'YouTube動画編集のスペシャリスト。チャンネル登録者100万人超のYouTuberを複数担当。テンポの良いカット編集とエンタメ性の高い演出が得意です。',
 ARRAY['Premiere Pro', 'After Effects', 'モーショングラフィックス', 'サウンドデザイン'],
 ARRAY['YouTube動画', 'SNS動画', '商品紹介'],
 '大阪府', 5, 4.8, 89),
('c0000000-0000-0000-0000-000000000003', 'sato@example.com',
 'モーショングラフィックスと3DCGを専門としています。テレビCMやWeb広告の制作実績多数。インパクトのあるビジュアルで訴求力の高い映像を制作します。',
 ARRAY['After Effects', '3DCG', 'モーショングラフィックス', 'DaVinci Resolve'],
 ARRAY['広告・CM', 'アニメーション', 'SNS動画'],
 '東京都', 8, 4.7, 64),
('c0000000-0000-0000-0000-000000000004', 'takahashi@example.com',
 'ウェディングビデオグラファー歴7年。300組以上のカップルの最高の瞬間を映像に残してきました。シネマティックな映像美で感動の1日を形にします。',
 ARRAY['Final Cut Pro', 'DaVinci Resolve', 'カラーグレーディング', 'ドローン撮影'],
 ARRAY['ウェディング', 'イベント撮影', 'ドキュメンタリー'],
 '神奈川県', 7, 4.9, 203),
('c0000000-0000-0000-0000-000000000005', 'yamada@example.com',
 'SNS動画マーケティングのプロフェッショナル。TikTok、Instagram Reels、YouTube Shortsに最適化された縦型動画の制作が得意。企業のSNS運用支援も行っています。',
 ARRAY['Premiere Pro', 'After Effects', 'モーショングラフィックス', 'TikTok'],
 ARRAY['SNS動画', '広告・CM', '商品紹介'],
 '福岡県', 3, 4.6, 42),
('c0000000-0000-0000-0000-000000000006', 'ito@example.com',
 'ドキュメンタリー映像作家。社会問題やカルチャーをテーマにした作品を多数手がけています。映画祭での受賞歴あり。企業のブランドムービーも得意です。',
 ARRAY['DaVinci Resolve', 'Premiere Pro', 'カラーグレーディング', '撮影ディレクション'],
 ARRAY['ドキュメンタリー', '企業VP', 'イベント撮影'],
 '京都府', 12, 4.8, 31),
('c0000000-0000-0000-0000-000000000007', 'nakamura@example.com',
 '3DCGアニメーションを専門にしています。Blender/Cinema4Dを用いたフォトリアルからスタイライズドまで幅広く対応。テレビCMや企業VPでのCGパート制作実績多数。',
 ARRAY['Blender', 'Cinema 4D', 'After Effects', 'Houdini'],
 ARRAY['CGアニメーション', 'テレビCM', '商品・製品紹介'],
 '東京都', 6, 4.8, 52),
('c0000000-0000-0000-0000-000000000008', 'kobayashi@example.com',
 'テレビCM・Web CM専門の映像ディレクター。大手広告代理店出身。コンセプト立案から撮影・編集まで一貫して対応できます。',
 ARRAY['Premiere Pro', 'DaVinci Resolve', '撮影ディレクション', 'カラーグレーディング'],
 ARRAY['テレビCM', 'サービス紹介', '会社・学校紹介'],
 '東京都', 15, 4.9, 98),
('c0000000-0000-0000-0000-000000000009', 'watanabe@example.com',
 'ショートドラマ・ストーリー型映像を得意としています。脚本から演出・撮影・編集までワンストップ。SNS向けの縦型ショートドラマも多数制作。',
 ARRAY['Premiere Pro', 'After Effects', '脚本', '演出'],
 ARRAY['ショートドラマ', 'Youtubeショート【縦型】', 'Instagram【縦型】'],
 '大阪府', 4, 4.7, 38),
('c0000000-0000-0000-0000-000000000010', 'kato@example.com',
 'ミュージックビデオ制作歴8年。アーティストの世界観を映像で表現します。実写・CG・アニメーションのハイブリッド手法が得意。',
 ARRAY['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Cinema 4D'],
 ARRAY['MV', 'CGアニメーション', 'ショートドラマ'],
 '東京都', 8, 4.9, 76),
('c0000000-0000-0000-0000-000000000011', 'yoshida@example.com',
 '教育・研修動画のスペシャリスト。eラーニングコンテンツ、社内研修映像、マニュアル動画の制作を得意としています。わかりやすさを第一に。',
 ARRAY['Premiere Pro', 'After Effects', 'モーショングラフィックス', 'PowerPoint連携'],
 ARRAY['教育・研修', 'マニュアル・HowTo', 'インタビュー'],
 '愛知県', 5, 4.5, 29),
('c0000000-0000-0000-0000-000000000012', 'matsumoto@example.com',
 'SNS動画に特化したクリエイター。TikTok・Instagram Reels・YouTube Shortsのアルゴリズムを熟知。バズる動画の企画・制作が強みです。',
 ARRAY['Premiere Pro', 'CapCut', 'After Effects', 'Photoshop', 'TikTok'],
 ARRAY['Youtubeショート【縦型】', 'Instagram【縦型】', 'X【縦型】', 'Facebook【縦型】'],
 '東京都', 3, 4.6, 67),
('c0000000-0000-0000-0000-000000000013', 'inoue@example.com',
 'バラエティ・エンタメ系映像の編集が得意。YouTubeのバラエティチャンネルを複数担当中。テンポの良い編集とユーモアのある演出が持ち味。',
 ARRAY['Premiere Pro', 'After Effects', 'サウンドデザイン', 'モーショングラフィックス'],
 ARRAY['バラエティ', 'Youtubeショート【縦型】', 'インタビュー'],
 '東京都', 4, 4.7, 55),
('c0000000-0000-0000-0000-000000000014', 'kimura@example.com',
 '商品撮影・プロダクトムービーに特化。食品・コスメ・家電などの魅力を最大限に引き出す映像制作を行います。スタジオ撮影にも対応。',
 ARRAY['Premiere Pro', 'DaVinci Resolve', 'カラーグレーディング', 'ライティング'],
 ARRAY['商品・製品紹介', 'テレビCM', 'Instagram【縦型】'],
 '神奈川県', 7, 4.8, 43),
('c0000000-0000-0000-0000-000000000015', 'hayashi@example.com',
 'インタビュー映像・ドキュメンタリー制作を得意としています。人物の魅力を引き出す聞き手としてのスキルも評価されています。',
 ARRAY['Premiere Pro', 'Final Cut Pro', 'カラーグレーディング', '撮影ディレクション'],
 ARRAY['インタビュー', '会社・学校紹介', '教育・研修'],
 '福岡県', 9, 4.8, 61),
('c0000000-0000-0000-0000-000000000016', 'shimizu@example.com',
 'マニュアル・HowTo動画の制作に注力。製品の使い方、ソフトウェアの操作説明、業務手順書の映像化を専門としています。',
 ARRAY['Premiere Pro', 'After Effects', 'Camtasia', 'モーショングラフィックス'],
 ARRAY['マニュアル・HowTo', '教育・研修', 'サービス紹介'],
 '北海道', 4, 4.4, 22),
('c0000000-0000-0000-0000-000000000017', 'saito@example.com',
 'ハイエンドCG映像制作。建築ビジュアライゼーション、製品CGアニメーション、VFXを得意としています。映画・CMでのVFX実績あり。',
 ARRAY['Blender', 'Houdini', 'Nuke', 'After Effects'],
 ARRAY['CGアニメーション', 'テレビCM', 'MV'],
 '東京都', 10, 4.9, 41),
('c0000000-0000-0000-0000-000000000018', 'yamamoto@example.com',
 '縦型動画のプロフェッショナル。TikTok・Reels・Shortsに最適化されたコンテンツ企画から制作まで一貫対応。100本以上の運用実績。',
 ARRAY['Premiere Pro', 'CapCut', 'After Effects', 'Canva', 'TikTok'],
 ARRAY['Youtubeショート【縦型】', 'Instagram【縦型】', 'X【縦型】', 'Facebook【縦型】'],
 '大阪府', 2, 4.5, 34),
('c0000000-0000-0000-0000-000000000019', 'mori@example.com',
 '企業ブランディング映像の専門家。ブランドストーリーを映像で語る力に定評があります。ナショナルクライアントの実績多数。',
 ARRAY['Premiere Pro', 'DaVinci Resolve', 'カラーグレーディング', '撮影ディレクション'],
 ARRAY['会社・学校紹介', 'サービス紹介', 'インタビュー'],
 '東京都', 12, 4.9, 87),
('c0000000-0000-0000-0000-000000000020', 'ogawa@example.com',
 'イベント・セミナーの映像記録を専門としています。マルチカメラ撮影、ライブ配信、ハイライト映像制作まで対応。年間50件以上の実績。',
 ARRAY['Premiere Pro', 'Final Cut Pro', 'OBS', 'マルチカメラ'],
 ARRAY['バラエティ', 'インタビュー', '教育・研修'],
 '千葉県', 6, 4.6, 48);

-- creator_profiles に email 経由で actual_id を紐付け
INSERT INTO creator_profiles (id, user_id, bio, skills, genres, location, years_of_experience, rating, review_count)
SELECT cd.creator_id, sum.actual_id, cd.bio, cd.skills, cd.genres, cd.location, cd.years_of_experience, cd.rating, cd.review_count
FROM seed_creator_data cd
JOIN seed_user_map sum ON sum.email = cd.email
WHERE sum.actual_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- email 既存ユーザー(別 user_id) に対しては user_id を更新 (creator_profiles.user_id UNIQUE なので注意)
-- 旧 user_id の creator_profiles が存在しても今回上書きはしない (DO NOTHING)。
-- もし既存の creator_profiles の user_id が古い 000000... のままで、その auth.users が消えている等のズレがあれば再リンク:
UPDATE creator_profiles cp
   SET user_id = sum.actual_id
  FROM seed_user_map sum, seed_creator_data cd
 WHERE cp.id = cd.creator_id
   AND cd.email = sum.email
   AND sum.actual_id IS NOT NULL
   AND cp.user_id <> sum.actual_id
   AND NOT EXISTS (
     SELECT 1 FROM creator_profiles cp2
      WHERE cp2.user_id = sum.actual_id AND cp2.id <> cp.id
   );

-- ============================================
-- 5) portfolio_items
-- ============================================
INSERT INTO portfolio_items (id, creator_id, title, description, video_url, video_platform, thumbnail_url, genre, tags) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '株式会社ABC 企業紹介映像', '企業の理念と事業内容を3分にまとめた紹介映像', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=640&h=360&fit=crop', '企業VP', ARRAY['企業VP', 'インタビュー', 'ドローン']),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '人気YouTuber コラボ企画動画', 'エンタメ系YouTubeチャンネルのコラボ企画動画編集', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=640&h=360&fit=crop', 'YouTube動画', ARRAY['YouTube', 'エンタメ', 'バラエティ']),
('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '新商品ローンチ Web CM', '3DCGとモーショングラフィックスを活用した15秒Web CM', 'https://vimeo.com/123456789', 'vimeo', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=640&h=360&fit=crop', '広告・CM', ARRAY['CM', '3DCG', 'モーショングラフィックス']),
('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', 'ウェディングハイライト - 海辺の挙式', '湘南の海を背景にしたリゾートウェディングのハイライト映像', 'https://vimeo.com/987654321', 'vimeo', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=640&h=360&fit=crop', 'ウェディング', ARRAY['ウェディング', 'シネマティック', 'ドローン']),
('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'アパレルブランド Instagram Reels', '新作コレクションのSNS向けプロモーション動画', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=640&h=360&fit=crop', 'SNS動画', ARRAY['SNS', 'Instagram', 'ファッション']),
('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '伝統工芸の未来 - ドキュメンタリー', '京都の伝統工芸職人に密着したドキュメンタリー短編', 'https://vimeo.com/111222333', 'vimeo', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&h=360&fit=crop', 'ドキュメンタリー', ARRAY['ドキュメンタリー', '伝統工芸', 'カルチャー']),
('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', '家電メーカー 新製品CGアニメーション', '製品の内部構造を3DCGで可視化したプロモーション映像', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['3DCG', 'プロダクト', 'アニメーション']),
('d0000000-0000-0000-0000-000000000107', 'c0000000-0000-0000-0000-000000000007', '建築ビジュアライゼーション', '未完成の建物をCGで再現したウォークスルー映像', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['建築', 'CG', 'ウォークスルー']),
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', '大手飲料メーカー テレビCM 30秒', '夏季キャンペーン向けCM。爽やかなビジュアルで商品の魅力を訴求', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&h=360&fit=crop', 'テレビCM', ARRAY['CM', '飲料', 'テレビ']),
('d0000000-0000-0000-0000-000000000108', 'c0000000-0000-0000-0000-000000000008', 'IT企業 サービス紹介CM', 'SaaSサービスの特徴をわかりやすく伝える60秒CM', 'https://vimeo.com/123456789', 'vimeo', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&h=360&fit=crop', 'サービス紹介', ARRAY['IT', 'SaaS', 'CM']),
('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'SNSショートドラマ「最後の5分」', 'Instagram向け縦型ショートドラマ。再生数100万回突破', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&h=360&fit=crop', 'ショートドラマ', ARRAY['ショートドラマ', 'SNS', '縦型']),
('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'アーティスト「星の海」MV', 'CG×実写のハイブリッド手法で幻想的な世界観を表現', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop', 'MV', ARRAY['MV', 'CG', '実写']),
('d0000000-0000-0000-0000-000000000110', 'c0000000-0000-0000-0000-000000000010', 'バンド「夜明け前」MV', 'ワンカット風の映像演出が話題に。YouTube再生数500万回', 'https://vimeo.com/987654321', 'vimeo', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=360&fit=crop', 'MV', ARRAY['MV', 'バンド', 'ワンカット']),
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', '大手メーカー 社内研修eラーニング', '新入社員向け研修動画シリーズ全20本', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&h=360&fit=crop', '教育・研修', ARRAY['eラーニング', '研修', '企業']),
('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'アパレルブランド TikTok運用', '月15本の縦型動画制作。フォロワー10万人達成に貢献', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=640&h=360&fit=crop', 'Youtubeショート【縦型】', ARRAY['TikTok', 'アパレル', '縦型']),
('d0000000-0000-0000-0000-000000000112', 'c0000000-0000-0000-0000-000000000012', 'コスメブランド Instagram Reels', 'メイクチュートリアル型のプロモーション動画', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=640&h=360&fit=crop', 'Instagram【縦型】', ARRAY['Instagram', 'コスメ', 'メイク']),
('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000013', '人気YouTuber 企画動画編集', '登録者200万人のチャンネルのレギュラー編集を担当', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=640&h=360&fit=crop', 'バラエティ', ARRAY['YouTube', 'バラエティ', '企画']),
('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000014', '高級時計ブランド プロダクトムービー', '時計の精緻なディテールを映し出すシネマティックな映像', 'https://vimeo.com/111222333', 'vimeo', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&h=360&fit=crop', '商品・製品紹介', ARRAY['商品撮影', '高級時計', 'シネマティック']),
('d0000000-0000-0000-0000-000000000114', 'c0000000-0000-0000-0000-000000000014', '食品メーカー 商品PR動画', '食品のシズル感を最大限に引き出した15秒動画', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=640&h=360&fit=crop', '商品・製品紹介', ARRAY['食品', 'シズル', '商品PR']),
('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000015', '経営者インタビューシリーズ', 'スタートアップCEO10名の想いを映像化', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&h=360&fit=crop', 'インタビュー', ARRAY['インタビュー', '経営者', 'ドキュメンタリー']),
('d0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000016', 'SaaS操作マニュアル動画', '画面キャプチャとナレーションで操作手順をわかりやすく解説', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&h=360&fit=crop', 'マニュアル・HowTo', ARRAY['SaaS', 'マニュアル', '操作説明']),
('d0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000017', '映画VFXショット', '実写合成のハイエンドVFXリール', 'https://vimeo.com/111222333', 'vimeo', 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['VFX', '映画', 'CG']),
('d0000000-0000-0000-0000-000000000117', 'c0000000-0000-0000-0000-000000000017', '自動車メーカー CGプロモーション', '新型車のCGビジュアライゼーション', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['自動車', 'CG', 'プロモーション']),
('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000018', '飲食チェーン TikTokプロモーション', '新メニュー紹介の縦型動画。単体で300万再生', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=640&h=360&fit=crop', 'Youtubeショート【縦型】', ARRAY['飲食', 'TikTok', '縦型']),
('d0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000019', '老舗旅館 ブランドムービー', '100年の歴史と現代のおもてなしを映像で表現', 'https://vimeo.com/987654321', 'vimeo', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=640&h=360&fit=crop', '会社・学校紹介', ARRAY['旅館', 'ブランディング', 'シネマティック']),
('d0000000-0000-0000-0000-000000000119', 'c0000000-0000-0000-0000-000000000019', 'スタートアップ 企業紹介映像', 'ミッション・ビジョンを伝えるコーポレートムービー', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=360&fit=crop', '会社・学校紹介', ARRAY['スタートアップ', '企業紹介', 'ミッション']),
('d0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000020', 'テックカンファレンス 記録映像', '3000人規模のカンファレンスをマルチカメラで収録', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&h=360&fit=crop', 'バラエティ', ARRAY['カンファレンス', 'イベント', 'マルチカメラ'])
ON CONFLICT (id) DO NOTHING;

UPDATE portfolio_items SET has_publish_permission = TRUE WHERE id::text LIKE 'd0000000-%';

-- ============================================
-- 5b) portfolio_items の video_platform を縦型/SNS系に張り替え
-- 注意: 先にマイグレーション 00019 (enum拡張) を適用しておくこと。
--   - youtube_short / tiktok / instagram の値が enum に無いと UPDATE が失敗する。
-- ============================================
UPDATE portfolio_items
   SET video_platform = 'instagram',
       video_url = 'https://www.instagram.com/reel/SAMPLE_REEL_005/'
 WHERE id = 'd0000000-0000-0000-0000-000000000005';  -- アパレルブランド Instagram Reels

UPDATE portfolio_items
   SET video_platform = 'instagram',
       video_url = 'https://www.instagram.com/reel/SAMPLE_REEL_009/'
 WHERE id = 'd0000000-0000-0000-0000-000000000009';  -- SNSショートドラマ「最後の5分」

UPDATE portfolio_items
   SET video_platform = 'tiktok',
       video_url = 'https://www.tiktok.com/@apparel_seed/video/7000000000000000012'
 WHERE id = 'd0000000-0000-0000-0000-000000000012';  -- アパレルブランド TikTok運用

UPDATE portfolio_items
   SET video_platform = 'instagram',
       video_url = 'https://www.instagram.com/reel/SAMPLE_REEL_112/'
 WHERE id = 'd0000000-0000-0000-0000-000000000112';  -- コスメブランド Instagram Reels

UPDATE portfolio_items
   SET video_platform = 'tiktok',
       video_url = 'https://www.tiktok.com/@food_seed/video/7000000000000000018'
 WHERE id = 'd0000000-0000-0000-0000-000000000018';  -- 飲食チェーン TikTokプロモーション

UPDATE portfolio_items
   SET video_platform = 'youtube_short',
       video_url = 'https://www.youtube.com/shorts/abcDEFghij1'
 WHERE id = 'd0000000-0000-0000-0000-000000000114';  -- 食品メーカー 商品PR動画 (15秒)


-- ============================================
-- 6) service_packages
-- ============================================
INSERT INTO service_packages (id, creator_id, name, description, price, delivery_days, revisions, features) VALUES
('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'スタンダード', '企業紹介動画（3分以内）', 300000, 14, 2, ARRAY['企画構成', '撮影1日', '編集', 'BGM選定', '修正2回']),
('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'プレミアム', '企業紹介動画（5分以内）+ ショートVer.', 500000, 21, 3, ARRAY['企画構成', '撮影2日', '編集', 'BGM・SE', 'モーショングラフィックス', 'ショートVer.制作', '修正3回']),
('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'ベーシック', 'YouTube動画編集（10分以内）', 30000, 5, 1, ARRAY['カット編集', 'テロップ挿入', 'BGM', 'SE', 'サムネイル制作']),
('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'プロ', 'YouTube動画編集（20分以内）+ モーション', 60000, 7, 2, ARRAY['カット編集', 'テロップ挿入', 'BGM', 'SE', 'モーショングラフィックス', 'サムネイル制作', '修正2回']),
('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'モーション ベーシック', 'モーショングラフィックス動画（30秒以内）', 150000, 10, 2, ARRAY['コンセプト設計', 'モーション制作', 'BGM・SE', '修正2回']),
('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'ハイライト', '挙式当日のハイライト映像（3〜5分）', 200000, 30, 2, ARRAY['挙式当日撮影', 'ハイライト編集', 'カラーグレーディング', 'BGM選定', '修正2回']),
('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'フルパッケージ', '前撮り + 挙式当日 + エンドロール', 450000, 45, 3, ARRAY['前撮り撮影', '挙式当日撮影', 'ハイライト映像', 'エンドロール', 'ドローン撮影', '修正3回']),
('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'SNS動画 単発', '縦型ショート動画1本（60秒以内）', 15000, 3, 1, ARRAY['カット編集', 'テロップ', 'BGM', 'フォーマット最適化']),
('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000005', 'SNS動画 月額', '月8本のショート動画制作', 100000, 30, 2, ARRAY['月8本制作', '企画提案', 'カット編集', 'テロップ', 'BGM', '投稿スケジュール管理']),
('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000006', 'ブランドムービー', '企業ブランドストーリー映像（5分以内）', 800000, 30, 3, ARRAY['企画・構成', '撮影3日', 'インタビュー撮影', '編集', 'カラーグレーディング', 'ナレーション', '修正3回']),
('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000007', 'CGアニメーション ベーシック', '30秒以内の3DCGアニメーション', 200000, 14, 2, ARRAY['3Dモデリング', 'アニメーション', 'レンダリング', 'コンポジット', '修正2回']),
('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000008', 'CM制作 スタンダード', 'テレビCM 30秒（企画〜編集）', 600000, 21, 3, ARRAY['企画・構成', '撮影2日', '編集', 'カラーグレーディング', 'BGM・SE', '修正3回']),
('e0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000009', 'ショートドラマ 1本', 'SNS向け縦型ショートドラマ（3分以内）', 150000, 14, 2, ARRAY['脚本', '撮影1日', '演出', '編集', '修正2回']),
('e0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000010', 'MV制作 スタンダード', 'ミュージックビデオ1曲分', 400000, 21, 3, ARRAY['企画・演出', '撮影2日', '編集', 'カラーグレーディング', 'VFX', '修正3回']),
('e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000011', '研修動画 ベーシック', 'eラーニング動画1本（15分以内）', 80000, 10, 2, ARRAY['構成', '撮影/画面収録', '編集', 'テロップ', '修正2回']),
('e0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000012', 'SNS動画 月額運用', '月10本の縦型動画制作', 120000, 30, 2, ARRAY['企画提案', '撮影/素材制作', '編集', 'テロップ', 'BGM', '投稿最適化']),
('e0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000013', 'YouTube動画編集 1本', 'バラエティ系動画編集（15分以内）', 40000, 5, 1, ARRAY['カット編集', 'テロップ', 'BGM・SE', 'サムネイル制作']),
('e0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000014', '商品撮影+動画制作', '商品プロモーション動画（60秒以内）', 250000, 14, 2, ARRAY['スタジオ撮影', 'ライティング', '編集', 'カラーグレーディング', '修正2回']),
('e0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000015', 'インタビュー映像', 'インタビュー撮影+編集（5分以内）', 180000, 14, 2, ARRAY['撮影1日', 'インタビュー進行', '編集', 'テロップ', '修正2回']),
('e0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000016', 'マニュアル動画 1本', '操作説明動画（10分以内）', 60000, 7, 2, ARRAY['画面収録', 'ナレーション', 'テロップ', 'BGM', '修正2回']),
('e0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000017', 'ハイエンドCG', 'フォトリアルCGアニメーション（30秒）', 500000, 21, 3, ARRAY['モデリング', 'シミュレーション', 'レンダリング', 'コンポジット', 'VFX', '修正3回']),
('e0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000018', '縦型動画 単発', 'TikTok/Reels向け動画1本', 20000, 3, 1, ARRAY['企画', '撮影/素材制作', '編集', 'テロップ', 'BGM']),
('e0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000019', 'ブランドムービー', '企業ブランドストーリー映像（3-5分）', 700000, 28, 3, ARRAY['企画・構成', '撮影3日', 'インタビュー', '編集', 'カラーグレーディング', 'ナレーション', '修正3回']),
('e0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000020', 'イベント映像 ハイライト', 'イベント撮影+ハイライト映像（3分）', 200000, 14, 2, ARRAY['マルチカメラ撮影', '当日対応', 'ハイライト編集', 'BGM', '修正2回'])
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7) client_profiles (案件依頼の発注元)
-- すでに同じ user_id で client_profiles 行があれば追加しない。
-- jobs から参照する client_id は seed_client_map.actual_id を使うので、
-- 既存行/新規行どちらでも整合する。
-- ============================================
INSERT INTO client_profiles (id, user_id, company_name, company_url, industry)
SELECT v.id, sum.actual_id, v.company_name, v.company_url, v.industry
FROM (VALUES
  ('c1000000-0000-0000-0000-000000000001'::uuid, 'tanaka@example.com', '株式会社テックサンプル',     'https://example.com', 'IT・通信'),
  ('c1000000-0000-0000-0000-000000000002'::uuid, 'suzuki@example.com', '株式会社メディアクリエイト', 'https://example.com', 'メディア・エンタメ'),
  ('c1000000-0000-0000-0000-000000000003'::uuid, 'sato@example.com',   '合同会社フードデリバリー',   'https://example.com', '飲食・サービス')
) AS v(id, email, company_name, company_url, industry)
JOIN seed_user_map sum ON sum.email = v.email
WHERE sum.actual_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 実際の client_profiles.id を取得 (既存行 or 新規行どちらでも対応)
DROP TABLE IF EXISTS seed_client_map;
CREATE TEMP TABLE seed_client_map (
  email TEXT PRIMARY KEY,
  actual_id UUID
);

INSERT INTO seed_client_map (email, actual_id)
SELECT sum.email, cp.id
FROM client_profiles cp
JOIN seed_user_map sum ON sum.actual_id = cp.user_id
WHERE sum.email IN ('tanaka@example.com', 'suzuki@example.com', 'sato@example.com');

-- ============================================
-- 8) jobs (編集要件入り) — seed_client_map.actual_id 経由で client_id を解決
-- ============================================
INSERT INTO jobs (
  id, client_id, title, description, genres,
  budget_min, budget_max, deadline, delivery_deadline, status,
  footage_minutes, finish_duration_unit, finish_duration_min, finish_duration_max,
  count_min, count_max, work_types, revision_count, software_options, delivery_formats,
  delivery_days, reference_url, is_recurring, monthly_count, client_type
)
SELECT
  v.id,
  scm.actual_id,
  v.title, v.description, v.genres,
  v.budget_min, v.budget_max, v.deadline, v.delivery_deadline, v.status,
  v.footage_minutes, v.finish_duration_unit, v.finish_duration_min, v.finish_duration_max,
  v.count_min, v.count_max, v.work_types, v.revision_count, v.software_options, v.delivery_formats,
  v.delivery_days, v.reference_url, v.is_recurring, v.monthly_count, v.client_type
FROM (VALUES
(
  'f0000000-0000-0000-0000-000000000001'::uuid,
  'tanaka@example.com',
  '新サービスのプロモーション動画制作',
  E'BtoB SaaSサービスの紹介動画を制作していただけるクリエイターを募集しています。\n\n【概要】\n・サービスの特徴を分かりやすく伝える60秒の動画\n・ターゲット: IT企業の経営層・決裁者\n・テイスト: モダンでスタイリッシュ\n・モーショングラフィックス中心（実写不要）\n\n【求めるスキル】\n・モーショングラフィックス制作経験\n・BtoBサービスの映像制作経験があれば尚可',
  ARRAY['サービス紹介', 'CGアニメーション'],
  200000, 400000, DATE '2026-06-15', DATE '2026-07-30', 'open'::job_status,
  30, 'sec', 60::numeric, 60::numeric,
  1, 1,
  ARRAY['カット', 'テロップ', 'BGM', 'SE', 'MA'],
  2,
  ARRAY['AfterEffects', 'Premiere Pro'],
  ARRAY['MP4 1080p'],
  21, NULL::text, FALSE, NULL::int, 'sme'
),
(
  'f0000000-0000-0000-0000-000000000002'::uuid,
  'suzuki@example.com',
  'YouTube企業チャンネルの動画編集者募集（継続案件）',
  E'YouTube企業チャンネルの動画編集を継続的にお願いできるクリエイターを募集します。\n\n【概要】\n・月8本の動画編集（1本あたり10-15分）\n・テロップ、BGM、SE、サムネイル制作含む\n・バラエティ・インタビュー系のコンテンツ\n\n【求めるスキル】\n・YouTube動画の編集経験\n・テンポの良いカット編集\n・Adobe Premiere Pro使用必須',
  ARRAY['バラエティ', 'インタビュー', 'Youtubeショート【縦型】'],
  80000, 120000, DATE '2026-05-30', NULL::date, 'open'::job_status,
  90, 'min', 10::numeric, 15::numeric,
  8, 8,
  ARRAY['カット', 'テロップ', 'BGM', 'SE'],
  1,
  ARRAY['Premiere Pro'],
  ARRAY['MP4 1080p'],
  5, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', TRUE, 8, 'listed'
),
(
  'f0000000-0000-0000-0000-000000000003'::uuid,
  'sato@example.com',
  'Instagram/TikTok向け飲食店プロモーション動画',
  E'新店舗オープンに合わせて、SNS向けのプロモーション動画を制作していただきたいです。\n\n【概要】\n・Instagram Reels / TikTok向けの縦型動画5本セット\n・料理のシズル感を重視\n・店舗の雰囲気が伝わる映像\n・各動画15-30秒\n\n【撮影について】\n・東京都内の店舗で撮影\n・撮影日は応相談\n・食材・料理は準備します',
  ARRAY['Instagram【縦型】', 'Youtubeショート【縦型】', '商品・製品紹介'],
  150000, 300000, DATE '2026-05-20', DATE '2026-06-15', 'open'::job_status,
  60, 'sec', 15::numeric, 30::numeric,
  5, 5,
  ARRAY['カット', 'テロップ', 'BGM', 'カラグレ'],
  2,
  ARRAY['Premiere Pro', 'DaVinci'],
  ARRAY['MP4 1080p'],
  14, NULL::text, FALSE, NULL::int, 'individual'
)
) AS v(
  id, client_email, title, description, genres,
  budget_min, budget_max, deadline, delivery_deadline, status,
  footage_minutes, finish_duration_unit, finish_duration_min, finish_duration_max,
  count_min, count_max, work_types, revision_count, software_options, delivery_formats,
  delivery_days, reference_url, is_recurring, monthly_count, client_type
)
JOIN seed_client_map scm ON scm.email = v.client_email
WHERE scm.actual_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 実行後の結果確認 ---------------------------
DO $$
DECLARE
  v_users INT;
  v_creators INT;
  v_portfolio INT;
  v_packages INT;
  v_clients INT;
  v_jobs INT;
BEGIN
  SELECT count(*) INTO v_users FROM auth.users
    WHERE email IN ('tanaka@example.com','suzuki@example.com','sato@example.com','takahashi@example.com',
                    'yamada@example.com','ito@example.com','nakamura@example.com','kobayashi@example.com',
                    'watanabe@example.com','kato@example.com','yoshida@example.com','matsumoto@example.com',
                    'inoue@example.com','kimura@example.com','hayashi@example.com','shimizu@example.com',
                    'saito@example.com','yamamoto@example.com','mori@example.com','ogawa@example.com');
  SELECT count(*) INTO v_creators  FROM creator_profiles WHERE id::text LIKE 'c0000000-%';
  SELECT count(*) INTO v_portfolio FROM portfolio_items  WHERE id::text LIKE 'd0000000-%';
  SELECT count(*) INTO v_packages  FROM service_packages WHERE id::text LIKE 'e0000000-%';
  SELECT count(*) INTO v_clients   FROM client_profiles  WHERE id::text LIKE 'c1000000-%';
  SELECT count(*) INTO v_jobs      FROM jobs             WHERE id::text LIKE 'f0000000-%';
  RAISE NOTICE 'AFTER  -- seed users(by email):% creator_profiles:% portfolio_items:% service_packages:% client_profiles:% jobs:%',
    v_users, v_creators, v_portfolio, v_packages, v_clients, v_jobs;
  RAISE NOTICE 'Expected -- 20 / 20 / 27 / 24 / 3 / 3';
END$$;
