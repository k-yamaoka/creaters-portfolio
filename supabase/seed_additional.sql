-- ============================================
-- Additional Seed Data: 14 more creators (total 20)
-- ============================================

-- Step 1: auth.users
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nakamura@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "中村 アニメーション", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kobayashi@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "小林 CM制作", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'watanabe@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "渡辺 ショートドラマ", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kato@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "加藤 MV制作", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yoshida@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "吉田 教育映像", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matsumoto@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "松本 SNSクリエイター", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inoue@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "井上 バラエティ", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kimura@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "木村 商品撮影", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hayashi@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "林 インタビュー映像", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'shimizu@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "清水 マニュアル動画", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'saito@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "斎藤 CG映像", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yamamoto@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "山本 縦型動画", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mori@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "森 企業ブランディング", "role": "creator"}'::jsonb, now(), now()),
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ogawa@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "小川 イベント映像", "role": "creator"}'::jsonb, now(), now());

-- Step 2: auth.identities
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 'email', '{"sub":"00000000-0000-0000-0000-000000000007","email":"nakamura@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 'email', '{"sub":"00000000-0000-0000-0000-000000000008","email":"kobayashi@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009', 'email', '{"sub":"00000000-0000-0000-0000-000000000009","email":"watanabe@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'email', '{"sub":"00000000-0000-0000-0000-000000000010","email":"kato@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', 'email', '{"sub":"00000000-0000-0000-0000-000000000011","email":"yoshida@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012', 'email', '{"sub":"00000000-0000-0000-0000-000000000012","email":"matsumoto@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013', 'email', '{"sub":"00000000-0000-0000-0000-000000000013","email":"inoue@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014', 'email', '{"sub":"00000000-0000-0000-0000-000000000014","email":"kimura@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015', 'email', '{"sub":"00000000-0000-0000-0000-000000000015","email":"hayashi@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000016', 'email', '{"sub":"00000000-0000-0000-0000-000000000016","email":"shimizu@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000017', 'email', '{"sub":"00000000-0000-0000-0000-000000000017","email":"saito@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000018', 'email', '{"sub":"00000000-0000-0000-0000-000000000018","email":"yamamoto@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000019', 'email', '{"sub":"00000000-0000-0000-0000-000000000019","email":"mori@example.com"}'::jsonb, now(), now(), now()),
('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020', 'email', '{"sub":"00000000-0000-0000-0000-000000000020","email":"ogawa@example.com"}'::jsonb, now(), now(), now());

-- Step 3: Update profiles with avatars and verification
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000007';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000008';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000009';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000010';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', is_verified = false WHERE id = '00000000-0000-0000-0000-000000000011';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000012';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000013';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000014';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000015';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face', is_verified = false WHERE id = '00000000-0000-0000-0000-000000000016';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000017';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000018';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000019';
UPDATE profiles SET avatar_url = 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=150&h=150&fit=crop&crop=face', is_verified = true WHERE id = '00000000-0000-0000-0000-000000000020';

-- Step 4: Creator profiles
INSERT INTO creator_profiles (id, user_id, bio, skills, genres, location, years_of_experience, rating, review_count) VALUES
('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007',
 '3DCGアニメーションを専門にしています。Blender/Cinema4Dを用いたフォトリアルからスタイライズドまで幅広く対応。テレビCMや企業VPでのCGパート制作実績多数。',
 ARRAY['Blender', 'Cinema 4D', 'After Effects', 'Houdini'],
 ARRAY['CGアニメーション', 'テレビCM', '商品・製品紹介'],
 '東京都', 6, 4.8, 52),

('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008',
 'テレビCM・Web CM専門の映像ディレクター。大手広告代理店出身。コンセプト立案から撮影・編集まで一貫して対応できます。',
 ARRAY['Premiere Pro', 'DaVinci Resolve', '撮影ディレクション', 'カラーグレーディング'],
 ARRAY['テレビCM', 'サービス紹介', '会社・学校紹介'],
 '東京都', 15, 4.9, 98),

('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000009',
 'ショートドラマ・ストーリー型映像を得意としています。脚本から演出・撮影・編集までワンストップ。SNS向けの縦型ショートドラマも多数制作。',
 ARRAY['Premiere Pro', 'After Effects', '脚本', '演出'],
 ARRAY['ショートドラマ', 'Youtubeショート【縦型】', 'Instagram【縦型】'],
 '大阪府', 4, 4.7, 38),

('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010',
 'ミュージックビデオ制作歴8年。アーティストの世界観を映像で表現します。実写・CG・アニメーションのハイブリッド手法が得意。',
 ARRAY['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Cinema 4D'],
 ARRAY['MV', 'CGアニメーション', 'ショートドラマ'],
 '東京都', 8, 4.9, 76),

