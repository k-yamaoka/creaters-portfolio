-- 一時テスト用: 田中映像の minimum_order_amount をセット (デバッグ目的)
UPDATE creator_profiles
SET minimum_order_amount = 50000, updated_at = now()
WHERE user_id = 'a05d5b85-a910-4e25-b0bf-a440b1ddf61b';
