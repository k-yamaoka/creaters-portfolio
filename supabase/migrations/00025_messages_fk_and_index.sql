-- ============================================
-- messages テーブルの FK CASCADE と sender_id 索引を追加
--
-- 1. sender_id/receiver_id に ON DELETE CASCADE が無く、profiles を削除した際に
--    orphan な messages が残り Realtime publish 時の参照不整合の原因になっていた。
-- 2. idx_messages_sender が無く、sender 起点の取得 (例: 自分の送信履歴) が
--    全件スキャンになっていた。
-- ============================================

-- 古い FK を一旦落として CASCADE 付きで再付与する
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
  DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT messages_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 送信者から見た会話履歴フェッチ用
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages (sender_id, created_at DESC);
