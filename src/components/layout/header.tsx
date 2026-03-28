"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    role?: string;
  };
} | null;

export function Header({ user }: { user?: User }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "ユーザー";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-[6.25rem]">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-sm font-black text-white">
              C
            </div>
            <span className="text-xl font-bold text-[#222]">
              CreatorsHub
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/creators"
              className="text-[15px] font-medium text-[#4F4F4F] transition-colors hover:text-primary-500"
            >
              クリエイターを探す
            </Link>
            <Link
              href="/how-it-works"
              className="text-[15px] font-medium text-[#4F4F4F] transition-colors hover:text-primary-500"
            >
              使い方
            </Link>
            <Link
              href="/for-business"
              className="text-[15px] font-medium text-[#4F4F4F] transition-colors hover:text-primary-500"
            >
              企業の方へ
            </Link>
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-pill border border-[#E0E0E0] px-4 py-2 text-sm font-medium text-[#4F4F4F] transition-colors hover:border-[#BDBDBD] hover:bg-[#F8F8F8]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                  {displayName.charAt(0)}
                </div>
                <span className="max-w-[120px] truncate">{displayName}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
                    <div className="border-b border-[#F2F2F2] px-4 py-2">
                      <p className="text-xs text-[#828282]">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm text-[#4F4F4F] hover:bg-[#F8F8F8]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      ダッシュボード
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2.5 text-sm text-[#4F4F4F] hover:bg-[#F8F8F8]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      設定
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full border-t border-[#F2F2F2] px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
                    >
                      ログアウト
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-white h-10 text-sm">
                ログイン
              </Link>
              <Link href="/register" className="btn-primary h-10 px-6 text-sm">
                新規登録
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#BDBDBD] md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="h-5 w-5 text-[#4F4F4F]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[70px] bg-white shadow-lg md:hidden">
          <div className="space-y-1 px-6 py-6">
            <Link
              href="/creators"
              className="block py-3 text-2xl font-black text-[#222]"
              onClick={() => setMobileMenuOpen(false)}
            >
              クリエイターを探す
            </Link>
            <Link
              href="/how-it-works"
              className="block py-3 text-2xl font-black text-[#222]"
              onClick={() => setMobileMenuOpen(false)}
            >
              使い方
            </Link>
            <Link
              href="/for-business"
              className="block py-3 text-2xl font-black text-[#222]"
              onClick={() => setMobileMenuOpen(false)}
            >
              企業の方へ
            </Link>
            <div className="mt-6 flex flex-col gap-3 pt-6">
              {user ? (
                <>
                  <div className="mb-2 text-sm text-[#828282]">
                    {displayName} でログイン中
                  </div>
                  <Link
                    href="/dashboard"
                    className="btn-primary justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ダッシュボード
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="btn-white justify-center text-red-500"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn-white justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    新規登録
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
