import { AlertTriangle } from "lucide-react";
import { isEscrowFunded } from "@/lib/order-flow";

/**
 * 仮払い前アラート バナー (00071)。
 *
 * 「仮払いが完了するまで作業を開始しないでください」を取引画面上部に常時表示。
 * escrow が pending / refunded の場合に render。held / released では非表示。
 *
 * variant:
 *   - "creator" — クリエイター側視点 (作業開始を控えるよう促す)
 *   - "client"  — クライアント側視点 (仮払いを促す)
 */

type Props = {
  escrowStatus: string | null | undefined;
  isCreator: boolean;
};

export function PrePaymentAlert({ escrowStatus, isCreator }: Props) {
  if (isEscrowFunded(escrowStatus)) return null;
  // refunded は "終了" 側の状態なので事前アラートは出さない
  if (escrowStatus === "refunded") return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle
          size={18}
          strokeWidth={2}
          className="text-amber-700"
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">
          ⚠️ 仮払いが完了するまで作業を開始しないでください
        </p>
        {isCreator ? (
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            クライアントの仮払い (エスクロー) が確定していません。
            <b>この段階で制作を開始すると、未払いのリスク</b> があります。
            仮払い完了後、ステータスが「制作中」に変わってから作業を開始してください。
          </p>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            仮払い (エスクロー) がまだ完了していません。
            <b>制作を進めていただくには、まず仮払いを完了</b> してください。
            クリエイター保護のため、仮払い前の納品は許可されません。
          </p>
        )}
      </div>
    </div>
  );
}
