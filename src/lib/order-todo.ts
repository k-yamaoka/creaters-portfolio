/**
 * 取引画面のアクションを「やること」として要約するヘルパー。
 *
 * order_status と現在ユーザーのロールから、その人に求められている次の
 * アクションを返す。メッセージ画面の TODO バナーで使うほか、
 * 将来的にダッシュボードのリマインダー一覧などにも流用可能。
 */
import type { OrderStatus } from "@/lib/order-status";

export type Role = "client" | "creator" | "admin";

export type OrderTodo = {
  /** 現在ユーザーがやるべきこと(なければ null = 相手待ち) */
  viewerAction: { label: string; href: string } | null;
  /** 相手側がやるべきこと(参考情報、null なら表示不要) */
  partnerAction: { label: string; whom: "client" | "creator" } | null;
  /** ステータスに対する一言説明 */
  summary: string;
};

type ActionLabels = {
  client?: string;
  creator?: string;
  /** どっち側でも進められるステージ */
  either?: { client: string; creator: string };
  summary: string;
};

const STAGE_ACTIONS: Record<OrderStatus, ActionLabels> = {
  consultation: {
    summary: "依頼内容のすり合わせ中です",
    client: "見積もり内容が固まったら「発注に進む（契約へ）」を押してください",
  },
  quoting: {
    summary: "クリエイターからの見積もり提示中",
    client: "見積もりを確認して「承認」を押してください",
  },
  contract: {
    summary: "契約確定。仮払いをお願いします",
    client: "「仮払いする」で決済を開始してください (Stripe)",
  },
  data_sharing: {
    summary: "素材・参考資料を共有してください",
    either: {
      client: "素材を共有し「データ共有を完了する」を押してください",
      creator: "素材受領後「制作開始」を押して制作に進めてください",
    },
  },
  production: {
    summary: "クリエイターが制作進行中",
    creator: "完成したら「納品する」を押してください",
  },
  revision: {
    summary: "修正対応中",
    creator: "修正版が完成したら「修正して再納品」を押してください",
  },
  delivered: {
    summary: "納品完了。クライアントの検収待ち",
    client: "成果物を確認し「検収完了（決済確定）」を押してください",
  },
  cancelled: {
    summary: "この取引はキャンセル済みです",
  },
};

export function getOrderTodo(
  status: string,
  viewerRole: Role,
  orderId: string
): OrderTodo {
  const cfg = STAGE_ACTIONS[status as OrderStatus];
  if (!cfg) {
    return {
      viewerAction: null,
      partnerAction: null,
      summary: "状態を確認中…",
    };
  }

  const href = `/dashboard/orders/${orderId}`;

  let viewerAction: OrderTodo["viewerAction"] = null;
  let partnerAction: OrderTodo["partnerAction"] = null;

  if (cfg.either) {
    // 双方どちらでも先に進められる
    const myLabel =
      viewerRole === "client" ? cfg.either.client : cfg.either.creator;
    viewerAction = { label: myLabel, href };
  } else if (viewerRole === "client" && cfg.client) {
    viewerAction = { label: cfg.client, href };
  } else if (viewerRole === "creator" && cfg.creator) {
    viewerAction = { label: cfg.creator, href };
  } else {
    // 自分の番ではない場合、相手側に何が求められているか表示する
    if (viewerRole === "client" && cfg.creator) {
      partnerAction = { label: cfg.creator, whom: "creator" };
    } else if (viewerRole === "creator" && cfg.client) {
      partnerAction = { label: cfg.client, whom: "client" };
    }
  }

  return {
    viewerAction,
    partnerAction,
    summary: cfg.summary,
  };
}
