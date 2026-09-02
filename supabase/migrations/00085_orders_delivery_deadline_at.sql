-- 2026-09-02: orders.delivery_deadline_at を追加。
--
-- 目的: 「制作中 (production) 以降」で表示する 納品期限。
--   - jobs.delivery_days (素材受け取りから何日で納品するか) を使い、
--     production 遷移時 (= 仮払い完了 → data_sharing → production の 3 段階目) に
--     now() + delivery_days 日 で算出して セット。
--   - jobs.delivery_days が NULL の場合はデフォルト 14 日 (安全側)。
--   - 表示側 (src/app/(main)/dashboard/orders/[id]/page.tsx:164) は既に
--     order.delivery_deadline_at がセットされていれば「納品期限:」ラベル付きで
--     表示する実装済。この列を用意すれば 自動的に表示される。
--
-- なお 混同注意:
--   nondelivery_deadline_at → 「催促後 +7 日、超過で自動キャンセル」の別概念
--   delivery_deadline_at    → 「今回追加、制作開始からの契約納期」

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_deadline_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.delivery_deadline_at IS
  '契約納期。production 遷移時に jobs.delivery_days (デフォルト 14 日) を用いて
   now() + N 日 で算出。取引詳細画面 上部に「納品期限」として表示。
   nondelivery_deadline_at (催促超過自動キャンセル) とは別概念。';

CREATE INDEX IF NOT EXISTS idx_orders_delivery_deadline_at
  ON public.orders(delivery_deadline_at)
  WHERE delivery_deadline_at IS NOT NULL;

-- 既存の production/revision/delivered 状態の order で NULL のものに backfill。
-- orders は jobs に 直接 FK を持たず、job_applications.order_id (逆リンク、
-- migration 00083 追加) 経由で jobs.delivery_days を引き当てる。
-- application 経由で jobs が見つかれば delivery_days を、無ければ 14 日 で埋める。
UPDATE public.orders o
SET delivery_deadline_at =
  o.created_at +
  (COALESCE(
    NULLIF((SELECT j.delivery_days
              FROM public.job_applications ja
              JOIN public.jobs j ON j.id = ja.job_id
              WHERE ja.order_id = o.id
              LIMIT 1), 0),
    14
  ) || ' days')::interval
WHERE o.delivery_deadline_at IS NULL
  AND o.status IN ('production', 'revision', 'delivered');
