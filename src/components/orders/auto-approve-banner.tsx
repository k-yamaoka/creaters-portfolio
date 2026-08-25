import { formatDateTimeJP } from "@/lib/utils";

/**
 * みなし検収 (auto_approve_at) 予告バナー。
 * status='delivered' + escrow_status='held' の間だけ表示。
 *
 * 表示:
 *   - client: 「YYYY/MM/DD HH:mm に自動で検収完了になります (残り N 日)」
 *   - creator: 「YYYY/MM/DD HH:mm に自動検収 → 報酬確定します (残り N 日)」
 *
 * DB は timestamptz (UTC) 保存。formatDateTimeJP が Asia/Tokyo で整形する。
 */

type Props = {
  autoApproveAt: string | null | undefined;
  isCreator: boolean;
  escrowStatus?: string | null;
  status?: string | null;
};

export function AutoApproveBanner({
  autoApproveAt,
  isCreator,
  escrowStatus,
  status,
}: Props) {
  if (!autoApproveAt) return null;
  // 検収完了済 (released) は既に確定しているので表示しない
  if (escrowStatus === "released" || escrowStatus === "refunded") return null;
  if (status !== "delivered" && status !== "revision") return null;

  const target = new Date(autoApproveAt);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.max(0, Math.floor((diffMs % 86_400_000) / 3_600_000));

  const passed = diffMs < 0;
  const remainingLabel = passed
    ? "(まもなく自動検収されます)"
    : days > 0
      ? `残り ${days} 日 ${hours} 時間`
      : `残り約 ${Math.max(0, hours)} 時間`;

  const tone = passed
    ? "border-red-300 bg-red-50 text-red-900"
    : days <= 1
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-emerald-300 bg-emerald-50 text-emerald-900";

  const body = isCreator
    ? `${formatDateTimeJP(target)} JST に自動検収され、報酬が確定します。`
    : `成果物を確認し「検収完了」を押してください。${formatDateTimeJP(target)} JST に自動で検収されます。`;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${tone}`}
      role="status"
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-bold">みなし検収予定:</span>
        <span className="tabular-nums">{formatDateTimeJP(target)}</span>
        <span className="text-xs font-medium opacity-80">
          {remainingLabel}
        </span>
      </div>
      <p className="mt-1 text-xs opacity-90">{body}</p>
    </div>
  );
}
