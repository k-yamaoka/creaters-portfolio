import { ShieldOff } from "lucide-react";

/**
 * 外部取引禁止 啓蒙バナー (00071)。
 * メッセージ入力欄の上または下に配置する。
 */
export function ExternalTxWarning({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-center gap-1.5 rounded-md bg-amber-50/60 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800 ${className}`}
    >
      <ShieldOff
        size={11}
        strokeWidth={2}
        className="shrink-0 text-amber-600"
        aria-hidden
      />
      ※ 外部ツール (LINE / Slack / メール等) でのやり取り・納品はトラブル時の補償対象外となります。取引はすべて AILIER 上で完結してください。
    </p>
  );
}