('c0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011',
 '教育・研修動画のスペシャリスト。eラーニングコンテンツ、社内研修映像、マニュアル動画の制作を得意としています。わかりやすさを第一に。',
 ARRAY['Premiere Pro', 'After Effects', 'モーショングラフィックス', 'PowerPoint連携'],
 ARRAY['教育・研修', 'マニュアル・HowTo', 'インタビュー'],
 '愛知県', 5, 4.5, 29),

('c0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000012',
 'SNS動画に特化したクリエイター。TikTok・Instagram Reels・YouTube Shortsのアルゴリズムを熟知。バズる動画の企画・制作が強みです。',
 ARRAY['Premiere Pro', 'CapCut', 'After Effects', 'Photoshop'],
 ARRAY['Youtubeショート【縦型】', 'Instagram【縦型】', 'X【縦型】', 'Facebook【縦型】'],
 '東京都', 3, 4.6, 67),

('c0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000013',
 'バラエティ・エンタメ系映像の編集が得意。YouTubeのバラエティチャンネルを複数担当中。テンポの良い編集とユーモアのある演出が持ち味。',
 ARRAY['Premiere Pro', 'After Effects', 'サウンドデザイン', 'モーショングラフィックス'],
 ARRAY['バラエティ', 'Youtubeショート【縦型】', 'インタビュー'],
 '東京都', 4, 4.7, 55),

('c0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000014',
 '商品撮影・プロダクトムービーに特化。食品・コスメ・家電などの魅力を最大限に引き出す映像制作を行います。スタジオ撮影にも対応。',
 ARRAY['Premiere Pro', 'DaVinci Resolve', 'カラーグレーディング', 'ライティング'],
 ARRAY['商品・製品紹介', 'テレビCM', 'Instagram【縦型】'],
 '神奈川県', 7, 4.8, 43),

('c0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000015',
 'インタビュー映像・ドキュメンタリー制作を得意としています。人物の魅力を引き出す聞き手としてのスキルも評価されています。',
 ARRAY['Premiere Pro', 'Final Cut Pro', 'カラーグレーディング', '撮影ディレクション'],
 ARRAY['インタビュー', '会社・学校紹介', '教育・研修'],
 '福岡県', 9, 4.8, 61),

('c0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000016',
 'マニュアル・HowTo動画の制作に注力。製品の使い方、ソフトウェアの操作説明、業務手順書の映像化を専門としています。',
 ARRAY['Premiere Pro', 'After Effects', 'Camtasia', 'モーショングラフィックス'],
 ARRAY['マニュアル・HowTo', '教育・研修', 'サービス紹介'],
 '北海道', 4, 4.4, 22),

('c0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000017',
 'ハイエンドCG映像制作。建築ビジュアライゼーション、製品CGアニメーション、VFXを得意としています。映画・CMでのVFX実績あり。',
 ARRAY['Blender', 'Houdini', 'Nuke', 'After Effects'],
 ARRAY['CGアニメーション', 'テレビCM', 'MV'],
 '東京都', 10, 4.9, 41),

('c0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000018',
 '縦型動画のプロフェッショナル。TikTok・Reels・Shortsに最適化されたコンテンツ企画から制作まで一貫対応。100本以上の運用実績。',
 ARRAY['Premiere Pro', 'CapCut', 'After Effects', 'Canva'],
 ARRAY['Youtubeショート【縦型】', 'Instagram【縦型】', 'X【縦型】', 'Facebook【縦型】'],
 '大阪府', 2, 4.5, 34),

('c0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000019',
 '企業ブランディング映像の専門家。ブランドストーリーを映像で語る力に定評があります。ナショナルクライアントの実績多数。',
 ARRAY['Premiere Pro', 'DaVinci Resolve', 'カラーグレーディング', '撮影ディレクション'],
 ARRAY['会社・学校紹介', 'サービス紹介', 'インタビュー'],
 '東京都', 12, 4.9, 87),

('c0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020',
 'イベント・セミナーの映像記録を専門としています。マルチカメラ撮影、ライブ配信、ハイライト映像制作まで対応。年間50件以上の実績。',
 ARRAY['Premiere Pro', 'Final Cut Pro', 'OBS', 'マルチカメラ'],
 ARRAY['バラエティ', 'インタビュー', '教育・研修'],
 '千葉県', 6, 4.6, 48);

