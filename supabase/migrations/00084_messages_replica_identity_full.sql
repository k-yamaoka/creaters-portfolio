-- 2026-09-02: messages テーブルに REPLICA IDENTITY FULL を付与。
--
-- 目的: Supabase Realtime の filter (e.g. `receiver_id=eq.X`) が
--   確実に評価されるためには、変更 payload に全列が含まれている必要がある。
--   デフォルト (REPLICA IDENTITY DEFAULT = PK のみ) だと UPDATE/DELETE 時に
--   フィルタ対象列が payload に無く、filter が正しく評価されず event が dropped
--   されるケースがある。
--
-- INSERT event 単独では通常 DEFAULT でも動くが、
-- 「相手からのメッセージが Realtime で届かない」報告があるため FULL に切替。
--
-- コスト: WAL が若干増えるが、messages テーブルの列数は少なく実用上無視できる。

ALTER TABLE public.messages REPLICA IDENTITY FULL;
