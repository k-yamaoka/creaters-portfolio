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

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function Header({
  user,
  unreadCount = 0,
  notifications = [],
}: {
  user?: User;
  unreadCount?: number;
  notifications?: Notification[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

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
              href="/jobs"
              className="text-[15px] font-medium text-[#4F4F4F] transition-colors hover:text-primary-500"
            >
              案件を探す
            </Link>
            <Link
              href="/how-it-works"
              className="text-[15px] font-medium text-[#4F4F4F] transition-colors hover:text-primary-500"
            >
              使い方
            </Link>
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {/* Message icon with badge */}
              <Link
                href="/dashboard/messages"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#4F4F4F] transition-colors hover:bg-[#F2F2F2]"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              {/* Notification bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#4F4F4F] transition-colors hover:bg-[#F2F2F2]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  {unreadNotifs > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadNotifs > 99 ? "99+" : unreadNotifs}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
                      <div className="border-b border-[#F2F2F2] px-4 py-2">
                        <p className="text-sm font-bold text-[#222]">通知</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-[#BDBDBD]">
                            通知はありません
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "/dashboard"}
                              onClick={() => setNotifOpen(false)}
                              className={`block px-4 py-3 transition-colors hover:bg-[#F8F8F8] ${!n.is_read ? "bg-primary-50/50" : ""}`}
                            >
                              <p className={`text-sm ${!n.is_read ? "font-bold text-[#222]" : "text-[#4F4F4F]"}`}>
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="mt-0.5 truncate text-xs text-[#828282]">
                                  {n.body}
                                </p>
                              )}
                              <p className="mt-1 text-[10px] text-[#BDBDBD]">
                                {new Date(n.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
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
            </>
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
              href="/jobs"
              className="block py-3 text-2xl font-black text-[#222]"
              onClick={() => setMobileMenuOpen(false)}
            >
              案件を探す
            </Link>
            <Link
              href="/how-it-works"
              className="block py-3 text-2xl font-black text-[#222]"
              onClick={() => setMobileMenuOpen(false)}
            >
              使い方
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
