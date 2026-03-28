"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function PaymentButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!stripePromise) {
        setError("Stripe is not configured");
        setLoading(false);
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setError("Stripe failed to load");
        setLoading(false);
        return;
      }

      const { error: stripeError } = await stripe.confirmCardPayment(
        data.clientSecret
      );

      if (stripeError) {
        setError(stripeError.message ?? "決済に失敗しました");
        setLoading(false);
        return;
      }

      // Payment authorized (held) - update order status
      const updateRes = await fetch("/api/stripe/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (updateRes.ok) {
        window.location.reload();
      }
    } catch {
      setError("エラーが発生しました");
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className="btn-primary text-sm disabled:opacity-50"
      >
        {loading ? "処理中..." : "仮払いする（Stripe）"}
      </button>
      <p className="mt-2 text-[11px] text-[#BDBDBD]">
        ※ 検収完了まで資金はホールドされます
      </p>
    </div>
  );
}
