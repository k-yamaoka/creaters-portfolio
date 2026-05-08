-- ============================================
-- messages テーブルを Realtime publication に追加
-- 受信側ポップアップ通知のため、INSERT イベントを購読可能にする
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;
