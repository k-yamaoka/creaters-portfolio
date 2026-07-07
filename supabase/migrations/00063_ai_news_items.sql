-- 00063: AI ニュースキャッシュ用テーブル
--
-- 目的:
--   TOP LP の「Now in generative video.」セクションで「常に最新 8 件」を
--   表示するため、Cron が RSS から抽出した AI × 動画 マッチ記事を Supabase
--   に蓄積する。RSS フィード単体では過去 1-2 日程度しか遡れないため、
--   累積することで 7 日間分の候補プールから安定して 8 件を返せる。
--
-- 著作権配慮 (ユーザー明示):
--   - 画像バイナリは絶対に保存しない (image_url は文字列参照のみ)
--   - 記事本文 / リード文も保存しない
--   - 保存対象は og:title (短い事実的見出し)、og:image URL、記事 URL、
--     掲載日時、出典名のみ

CREATE TABLE IF NOT EXISTS ai_news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,           -- 記事 URL (dedup キー)
  title TEXT NOT NULL,                -- og:title (短い事実的見出し)
  image_url TEXT NOT NULL,            -- og:image URL 文字列参照のみ (保存しない)
  published_at TIMESTAMPTZ,           -- RSS の isoDate。null 許容
  source_name TEXT,                   -- 出典名 (Yahoo!ニュース IT 等)
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 表示クエリ用: published_at 降順 (null は末尾)
CREATE INDEX IF NOT EXISTS ai_news_items_pub_idx
  ON ai_news_items(published_at DESC NULLS LAST);

-- 直近取得順 (published_at が null の item の fallback ソート)
CREATE INDEX IF NOT EXISTS ai_news_items_cap_idx
  ON ai_news_items(captured_at DESC);

-- RLS: 全ユーザー閲覧可 (TOP LP で公開表示するため)
-- 書き込みは Service Role Key を持つ Cron からのみ (RLS bypass)
ALTER TABLE ai_news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_news_items_public_read"
  ON ai_news_items
  FOR SELECT
  USING (true);

COMMENT ON TABLE ai_news_items IS
  'AI × 動画 ニュース記事の OGP メタデータキャッシュ。TOP LP で最新 8 件を表示する用途。画像バイナリは保存せず URL 文字列参照のみ。';
