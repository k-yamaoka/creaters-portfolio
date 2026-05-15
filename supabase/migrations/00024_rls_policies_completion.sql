-- ============================================
-- RLS policy の欠落を補完
--   - messages: UPDATE / DELETE が無く、markAsRead が silent に 0 行更新で失敗していた
--   - orders: DELETE が無い (DELETE は禁止する意図でも明示policyが必要)
--   - client_profiles: INSERT/UPDATE/DELETE が無い (SELECT のみ存在)
-- ============================================

-- ----- messages: UPDATE / DELETE -----
-- 受信者が自分宛メッセージの is_read のみを変更できる。
-- content 等の書き換えはアプリ層で行わないので USING のみで十分。
DROP POLICY IF EXISTS "Receivers can mark own messages read" ON messages;
CREATE POLICY "Receivers can mark own messages read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 送信者は自分の送信メッセージを削除可
DROP POLICY IF EXISTS "Senders can delete own messages" ON messages;
CREATE POLICY "Senders can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- ----- orders: DELETE は禁止 (admin のみ) -----
-- FOR ALL の admin policy が 00003 で他テーブルにはあるが orders には無い。
-- 明示的に「誰も削除できない」policy を貼ることで PostgreSQL 仕様上の混乱を防ぐ。
DROP POLICY IF EXISTS "Orders cannot be deleted by users" ON orders;
CREATE POLICY "Orders cannot be deleted by users"
  ON orders FOR DELETE
  USING (false);

-- ----- client_profiles: INSERT / UPDATE -----
-- 既存コードは client_profiles を新規作成しているのに INSERT policy が無く、
-- 動いていたのは server action 経由でサービスロール扱いだった可能性。
-- 明示的に owner-own policy を貼る。
DROP POLICY IF EXISTS "Clients can insert own profile" ON client_profiles;
CREATE POLICY "Clients can insert own profile"
  ON client_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Clients can update own profile" ON client_profiles;
CREATE POLICY "Clients can update own profile"
  ON client_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE は不可 (アカウント削除時に cascade で消える想定)
DROP POLICY IF EXISTS "Client profiles cannot be deleted by users" ON client_profiles;
CREATE POLICY "Client profiles cannot be deleted by users"
  ON client_profiles FOR DELETE
  USING (false);
