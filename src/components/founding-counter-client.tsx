"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * ファウンディング クリエイター 先着 50 名 カウンター (Client 版)。
 *
 * /register のようなクライアント コンポーネントから呼ぶ用途で、
 * mount 時に /api/founding-creators/count を叩いて数字を反映する。
 * Server 版 (FoundingCreatorCounter) と表示ロジックは同じ。
 */

type Stats = {
  slot_limit: number;
  filled: number;
  remaining: number;
  is_full: boolean;
};

export function FoundingCreatorCounterClient() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/founding-creators/count")
      .then((r) => r.json() as Promise<Stats>)
      .then((s) => {
        if (alive) setStats(s);
      })
      .catch(() => {
        /* fetch 失敗時は非表示 */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!stats) return null;

  const urgent = !stats.is_full && stats.remaining <= 10;

  return (
    <div
      className={`mb-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
        stats.is_full
          ? "border-gray-300 bg-gray-100 text-gray-500"
          : urgent
            ? "border-red-300 bg-red-50 text-red-700"
            : "border-neon-pink/40 bg-neon-pink/5 text-neon-pink"
      }`}
    >
      <Sparkles size={12} strokeWidth={2} aria-hidden />
      {stats.is_full ? (
        <span>創設メンバー枠は満枠になりました</span>
      ) : (
        <span>
          創設メンバー枠 残り <b>{stats.remaining}</b> / {stats.slot_limit} 名 (永久手数料 0%)
        </span>
      )}
    </div>
  );
}
