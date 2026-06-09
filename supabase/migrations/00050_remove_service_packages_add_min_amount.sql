-- ============================================
-- 00050: 料金プラン機能の撤去 + 最低受注金額の追加
-- ============================================
-- 料金プラン (service_packages) はユーザー判断により完全撤去。
-- 代わりに creator_profiles に「最低受注金額」(minimum_order_amount) を追加し、
-- クリエイター一覧 / 詳細での価格表示はこの 1 カラムに集約する。
--
-- orders.package_id は service_packages への外部キーを持つため、先に DROP COLUMN
-- してから service_packages を DROP TABLE する。CASCADE はインデックス / RLS /
-- 関連ポリシーをまとめて落とす。

-- ===== creator_profiles に最低受注金額カラムを追加 =====
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS minimum_order_amount INTEGER;

COMMENT ON COLUMN creator_profiles.minimum_order_amount IS
  '最低受注金額 (円)。クリエイター一覧/詳細で「¥xx,xxx〜」として表示。NULL = 未設定 (応相談 として扱う)';

-- ===== orders から service_packages 参照を切る =====
ALTER TABLE orders DROP COLUMN IF EXISTS package_id;

-- ===== service_packages テーブルを完全削除 =====
-- RLS ポリシー / インデックスも一緒に落ちる
DROP TABLE IF EXISTS service_packages CASCADE;
