import Link from "next/link";
import { getOrderTodo, type Role } from "@/lib/order-todo";
import { getStatusMeta } from "@/lib/order-status";

/**
 * メッセージ画面で「いま自分が何をすべきか」を黄色背景のバナーで表示する。
 * 取引(order)が結びついている会話のみ表示し、status が cancelled / 完了状態
 * でも要約だけは出して経緯が分かるようにする。
 */
export function OrderTodoBanner({
  orderId,
  orderTitle,
  status,
  viewerRole,
}: {
  orderId: string;
  orderTitle: string;
  status: string;
  viewerRole: Role;
}) {
  const todo = getOrderTodo(status, viewerRole, orderId);
  const statusMeta = getStatusMeta(status);

  const isMyTurn = !!todo.viewerAction;
  const isCancelled = status === "cancelled";

  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        isCancelled
          ? "border-ink/10 bg-paper-deep/40"
          : isMyTurn
            ? "border-accent-400 bg-accent-50"
            : "border-ink/10 bg-paper-deep/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-pill text-base ${
            isMyTurn && !isCancelled
              ? "bg-accent-400 text-ink"
              : "bg-ink/10 text-ink-muted"
          }`}
          aria-hidden
        >
          {isCancelled ? "×" : isMyTurn ? "!" : "⏳"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
              {isCancelled
                ? "取引キャンセル"
                : isMyTurn
                  ? "あなたのやること"
                  : "相手の対応待ち"}
            </span>
            <span
              className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold ${statusMeta.color}`}
            >
              {statusMeta.shortLabel}
            </span>
            <Link
              href={`/dashboard/orders/${orderId}`}
              className="truncate text-xs font-bold text-ink-muted hover:text-primary-600"
              title={orderTitle}
            >
              {orderTitle}
            </Link>
          </div>

          <p className="mt-1 text-sm font-bold text-ink">{todo.summary}</p>

          {todo.viewerAction && (
            <Link
              href={todo.viewerAction.href}
              className="mt-3 inline-flex items-center gap-2 rounded-pill bg-ink px-4 py-2 text-xs font-bold text-paper transition-opacity hover:opacity-80"
            >
              <span>{todo.viewerAction.label}</span>
              <span aria-hidden>→</span>
            </Link>
          )}

          {!todo.viewerAction && todo.partnerAction && (
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              {todo.partnerAction.whom === "creator"
                ? "クリエイター側"
                : "クライアント側"}{" "}
              の対応待ち:{" "}
              <span className="font-bold text-ink">{todo.partnerAction.label}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
