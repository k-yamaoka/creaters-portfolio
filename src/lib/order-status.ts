/**
 * 取引ステータス定義（DB enum と同期）
 * 1.consultation 相談中 → 2.quoting 見積もり → 3.contract 契約
 * → 4.data_sharing データ共有 → 5.production 制作中
 * → 6.revision 修正中 → 7.delivered 納品完了
 * + cancelled キャンセル
 */
export type OrderStatus =
  | "consultation"
  | "quoting"
  | "contract"
  | "data_sharing"
  | "production"
  | "revision"
  | "delivered"
  | "cancelled";

export type StatusMeta = {
  label: string;
  shortLabel: string;
  description: string;
  /** バッジ用 Tailwind 色クラス */
  color: string;
};

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  consultation: {
    label: "1. 相談中",
    shortLabel: "相談中",
    description: "依頼内容のすり合わせ中",
    color: "bg-blue-100 text-blue-700",
  },
  quoting: {
    label: "2. 見積もり",
    shortLabel: "見積もり",
    description: "クリエイターからの見積もり提示",
    color: "bg-purple-100 text-purple-700",
  },
  contract: {
    label: "3. 契約",
    shortLabel: "契約",
    description: "発注確定・契約成立",
    color: "bg-indigo-100 text-indigo-700",
  },
  data_sharing: {
    label: "4. データ共有",
    shortLabel: "データ共有",
    description: "素材・参考資料の受け渡し",
    color: "bg-yellow-100 text-yellow-700",
  },
  production: {
    label: "5. 制作中",
    shortLabel: "制作中",
    description: "クリエイターが制作を進行中",
    color: "bg-orange-100 text-orange-700",
  },
  revision: {
    label: "6. 修正中",
    shortLabel: "修正中",
    description: "修正対応中",
    color: "bg-pink-100 text-pink-700",
  },
  delivered: {
    label: "7. 納品完了",
    shortLabel: "納品完了",
    description: "成果物の納品が完了",
    color: "bg-green-100 text-green-700",
  },
  cancelled: {
    label: "キャンセル",
    shortLabel: "キャンセル",
    description: "取引キャンセル",
    color: "bg-gray-100 text-gray-500",
  },
};

/** 進行ステップ表示順（cancelled は除く） */
export const STATUS_FLOW: OrderStatus[] = [
  "consultation",
  "quoting",
  "contract",
  "data_sharing",
  "production",
  "revision",
  "delivered",
];

export function getStatusMeta(status: string): StatusMeta {
  return (
    STATUS_META[status as OrderStatus] ?? {
      label: status,
      shortLabel: status,
      description: "",
      color: "bg-gray-100 text-gray-500",
    }
  );
}

export function isFinalStatus(status: string): boolean {
  return status === "delivered" || status === "cancelled";
}

/**
 * 状態遷移ホワイトリスト
 * `current` ステータスから `next` への遷移が許可されているか判定する。
 * cancelled は最終状態でどこからでも遷移可、delivered からは escrow capture のみ
 * (= 同じ status を返す/cancelled に戻す はできない)
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  consultation: ["quoting", "contract", "cancelled"],
  quoting: ["contract", "cancelled"],
  contract: ["data_sharing", "cancelled"],
  data_sharing: ["production", "cancelled"],
  production: ["delivered", "revision"],
  revision: ["delivered"],
  // delivered からは「修正依頼」で revision に戻すフローを許容。
  // 検収完了 (escrow released) は別 API (capture) で実施する。
  delivered: ["revision"],
  cancelled: [],
};

export function isValidStatusTransition(
  current: string,
  next: string
): boolean {
  if (!(current in ALLOWED_TRANSITIONS)) return false;
  return ALLOWED_TRANSITIONS[current as OrderStatus].includes(
    next as OrderStatus
  );
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" && value in ALLOWED_TRANSITIONS
  );
}
