-- ============================================
-- Seed Data: Sample Creators
-- ============================================
-- First insert into auth.users, then profiles will be auto-created by trigger,
-- but we need to update them with correct data afterward.

-- Step 1: Insert into auth.users (dummy users for seed data)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tanaka@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "田中 映像", "role": "creator"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suzuki@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "鈴木 クリエイティブ", "role": "creator"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sato@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "佐藤 モーション", "role": "creator"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'takahashi@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "高橋 ウェディング", "role": "creator"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'yamada@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "山田 デジタル", "role": "creator"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ito@example.com', crypt('password123', gen_salt('bf')), now(), '{"display_name": "伊藤 フィルム", "role": "creator"}'::jsonb, now(), now());

-- Also insert into auth.identities (required by Supabase auth)
INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'email', '{"sub": "00000000-0000-0000-0000-000000000001", "email": "tanaka@example.com"}'::jsonb, now(), now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'email', '{"sub": "00000000-0000-0000-0000-000000000002", "email": "suzuki@example.com"}'::jsonb, now(), now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'email', '{"sub": "00000000-0000-0000-0000-000000000003", "email": "sato@example.com"}'::jsonb, now(), now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'email', '{"sub": "00000000-0000-0000-0000-000000000004", "email": "takahashi@example.com"}'::jsonb, now(), now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'email', '{"sub": "00000000-0000-0000-0000-000000000005", "email": "yamada@example.com"}'::jsonb, now(), now(), now()),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'email', '{"sub": "00000000-0000-0000-0000-000000000006", "email": "ito@example.com"}'::jsonb, now(), now(), now());

-- Step 2: Update profiles (auto-created by trigger) with avatar and verified status
UPDATE profiles SET
  avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  is_verified = true
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE profiles SET
  avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  is_verified = true
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE profiles SET
  avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  is_verified = true
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE profiles SET
  avatar_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  is_verified = true
WHERE id = '00000000-0000-0000-0000-000000000004';

UPDATE profiles SET
  avatar_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  is_verified = false
WHERE id = '00000000-0000-0000-0000-000000000005';

UPDATE profiles SET
  avatar_url = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  is_verified = true
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Step 3: Insert creator profiles
INSERT INTO creator_profiles (id, user_id, bio, skills, genres, location, years_of_experience, rating, review_count) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   '映像制作歴10年。企業VPやミュージックビデオを中心に、年間50本以上の制作実績があります。ストーリー性のある映像で、クライアントのメッセージを的確に伝えます。',
   ARRAY['Premiere Pro', 'After Effects', 'カラーグレーディング', 'ドローン撮影'],
   ARRAY['企業VP', 'ミュージックビデオ', '広告・CM'],
   '東京都', 10, 4.9, 127),

  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   'YouTube動画編集のスペシャリスト。チャンネル登録者100万人超のYouTuberを複数担当。テンポの良いカット編集とエンタメ性の高い演出が得意です。',
   ARRAY['Premiere Pro', 'After Effects', 'モーショングラフィックス', 'サウンドデザイン'],
   ARRAY['YouTube動画', 'SNS動画', '商品紹介'],
   '大阪府', 5, 4.8, 89),

  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003',
   'モーショングラフィックスと3DCGを専門としています。テレビCMやWeb広告の制作実績多数。インパクトのあるビジュアルで訴求力の高い映像を制作します。',
   ARRAY['After Effects', '3DCG', 'モーショングラフィックス', 'DaVinci Resolve'],
   ARRAY['広告・CM', 'アニメーション', 'SNS動画'],
   '東京都', 8, 4.7, 64),

  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004',
   'ウェディングビデオグラファー歴7年。300組以上のカップルの最高の瞬間を映像に残してきました。シネマティックな映像美で感動の1日を形にします。',
   ARRAY['Final Cut Pro', 'DaVinci Resolve', 'カラーグレーディング', 'ドローン撮影'],
   ARRAY['ウェディング', 'イベント撮影', 'ドキュメンタリー'],
   '神奈川県', 7, 4.9, 203),

  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005',
   'SNS動画マーケティングのプロフェッショナル。TikTok、Instagram Reels、YouTube Shortsに最適化された縦型動画の制作が得意。企業のSNS運用支援も行っています。',
   ARRAY['Premiere Pro', 'After Effects', 'モーショングラフィックス'],
   ARRAY['SNS動画', '広告・CM', '商品紹介'],
   '福岡県', 3, 4.6, 42),

  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006',
   'ドキュメンタリー映像作家。社会問題やカルチャーをテーマにした作品を多数手がけています。映画祭での受賞歴あり。企業のブランドムービーも得意です。',
   ARRAY['DaVinci Resolve', 'Premiere Pro', 'カラーグレーディング', '撮影ディレクション'],
   ARRAY['ドキュメンタリー', '企業VP', 'イベント撮影'],
   '京都府', 12, 4.8, 31);

