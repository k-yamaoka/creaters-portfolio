"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * パスワードリセット申請ページ。
 * メール入力 → Supabase Auth resetPasswordForEmail 送信。
 * 実際のリセットは Supabase メール内のリンク → /reset-password で行う。
 *
 * セキュリティ: メール存在の enumeration を防ぐため、成否に関わらず
 * 「送信しました」を表示する (Supabase 側も同じ挙動)。
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });
    // 存在しないメールでも成功表示 (enumeration 対策)
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-[#222]">パスワードをリセット</h1>

      {sent ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">📧 リセット用メールを送信しました</p>
          <p className="mt-2 text-xs text-green-700">
            登録されているメールアドレスに、パスワードリセット用のリンクを送信しました。
            メールが届かない場合は迷惑メールフォルダもご確認ください。
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-xs text-green-800 underline"
          >
            ← ログイン画面に戻る
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-[#828282]">
            登録メールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none transition-colors focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
                placeholder="example@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "送信中..." : "リセット用メールを送信"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-[#828282]">
            <Link href="/login" className="text-neon-pink hover:underline">
              ログイン画面に戻る
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
