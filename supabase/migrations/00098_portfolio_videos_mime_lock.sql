-- 00098: portfolio-videos バケットに allowed_mime_types を強制。
--
-- SEC-H4 対策:
--   /api/upload/video/sign 経由の client 直 PUT では server 側で magic-number
--   検証ができない。攻撃者が Content-Type=video/mp4 を偽装して 悪意 バイナリを
--   PUT する 経路が 残っていた。
--
--   Supabase Storage bucket に allowed_mime_types を設定すると、Storage が
--   Content-Type ヘッダを 拒否 する (実 magic 判定ではないが、client 側の
--   偽装コスト を上げる)。/api/upload/thumbnail (POST 経路) 等は server 側で
--   3 段検証 (拡張子 + Content-Type + magic) 済みなので 影響なし。
--
-- 対象 MIME:
--   video/mp4, video/quicktime (.mov), video/webm, video/x-m4v,
--   image/jpeg, image/png, image/gif, image/webp, application/pdf
--   (portfolio 画像 + サムネイル + メッセージ添付 の 全経路が 共用のため)

UPDATE storage.buckets
   SET allowed_mime_types = ARRAY[
     'video/mp4',
     'video/quicktime',
     'video/webm',
     'video/x-m4v',
     'image/jpeg',
     'image/png',
     'image/gif',
     'image/webp',
     'application/pdf'
   ]
 WHERE id = 'portfolio-videos';

-- avatars バケット にも同様の制約を追加 (00045 で 既に設定済のはずだが 冪等確認)
UPDATE storage.buckets
   SET allowed_mime_types = ARRAY[
     'image/jpeg',
     'image/png',
     'image/gif',
     'image/webp'
   ]
 WHERE id = 'avatars';
