import { createClient } from "@/lib/supabase/server";
import { getFoundingStats } from "@/lib/founding-creator";
import { Sparkles } from "lucide-react";

/**
 * ファウンディング クリエイター 先着 50 名の充填状況を表示する
 * Server Component (D-1 実装 2026-07-15)。
 *
 * "残り X 名 / 50 名" と、既に満枠のときは "受付終了" を表示。
 * 希少性を強調するため、残数が少ないほど色を強める。
 *
 * 使い所: /register, /creators (Hero), /creator-guide 等。
 * 動的値のため呼び出しページでは `revalidate` を短めに (60s) 推奨。
 */
export async function FoundingCreatorCounter({
  variant = "compact",
}: {
  variant?: "compact" | "hero";
}) {
  const supabase = await createClient();
  const stats = await getFoundingStats(supabase);
  const { slotLimit, filled, remaining, isFull } = stats;

  const percent = Math.min(100, Math.round((filled / slotLimit) * 100));
  const urgent = !isFull && remaining <= 10;

  if (variant === "hero") {
    return (
      <div className="rounded-2xl border border-aimovie-ember-500/30 bg-gradient-to-br from-aimovie-ember-500/10 via-white to-aimovie-navy-700/10 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles
            size={16}
            strokeWidth={2}
            className="text-aimovie-ember-500"
            aria-hidden
          />
          <p className="text-xs font-bold uppercase tracking-widest text-aimovie-ember-500">
            Founding Creators / 創設メンバー
          </p>
        </div>
        <p className="mt-2 text-2xl font-black text-gray-900">
          {isFull ? (
            <>受付終了</>
          ) : (
            <>
              残り <span className="text-aimovie-ember-500">{remaining}</span> 名 / 全
              {slotLimit} 名
            </>
          )}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full transition-all ${
              isFull
                ? "bg-gray-400"
                : urgent
                  ? "bg-red-500"
                  : "bg-aimovie-ember-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray-600">
          先着 50 名限定。永久手数料 0% ・検索優先表示 ・案件優先紹介。
          {urgent && !isFull && (
            <span className="ml-1 font-bold text-red-600">
              まもなく締切
            </span>
          )}
        </p>
      </div>
    );
  }

  // compact
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        isFull
          ? "border-gray-300 bg-gray-100 text-gray-500"
          : urgent
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-aimovie-ember-500/40 bg-aimovie-ember-500/5 text-aimovie-ember-500"
      }`}
    >
      <Sparkles size={12} strokeWidth={2} aria-hidden />
      {isFull ? (
        <span>創設メンバー 受付終了</span>
      ) : (
        <span>
          創設メンバー枠 残り <b>{remaining}</b> / {slotLimit}
        </span>
      )}
    </div>
  );
}
