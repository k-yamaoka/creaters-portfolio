-- 00056: 企業プロフィールに信頼性向上の項目を追加
--
-- クリエイターに「ちゃんとした会社か」を判断してもらえる材料を追加する。
-- いずれも任意。invoice_registration_number は適格請求書発行事業者の登録番号
-- (T で始まる 13 桁) を想定するが、入力形式は緩く受け付ける。

ALTER TABLE client_profiles
  ADD COLUMN IF NOT EXISTS logo_url            TEXT,
  ADD COLUMN IF NOT EXISTS company_description TEXT,
  ADD COLUMN IF NOT EXISTS invoice_registration_number TEXT;

COMMENT ON COLUMN client_profiles.logo_url IS
  '企業ロゴ画像 URL (avatars バケットを相乗りで使う)';
COMMENT ON COLUMN client_profiles.company_description IS
  '会社概要・事業内容の自由記述。クリエイターへの安心材料として詳細ページや案件カード等で表示';
COMMENT ON COLUMN client_profiles.invoice_registration_number IS
  '適格請求書発行事業者の登録番号 (T+13桁) - 形式チェックは UI 側で実施';
