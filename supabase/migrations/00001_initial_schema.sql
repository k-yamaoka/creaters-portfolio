-- ============================================
-- CreatorsHub MVP - Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Users & Profiles
-- ============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('creator', 'client', 'admin');

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. Creator Profiles
-- ============================================

CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  genres TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  years_of_experience INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  stripe_account_id TEXT,  -- Stripe Connect account
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_creator_profiles_genres ON creator_profiles USING GIN(genres);
CREATE INDEX idx_creator_profiles_skills ON creator_profiles USING GIN(skills);
CREATE INDEX idx_creator_profiles_rating ON creator_profiles(rating DESC);

-- ============================================
-- 3. Portfolio Items
-- ============================================

CREATE TYPE video_platform AS ENUM ('youtube', 'vimeo', 'other');

CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  video_platform video_platform NOT NULL DEFAULT 'youtube',
  thumbnail_url TEXT,
  genre TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_items_creator ON portfolio_items(creator_id);

-- ============================================
-- 4. Service Packages (料金表 / メニュー表)
-- ============================================

CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,  -- JPY (no decimals)
  delivery_days INTEGER NOT NULL,
  revisions INTEGER NOT NULL DEFAULT 1,
  features TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_packages_creator ON service_packages(creator_id);
CREATE INDEX idx_service_packages_price ON service_packages(price);

-- ============================================
-- 5. Client Profiles
-- ============================================

CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  company_url TEXT,
  industry TEXT,
  stripe_customer_id TEXT,  -- Stripe Customer ID
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 6. Orders (取引管理)
-- ============================================

CREATE TYPE order_status AS ENUM (
  'inquiry',       -- 相談・見積もり依頼
  'quoted',        -- 見積もり提出済み
  'accepted',      -- 受注承認
  'paid',          -- 仮払い完了 (エスクロー)
  'in_progress',   -- 制作中
  'delivered',     -- 納品済み
  'revision',      -- 修正依頼
  'completed',     -- 検収完了
  'cancelled'      -- キャンセル
);

CREATE TYPE escrow_status AS ENUM ('pending', 'held', 'released', 'refunded');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,  -- human-readable order number
  client_id UUID NOT NULL REFERENCES client_profiles(id),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id),
  package_id UUID REFERENCES service_packages(id),
  status order_status NOT NULL DEFAULT 'inquiry',
  title TEXT NOT NULL,
  description TEXT,
  total_amount INTEGER NOT NULL DEFAULT 0,       -- JPY
  platform_fee INTEGER NOT NULL DEFAULT 0,       -- system commission
  creator_payout INTEGER NOT NULL DEFAULT 0,     -- amount to creator
  escrow_status escrow_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  delivery_deadline DATE,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_creator ON orders(creator_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- 7. Messages
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_order ON messages(order_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id, is_read);

-- ============================================
-- 8. Identity Verification (本人確認)
-- ============================================

CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE identity_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 9. Payouts (出金管理)
-- ============================================

CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount INTEGER NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',
  stripe_transfer_id TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payouts_creator ON payouts(creator_id);

-- ============================================
-- 10. Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Creator profiles: public read, owner update
CREATE POLICY "Creator profiles are viewable by everyone"
  ON creator_profiles FOR SELECT USING (true);
CREATE POLICY "Creators can update own profile"
  ON creator_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Creators can insert own profile"
  ON creator_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Portfolio: public read, owner manage
CREATE POLICY "Portfolios are viewable by everyone"
  ON portfolio_items FOR SELECT USING (true);
CREATE POLICY "Creators can manage own portfolios"
  ON portfolio_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM creator_profiles
      WHERE id = portfolio_items.creator_id AND user_id = auth.uid()
    )
  );

-- Packages: public read, owner manage
CREATE POLICY "Packages are viewable by everyone"
  ON service_packages FOR SELECT USING (true);
CREATE POLICY "Creators can manage own packages"
  ON service_packages FOR ALL USING (
    EXISTS (
      SELECT 1 FROM creator_profiles
      WHERE id = service_packages.creator_id AND user_id = auth.uid()
    )
  );

-- Orders: participants only
CREATE POLICY "Order participants can view"
  ON orders FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM creator_profiles WHERE id = orders.creator_id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM client_profiles WHERE id = orders.client_id AND user_id = auth.uid()
    )
  );

-- Messages: sender/receiver only
CREATE POLICY "Message participants can view"
  ON messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- 11. Functions & Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_creator_profiles_updated_at
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substring(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();
