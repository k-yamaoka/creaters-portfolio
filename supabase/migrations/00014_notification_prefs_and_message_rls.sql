-- ============================================
-- 1. profiles に通知先 / 通知設定カラム追加（外部通知の雛形用）
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS line_user_id TEXT,
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notify_line BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- 2. messages 送信権限 RLS の強化 (#6)
--   - 企業 (client / admin): すべてのクリエイターに送信可
--   - クリエイター: 自分が「応募した案件の企業」または「取引(orders)で繋がっている企業」にのみ送信可
--   - sender_id は引き続き auth.uid() と一致が必須
-- ============================================

DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- (a) sender = receiver の自分宛通知（システム挿入の余地）
      receiver_id = auth.uid()

      -- (b) 送信者が企業 or 管理者なら誰にでも送れる
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('client', 'admin')
      )

      -- (c) 送信者がクリエイターの場合: 受信者の所有ジョブに応募済み
      OR EXISTS (
        SELECT 1
        FROM job_applications ja
        JOIN jobs j           ON j.id = ja.job_id
        JOIN client_profiles cp ON cp.id = j.client_id
        JOIN creator_profiles crp ON crp.id = ja.creator_id
        WHERE crp.user_id = auth.uid()
          AND cp.user_id  = receiver_id
      )

      -- (d) 送信者がクリエイターの場合: 取引(orders) で受信者(=企業) と繋がっている
      OR EXISTS (
        SELECT 1
        FROM orders o
        JOIN client_profiles cp ON cp.id = o.client_id
        JOIN creator_profiles crp ON crp.id = o.creator_id
        WHERE crp.user_id = auth.uid()
          AND cp.user_id  = receiver_id
      )

      -- (e) 受信者が先にメッセージをくれている場合は返信可（スカウト→返信を許容）
      OR EXISTS (
        SELECT 1 FROM messages m
        WHERE m.sender_id   = receiver_id
          AND m.receiver_id = auth.uid()
      )
    )
  );
