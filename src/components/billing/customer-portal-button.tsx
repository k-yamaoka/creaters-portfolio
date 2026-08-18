"use client";

import { useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

/**
 * 「Stripe Customer Portal を開く」ボタン。
 * client のみ有効。押下で POST /api/stripe/customer-portal を叩き、返された
 * URL に window.location で飛ばす (Portal は Stripe ホストの外部ページ)。
 */
export function CustomerPortalButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: "/dashboard/billing" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Customer Portal を開けませんでした");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        <CreditCard size={16} />
        {loading ? "接続中..." : "支払い・領収書を管理 (Stripe)"}
        <ExternalLink size={12} />
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
