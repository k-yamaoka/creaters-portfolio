"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "creator">("client");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 text-center shadow-card">
            <div className="mb-4 text-4xl">✉️</div>
            <h2 className="mb-2 text-xl font-bold text-[#222]">
              確認メールを送信しました
            </h2>
            <p className="mb-6 text-sm text-[#828282]">
              {email}{" "}
              に確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
            </p>
            <Link href="/login" className="btn-primary">
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-sm font-black text-white">
              C
            </div>
            <span className="text-xl font-bold text-[#222]">CreatorsHub</span>
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card">
          <h1 className="mb-6 text-center text-2xl font-bold text-[#222]">
            新規登録
          </h1>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4F4F4F]">
                アカウントの種類
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    role === "client"
                      ? "border-primary-500 bg-primary-50 text-primary-500"
                      : "border-[#E0E0E0] text-[#4F4F4F] hover:border-[#BDBDBD]"
                  }`}
                >
                  <div className="text-lg">🏢</div>
                  <div className="mt-1">依頼者</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("creator")}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    role === "creator"
                      ? "border-primary-500 bg-primary-50 text-primary-500"
                      : "border-[#E0E0E0] text-[#4F4F4F] hover:border-[#BDBDBD]"
                  }`}
                >
                  <div className="text-lg">🎬</div>
                  <div className="mt-1">クリエイター</div>
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="山田 太郎"
              />
            </div>

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
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="6文字以上"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "登録中..." : "アカウントを作成"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#828282]">
            すでにアカウントをお持ちの方は{" "}
            <Link
              href="/login"
              className="font-medium text-primary-500 hover:underline"
            >
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