-- Step 4: Insert portfolio items
INSERT INTO portfolio_items (id, creator_id, title, description, video_url, video_platform, thumbnail_url, genre, tags) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   '株式会社ABC 企業紹介映像', '企業の理念と事業内容を3分にまとめた紹介映像',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube',
   'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=640&h=360&fit=crop',
   '企業VP', ARRAY['企業VP', 'インタビュー', 'ドローン']),

  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002',
   '人気YouTuber コラボ企画動画', 'エンタメ系YouTubeチャンネルのコラボ企画動画編集',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube',
   'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=640&h=360&fit=crop',
   'YouTube動画', ARRAY['YouTube', 'エンタメ', 'バラエティ']),

  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
   '新商品ローンチ Web CM', '3DCGとモーショングラフィックスを活用した15秒Web CM',
   'https://vimeo.com/123456789', 'vimeo',
   'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=640&h=360&fit=crop',
   '広告・CM', ARRAY['CM', '3DCG', 'モーショングラフィックス']),

  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004',
   'ウェディングハイライト - 海辺の挙式', '湘南の海を背景にしたリゾートウェディングのハイライト映像',
   'https://vimeo.com/987654321', 'vimeo',
   'https://images.unsplash.com/photo-1519741497674-611481863552?w=640&h=360&fit=crop',
   'ウェディング', ARRAY['ウェディング', 'シネマティック', 'ドローン']),

  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005',
   'アパレルブランド Instagram Reels', '新作コレクションのSNS向けプロモーション動画',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube',
   'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=640&h=360&fit=crop',
   'SNS動画', ARRAY['SNS', 'Instagram', 'ファッション']),

  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006',
   '伝統工芸の未来 - ドキュメンタリー', '京都の伝統工芸職人に密着したドキュメンタリー短編',
   'https://vimeo.com/111222333', 'vimeo',
   'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&h=360&fit=crop',
   'ドキュメンタリー', ARRAY['ドキュメンタリー', '伝統工芸', 'カルチャー']);

-- Step 5: Insert service packages
INSERT INTO service_packages (id, creator_id, name, description, price, delivery_days, revisions, features) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'スタンダード', '企業紹介動画（3分以内）', 300000, 14, 2,
   ARRAY['企画構成', '撮影1日', '編集', 'BGM選定', '修正2回']),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'プレミアム', '企業紹介動画（5分以内）+ ショートVer.', 500000, 21, 3,
   ARRAY['企画構成', '撮影2日', '編集', 'BGM・SE', 'モーショングラフィックス', 'ショートVer.制作', '修正3回']),

  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002',
   'ベーシック', 'YouTube動画編集（10分以内）', 30000, 5, 1,
   ARRAY['カット編集', 'テロップ挿入', 'BGM', 'SE', 'サムネイル制作']),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002',
   'プロ', 'YouTube動画編集（20分以内）+ モーション', 60000, 7, 2,
   ARRAY['カット編集', 'テロップ挿入', 'BGM', 'SE', 'モーショングラフィックス', 'サムネイル制作', '修正2回']),

  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003',
   'モーション ベーシック', 'モーショングラフィックス動画（30秒以内）', 150000, 10, 2,
   ARRAY['コンセプト設計', 'モーション制作', 'BGM・SE', '修正2回']),

  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004',
   'ハイライト', '挙式当日のハイライト映像（3〜5分）', 200000, 30, 2,
   ARRAY['挙式当日撮影', 'ハイライト編集', 'カラーグレーディング', 'BGM選定', '修正2回']),
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004',
   'フルパッケージ', '前撮り + 挙式当日 + エンドロール', 450000, 45, 3,
   ARRAY['前撮り撮影', '挙式当日撮影', 'ハイライト映像', 'エンドロール', 'ドローン撮影', '修正3回']),

  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005',
   'SNS動画 単発', '縦型ショート動画1本（60秒以内）', 15000, 3, 1,
   ARRAY['カット編集', 'テロップ', 'BGM', 'フォーマット最適化']),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000005',
   'SNS動画 月額', '月8本のショート動画制作', 100000, 30, 2,
   ARRAY['月8本制作', '企画提案', 'カット編集', 'テロップ', 'BGM', '投稿スケジュール管理']),

  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000006',
   'ブランドムービー', '企業ブランドストーリー映像（5分以内）', 800000, 30, 3,
   ARRAY['企画・構成', '撮影3日', 'インタビュー撮影', '編集', 'カラーグレーディング', 'ナレーション', '修正3回']);
