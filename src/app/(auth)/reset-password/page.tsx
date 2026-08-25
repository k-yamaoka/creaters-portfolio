"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * パスワードリセット完了ページ。
 * Supabase の resetPasswordForEmail メール内リンクからここに来る想定。
 * その時点で session (auth cookie) がセットされているので updateUser で
 * password を更新できる。
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // メールリンク経由なら session がすでに確立している (PASSWORD_RECOVERY event)。
    // 未認証の状態でこのページに直接来た場合はガード。
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setError(
          "リンクの有効期限が切れているか、正しく開けませんでした。もう一度お試しください。"
        );
      } else {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("パスワードは 6 文字以上で入力してください");
      return;
    }
    if (password !== confirm) {
      setError("確認用パスワードが一致しません");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updErr) {
      setError(`更新に失敗しました: ${updErr.message}`);
      return;
    }
    router.replace("/dashboard?password_reset=1");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold text-[#222]">新しいパスワードを設定</h1>
      <p className="mt-2 text-sm text-[#828282]">
        6 文字以上のパスワードを入力してください。
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <div className="mt-3">
            <Link
              href="/forgot-password"
              className="text-xs text-red-700 underline"
            >
              リセットを再度申請する
            </Link>
          </div>
        </div>
      )}

      {ready && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              新しいパスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none transition-colors focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
              placeholder="6文字以上"
            />
          </div>
          <div>
            <label
              htmlFor="confirm"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              確認用 (もう一度入力)
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none transition-colors focus:border-aimovie-ember-500 focus:ring-1 focus:ring-aimovie-ember-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "更新中..." : "パスワードを更新"}
          </button>
        </form>
      )}
    </div>
  );
}
