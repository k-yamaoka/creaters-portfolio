"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "認証エラーが発生しました" : null
  );
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4">
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
            ログイン
          </h1>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
              {loading ? "ログイン中..." : "ログイン"}
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
              Googleでログイン
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/api/auth/line";
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#06C755] bg-[#06C755] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#05b14c]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 5.64 2 10.14c0 4.05 3.6 7.44 8.46 8.08.33.07.78.22.89.5.1.26.07.66.03.92l-.14.87c-.04.26-.2 1.02.89.56.64-.27 3.44-2.03 4.7-3.47C19.53 15.6 22 13.05 22 10.14 22 5.64 17.52 2 12 2zm-3.32 10.87H6.7a.47.47 0 01-.47-.47V8.03c0-.26.21-.47.47-.47s.47.21.47.47v3.9h1.51c.26 0 .47.21.47.47s-.21.47-.47.47zm1.67-.47a.47.47 0 01-.94 0V8.03a.47.47 0 01.94 0v4.37zm4.03 0a.47.47 0 01-.33.45.47.47 0 01-.52-.17l-2.13-2.9v2.62a.47.47 0 01-.94 0V8.03a.47.47 0 01.33-.45.47.47 0 01.52.17l2.13 2.9V8.03a.47.47 0 01.94 0v4.37zm3.12-3.43a.47.47 0 010 .94h-1.51v.78h1.51a.47.47 0 010 .94h-1.51v.78h1.51a.47.47 0 010 .94h-1.98a.47.47 0 01-.47-.47V8.03c0-.26.21-.47.47-.47h1.98a.47.47 0 010 .94h-1.51v.78h1.51z" />
              </svg>
              LINEでログイン
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-[#828282]">
            アカウントをお持ちでない方は{" "}
            <Link
              href="/register"
              className="font-medium text-primary-500 hover:underline"
            >
              新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
