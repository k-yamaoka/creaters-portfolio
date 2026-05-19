-- ============================================
-- Soft Delete / Archive 設計への移行
--
-- 目的:
--   退会したクリエイター/クライアントの取引履歴・メッセージ・レビューが消失すると、
--   - 確定申告 (プラットフォーム手数料の売上計上) に致命傷
--   - 相手側ユーザーが過去取引を確認できない
--   - 紛争対応で証拠が出せない
--   というため、ハード CASCADE 削除を辞めて Archive ベースに移行する。
--
-- 変更:
--   1. archived_profiles テーブル新設 (退会者の最小限情報)
--   2. orders.client_id / creator_id を nullable + ON DELETE SET NULL に
--   3. messages.sender_id / receiver_id を nullable + ON DELETE SET NULL に
--      (00025 で CASCADE にしたばかりだが、ここで SET NULL に再変更)
--   4. job_applications.creator_id も nullable + SET NULL
--   5. reviews.reviewer_id / creator_id も nullable + SET NULL
--
-- 既存データへの影響:
--   - 全テーブルのカラムを NOT NULL → NULL 許容に変更
--   - 既存行は影響なし (まだ NULL は無い)
-- ============================================

-- ----- 1. archived_profiles テーブル -----
CREATE TABLE IF NOT EXISTS archived_profiles (
  -- 退会前の auth.users.id と同じ UUID を主キーに使う。
  -- これにより orders / messages の SET NULL 後でも archive を引ける状態を作る...
  -- ことは外部キー的にはできないが、アプリ層で照会する用の id として残す。
  original_user_id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- メール自体は保存しない。問い合わせ照合用にハッシュのみ。
  email_hash TEXT
);

ALTER TABLE archived_profiles ENABLE ROW LEVEL SECURITY;
-- 一般ユーザーには公開しない (運営のみ Supabase Studio から閲覧)
DROP POLICY IF EXISTS "Nobody can read archived_profiles" ON archived_profiles;
CREATE POLICY "Nobody can read archived_profiles"
  ON archived_profiles FOR ALL USING (false);

-- ----- 2. orders を SET NULL 化 -----
ALTER TABLE orders ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN creator_id DROP NOT NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_client_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_creator_id_fkey;

ALTER TABLE orders
  ADD CONSTRAINT orders_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES client_profiles(id) ON DELETE SET NULL;
ALTER TABLE orders
  ADD CONSTRAINT orders_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE SET NULL;

-- 取引参加者 id を archive とリンクするため、archived_*_user_id を保持
-- (orders.client_id を NULL にする際にこの列に元の auth.users.id を記録する)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS archived_client_user_id UUID,
  ADD COLUMN IF NOT EXISTS archived_creator_user_id UUID;

-- ----- 3. messages を SET NULL 化 -----
-- 00025 で CASCADE に変更したばかりだが、archive 方針に合わせて SET NULL に再変更
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ----- 4. job_applications を SET NULL 化 -----
ALTER TABLE job_applications ALTER COLUMN creator_id DROP NOT NULL;

ALTER TABLE job_applications
  DROP CONSTRAINT IF EXISTS job_applications_creator_id_fkey;

ALTER TABLE job_applications
  ADD CONSTRAINT job_applications_creator_id_fkey
    FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE SET NULL;

-- ----- 5. reviews も SET NULL 化 -----
-- reviews テーブルは 00006 で client_id / creator_id を持つ。
-- カラムが本当に存在するかを確認してから安全に処理する (将来のスキーマ変更耐性)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'client_id'
  ) THEN
    EXECUTE 'ALTER TABLE reviews ALTER COLUMN client_id DROP NOT NULL';
    EXECUTE 'ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_client_id_fkey';
    EXECUTE 'ALTER TABLE reviews
      ADD CONSTRAINT reviews_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES client_profiles(id) ON DELETE SET NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'creator_id'
  ) THEN
    EXECUTE 'ALTER TABLE reviews ALTER COLUMN creator_id DROP NOT NULL';
    EXECUTE 'ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_creator_id_fkey';
    EXECUTE 'ALTER TABLE reviews
      ADD CONSTRAINT reviews_creator_id_fkey
        FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE SET NULL';
  END IF;
END$$;
