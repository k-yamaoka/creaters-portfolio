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

          {/* Social login divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E0E0E0]" />
            <span className="text-xs text-[#BDBDBD]">または</span>
            <div className="h-px flex-1 bg-[#E0E0E0]" />
          </div>

          {/* Social login buttons */}
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm font-medium text-[#4F4F4F] transition-colors hover:bg-[#F8F8F8]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleで登録
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/yahoo";
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm font-medium text-[#4F4F4F] transition-colors hover:bg-[#F8F8F8]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <rect fill="#FF0033" width="24" height="24" rx="4" />
                <text x="4" y="18" fill="white" fontSize="16" fontWeight="bold" fontFamily="Arial">Y!</text>
              </svg>
              Yahoo! JAPAN IDで登録
            </button>

            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signInWithOAuth({
                  provider: "apple",
                  options: { redirectTo: `${window.location.origin}/auth/callback` },
                });
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm font-medium text-[#4F4F4F] transition-colors hover:bg-[#F8F8F8]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.12 4.53-3.74 4.25z" />
              </svg>
              Apple IDで登録
            </button>
          </div>

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