-- Step 5: Portfolio items (2-3 items per creator)
INSERT INTO portfolio_items (id, creator_id, title, description, video_url, video_platform, thumbnail_url, genre, tags) VALUES
-- Creator 7: CGアニメーション
('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000007', '家電メーカー 新製品CGアニメーション', '製品の内部構造を3DCGで可視化したプロモーション映像', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['3DCG', 'プロダクト', 'アニメーション']),
('d0000000-0000-0000-0000-000000000107', 'c0000000-0000-0000-0000-000000000007', '建築ビジュアライゼーション', '未完成の建物をCGで再現したウォークスルー映像', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['建築', 'CG', 'ウォークスルー']),

-- Creator 8: テレビCM
('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', '大手飲料メーカー テレビCM 30秒', '夏季キャンペーン向けCM。爽やかなビジュアルで商品の魅力を訴求', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&h=360&fit=crop', 'テレビCM', ARRAY['CM', '飲料', 'テレビ']),
('d0000000-0000-0000-0000-000000000108', 'c0000000-0000-0000-0000-000000000008', 'IT企業 サービス紹介CM', 'SaaSサービスの特徴をわかりやすく伝える60秒CM', 'https://vimeo.com/123456789', 'vimeo', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&h=360&fit=crop', 'サービス紹介', ARRAY['IT', 'SaaS', 'CM']),

-- Creator 9: ショートドラマ
('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000009', 'SNSショートドラマ「最後の5分」', 'Instagram向け縦型ショートドラマ。再生数100万回突破', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&h=360&fit=crop', 'ショートドラマ', ARRAY['ショートドラマ', 'SNS', '縦型']),

-- Creator 10: MV
('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000010', 'アーティスト「星の海」MV', 'CG×実写のハイブリッド手法で幻想的な世界観を表現', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=360&fit=crop', 'MV', ARRAY['MV', 'CG', '実写']),
('d0000000-0000-0000-0000-000000000110', 'c0000000-0000-0000-0000-000000000010', 'バンド「夜明け前」MV', 'ワンカット風の映像演出が話題に。YouTube再生数500万回', 'https://vimeo.com/987654321', 'vimeo', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&h=360&fit=crop', 'MV', ARRAY['MV', 'バンド', 'ワンカット']),

-- Creator 11: 教育
('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000011', '大手メーカー 社内研修eラーニング', '新入社員向け研修動画シリーズ全20本', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=640&h=360&fit=crop', '教育・研修', ARRAY['eラーニング', '研修', '企業']),

-- Creator 12: SNS
('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000012', 'アパレルブランド TikTok運用', '月15本の縦型動画制作。フォロワー10万人達成に貢献', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=640&h=360&fit=crop', 'Youtubeショート【縦型】', ARRAY['TikTok', 'アパレル', '縦型']),
('d0000000-0000-0000-0000-000000000112', 'c0000000-0000-0000-0000-000000000012', 'コスメブランド Instagram Reels', 'メイクチュートリアル型のプロモーション動画', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=640&h=360&fit=crop', 'Instagram【縦型】', ARRAY['Instagram', 'コスメ', 'メイク']),

-- Creator 13: バラエティ
('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000013', '人気YouTuber 企画動画編集', '登録者200万人のチャンネルのレギュラー編集を担当', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=640&h=360&fit=crop', 'バラエティ', ARRAY['YouTube', 'バラエティ', '企画']),

-- Creator 14: 商品撮影
('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000014', '高級時計ブランド プロダクトムービー', '時計の精緻なディテールを映し出すシネマティックな映像', 'https://vimeo.com/111222333', 'vimeo', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=640&h=360&fit=crop', '商品・製品紹介', ARRAY['商品撮影', '高級時計', 'シネマティック']),
('d0000000-0000-0000-0000-000000000114', 'c0000000-0000-0000-0000-000000000014', '食品メーカー 商品PR動画', '食品のシズル感を最大限に引き出した15秒動画', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=640&h=360&fit=crop', '商品・製品紹介', ARRAY['食品', 'シズル', '商品PR']),

-- Creator 15: インタビュー
('d0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000015', '経営者インタビューシリーズ', 'スタートアップCEO10名の想いを映像化', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&h=360&fit=crop', 'インタビュー', ARRAY['インタビュー', '経営者', 'ドキュメンタリー']),

-- Creator 16: マニュアル
('d0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000016', 'SaaS操作マニュアル動画', '画面キャプチャとナレーションで操作手順をわかりやすく解説', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=640&h=360&fit=crop', 'マニュアル・HowTo', ARRAY['SaaS', 'マニュアル', '操作説明']),

-- Creator 17: CG
('d0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000017', '映画VFXショット', '実写合成のハイエンドVFXリール', 'https://vimeo.com/111222333', 'vimeo', 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['VFX', '映画', 'CG']),
('d0000000-0000-0000-0000-000000000117', 'c0000000-0000-0000-0000-000000000017', '自動車メーカー CGプロモーション', '新型車のCGビジュアライゼーション', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=640&h=360&fit=crop', 'CGアニメーション', ARRAY['自動車', 'CG', 'プロモーション']),

-- Creator 18: 縦型
('d0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000018', '飲食チェーン TikTokプロモーション', '新メニュー紹介の縦型動画。単体で300万再生', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=640&h=360&fit=crop', 'Youtubeショート【縦型】', ARRAY['飲食', 'TikTok', '縦型']),

-- Creator 19: ブランディング
('d0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000019', '老舗旅館 ブランドムービー', '100年の歴史と現代のおもてなしを映像で表現', 'https://vimeo.com/987654321', 'vimeo', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=640&h=360&fit=crop', '会社・学校紹介', ARRAY['旅館', 'ブランディング', 'シネマティック']),
('d0000000-0000-0000-0000-000000000119', 'c0000000-0000-0000-0000-000000000019', 'スタートアップ 企業紹介映像', 'ミッション・ビジョンを伝えるコーポレートムービー', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=360&fit=crop', '会社・学校紹介', ARRAY['スタートアップ', '企業紹介', 'ミッション']),

-- Creator 20: イベント
('d0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000020', 'テックカンファレンス 記録映像', '3000人規模のカンファレンスをマルチカメラで収録', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=640&h=360&fit=crop', 'バラエティ', ARRAY['カンファレンス', 'イベント', 'マルチカメラ']);

-- Step 6: Service packages (1-2 per new creator)
INSERT INTO service_packages (id, creator_id, name, description, price, delivery_days, revisions, features) VALUES
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
('e0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000020', 'イベント映像 ハイライト', 'イベント撮影+ハイライト映像（3分）', 200000, 14, 2, ARRAY['マルチカメラ撮影', '当日対応', 'ハイライト編集', 'BGM', '修正2回']);

-- Step 7: Sample jobs (3 open jobs)
INSERT INTO client_profiles (id, user_id, company_name, company_url, industry) VALUES
('c1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '株式会社テックサンプル', 'https://example.com', 'IT・通信'),
('c1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '株式会社メディアクリエイト', 'https://example.com', 'メディア・エンタメ'),
('c1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '合同会社フードデリバリー', 'https://example.com', '飲食・サービス')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO jobs (client_id, title, description, genres, budget_min, budget_max, deadline, delivery_deadline, status) VALUES
('c1000000-0000-0000-0000-000000000001', '新サービスのプロモーション動画制作',
 'BtoB SaaSサービスの紹介動画を制作していただけるクリエイターを募集しています。\n\n【概要】\n・サービスの特徴を分かりやすく伝える60秒の動画\n・ターゲット: IT企業の経営層・決裁者\n・テイスト: モダンでスタイリッシュ\n・モーショングラフィックス中心（実写不要）\n\n【求めるスキル】\n・モーショングラフィックス制作経験\n・BtoBサービスの映像制作経験があれば尚可',
 ARRAY['サービス紹介', 'CGアニメーション'], 200000, 400000, '2026-05-15', '2026-06-30', 'open'),

('c1000000-0000-0000-0000-000000000002', 'YouTube企業チャンネルの動画編集者募集（継続案件）',
 'YouTube企業チャンネルの動画編集を継続的にお願いできるクリエイターを募集します。\n\n【概要】\n・月8本の動画編集（1本あたり10-15分）\n・テロップ、BGM、SE、サムネイル制作含む\n・バラエティ・インタビュー系のコンテンツ\n\n【求めるスキル】\n・YouTube動画の編集経験\n・テンポの良いカット編集\n・Adobe Premiere Pro使用必須',
 ARRAY['バラエティ', 'インタビュー', 'Youtubeショート【縦型】'], 80000, 120000, '2026-04-30', NULL, 'open'),

('c1000000-0000-0000-0000-000000000003', 'Instagram/TikTok向け飲食店プロモーション動画',
 '新店舗オープンに合わせて、SNS向けのプロモーション動画を制作していただきたいです。\n\n【概要】\n・Instagram Reels / TikTok向けの縦型動画5本セット\n・料理のシズル感を重視\n・店舗の雰囲気が伝わる映像\n・各動画15-30秒\n\n【撮影について】\n・東京都内の店舗で撮影\n・撮影日は応相談\n・食材・料理は準備します',
 ARRAY['Instagram【縦型】', 'Youtubeショート【縦型】', '商品・製品紹介'], 150000, 300000, '2026-04-20', '2026-05-15', 'open');
