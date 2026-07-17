import { Shield, ShieldCheck, ShieldQuestion } from "lucide-react";

/**
 * 運営裁定 進捗バッジ (00071)。
 *
 * 仕様: ユーザー UI では 受付済 / 確認中 / 対応完了 の 3 バッジのみ表示。
 * 内部メモ (internal_note) は返却しない。
 */

export type DisputeAdminStatus = "received" | "reviewing" | "resolved";

type Props = {
  status: DisputeAdminStatus;
  className?: string;
};

const META: Record<
  DisputeAdminStatus,
  { label: string; cls: string; Icon: typeof Shield }
> = {
  received: {
    label: "受付しました",
    cls: "border-indigo-200 bg-indigo-50 text-indigo-800",
    Icon: Shield,
  },
  reviewing: {
    label: "確認中です",
    cls: "border-amber-200 bg-amber-50 text-amber-800",
    Icon: ShieldQuestion,
  },
  resolved: {
    label: "対応完了しました",
    cls: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icon: ShieldCheck,
  },
};

export function DisputeStatusBadge({ status, className = "" }: Props) {
  const m = META[status];
  const Icon = m.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-bold ${m.cls} ${className}`}
    >
      <Icon size={12} strokeWidth={2} aria-hidden />
      運営: {m.label}
    </span>
  );
}
