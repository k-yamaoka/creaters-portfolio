-- 2026-08-10: notifications INSERT が anon key で 全通過 (フィッシング可能) だった。
--
-- 旧: FOR INSERT WITH CHECK (true) → 任意ログイン ユーザが任意 user_id 宛に通知作成可
-- 新: 自分宛 (auth.uid() = user_id) or admin のみ
--     ※ アプリ側 (Server Actions / API route) は service role で INSERT するので影響なし
--        (service_role は RLS bypass)。クライアント (anon key) からの偽通知作成のみ塞ぐ。
--
-- ロールバック: 元の CHECK (true) に戻すだけだが、フィッシング脆弱性が復活するため非推奨。

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can insert notifications for self"
  ON notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR is_admin()
  );
