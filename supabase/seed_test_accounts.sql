-- ============================================
-- テスト用アカウント（企業クライアント）
-- ============================================

-- テスト企業アカウント
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-test@example.com', crypt('testpass123', gen_salt('bf')), now(), '{"display_name": "テスト企業", "role": "client"}'::jsonb, now(), now());

INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'email', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"client-test@example.com"}'::jsonb, now(), now(), now());

-- プロフィール更新
UPDATE profiles SET
  avatar_url = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&h=150&fit=crop',
  is_verified = true
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 企業情報
INSERT INTO client_profiles (id, user_id, company_name, company_url, industry) VALUES
('ca000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '株式会社テストカンパニー', 'https://example.com', 'IT・通信')
ON CONFLICT (user_id) DO NOTHING;
