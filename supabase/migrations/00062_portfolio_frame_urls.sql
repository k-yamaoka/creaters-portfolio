-- 00062: portfolio_items に動画の代表フレーム画像 URL 配列を追加
--
-- 用途:
--  - 職務経歴書 PDF (templates/*) で「動画パノラマ」表示するため、各動画から
--    複数 (5 枚) のフレームを抽出して Storage に保存し、その URL を保持する
--  - PDF 以外でも将来「サムネ 1 枚」より豊かな見せ方ができる
--
-- データ:
--  - frame_urls TEXT[]  例: [url1, url2, url3, url4, url5]
--  - 順序付き (0% / 25% / 50% / 75% / 100% 等の時間位置に対応)
--  - NULL も許容 (フレーム未生成 = 旧データ / 動画じゃない作品)

ALTER TABLE portfolio_items
  ADD COLUMN IF NOT EXISTS frame_urls TEXT[];

COMMENT ON COLUMN portfolio_items.frame_urls IS
  '動画から抽出した代表フレーム (5 枚) の公開 URL 配列。順序付き。NULL = 未生成';
