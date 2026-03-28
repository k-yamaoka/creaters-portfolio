"use client";

import { useState, useEffect } from "react";

export function StripeConnectButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
  } | null>(null);

  useEffect(() => {
    fetch("/api/stripe/connect")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false }));
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <p className="text-sm text-[#828282]">読み込み中...</p>
      </div>
    );
  }

  if (status.connected && status.charges_enabled && status.payouts_enabled) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#222]">Stripe接続済み</p>
            <p className="text-xs text-[#828282]">
              報酬の受け取りが可能です
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-6">
      <h3 className="font-bold text-[#222]">報酬受取の設定</h3>
      <p className="mt-1 text-sm text-[#828282]">
        Stripeアカウントを接続して、クライアントからの報酬を受け取れるようにしましょう。
      </p>
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="btn-primary mt-4 text-sm disabled:opacity-50"
      >
        {loading
          ? "接続中..."
          : status.connected
            ? "設定を完了する"
            : "Stripeアカウントを接続"}
      </button>
    </div>
  );
}
