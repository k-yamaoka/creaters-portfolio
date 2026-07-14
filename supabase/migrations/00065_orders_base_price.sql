-- 00065: orders テーブルに base_price を追加 (企業 15% 手数料上乗せモデル)
--
-- ビジネス要件 (2026-07-14):
--   - クリエイターの提示額 (base_price) が クリエイターの受取額そのもの
--   - 企業には base_price + 15% (system_fee) を請求
--   - total_amount = base_price + system_fee
--
-- 既存カラムのセマンティクスを再解釈する:
--   - base_price     [NEW]         : クリエイター提示額 = クリエイター受取額
--   - platform_fee   [再定義]      : 企業から徴収する system_fee (base_price × 0.15)
--                                    旧: クリエイターから控除する手数料
--   - creator_payout [再定義]      : クリエイターへの支払額 (= base_price、
--                                    creator-fee.ts の custom_fee_rate が有効な場合はさらに控除、
--                                    現状 早期メンバーで 0%)
--   - total_amount   [セマンティクス維持]: 企業への総請求額 (= base_price + platform_fee)
--
-- 既存 orders の backfill:
--   旧モデルでは creator_payout = クリエイター受取額 だったため、
--   base_price = creator_payout でセマンティクス保存できる。
--   total_amount / platform_fee は旧値のまま (旧モデルの整合を保持)。

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS base_price INTEGER NOT NULL DEFAULT 0;

-- 既存レコードの backfill: base_price = creator_payout
-- (base_price=0 かつ creator_payout>0 のときのみ更新、冪等)
UPDATE orders
  SET base_price = creator_payout
  WHERE base_price = 0 AND creator_payout > 0;

-- 集計 / 監査用に base_price のインデックスは張らない (WHERE 検索用途がないため)。
-- 必要になったら別 migration で追加する方針。

COMMENT ON COLUMN orders.base_price IS
  'クリエイター提示額 = クリエイターの受取額 (円)。企業への請求は base_price + system_fee(=platform_fee, 15%)。2026-07-14 追加。';

COMMENT ON COLUMN orders.platform_fee IS
  '2026-07-14 セマンティクス再定義: 企業から徴収する 15% サービス手数料 (base_price × ENTERPRISE_FEE_RATE)。旧: クリエイターから控除する手数料。';

COMMENT ON COLUMN orders.creator_payout IS
  '2026-07-14 セマンティクス再定義: クリエイターへの支払額 (= base_price、creator-fee.ts の custom_fee_rate が非ゼロの場合はさらに控除)。早期メンバーは 100% base_price を受取。';

COMMENT ON COLUMN orders.total_amount IS
  '企業への総請求額 = base_price + platform_fee (= base_price × 1.15)。セマンティクスは新旧モデルで一貫。';
