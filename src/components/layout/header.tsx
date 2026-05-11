"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/actions/notifications";

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

  // タップで消した通知 ID (楽観的に即非表示)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const visibleNotifications = notifications.filter(
    (n) => !dismissedIds.has(n.id)
  );

  const serverUnreadNotifs = visibleNotifications.filter(
    (n) => !n.is_read
  ).length;
  // 開いた直後は表示用カウントを 0 にする (再フェッチを待たずバッジ即消し)
  const [unreadOverride, setUnreadOverride] = useState<number | null>(null);
  const unreadNotifs = unreadOverride ?? serverUnreadNotifs;

  // サーバ側でカウントが変わったら override を解除
  useEffect(() => {
    setUnreadOverride(null);
  }, [serverUnreadNotifs]);

  const handleNotifToggle = async () => {
    const willOpen = !notifOpen;
    setNotifOpen(willOpen);
    setUserMenuOpen(false);
    if (willOpen && serverUnreadNotifs > 0) {
      setUnreadOverride(0);
      await markAllNotificationsAsRead();
      router.refresh();
    }
  };

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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-[6.25rem]">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-12">
          <Link href="/" className="group/logo flex items-baseline gap-2">
            <span className="font-display text-2xl font-medium leading-none tracking-tightest-x text-ink">
              Creators
            </span>
            <span className="font-display text-2xl font-medium leading-none tracking-tightest-x text-primary-500">
              .
            </span>
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.3em] text-ink-muted transition-colors group-hover/logo:text-ink">
              hub
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/creators"
              className="relative text-[13px] font-medium tracking-wide text-ink transition-colors hover:text-primary-500"
            >
              クリエイター
            </Link>
            <Link
              href="/jobs"
              className="text-[13px] font-medium tracking-wide text-ink transition-colors hover:text-primary-500"
            >
              案件
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-[13px] font-medium tracking-wide text-ink transition-colors hover:text-primary-500"
              >
                マイページ
              </Link>
            )}
            <Link
              href="/how-it-works"
              className="text-[13px] font-medium tracking-wide text-ink transition-colors hover:text-primary-500"
            >
              使い方
            </Link>
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {/* Message icon with badge */}
              <Link
                href="/dashboard/messages"
                className="relative flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-primary-500"
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
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-primary-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              {/* Notification bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleNotifToggle}
                  className="relative flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-primary-500"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  {unreadNotifs > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-primary-500 px-1 text-[10px] font-bold text-white">
                      {unreadNotifs > 99 ? "99+" : unreadNotifs}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-3 w-80 border border-ink bg-paper py-2 shadow-[6px_6px_0_0_rgba(26,26,26,1)]">
                      <div className="border-b border-ink/15 px-4 py-2">
                        <p className="font-display text-sm font-medium text-ink">通知</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {visibleNotifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-ink-soft">
                            通知はありません
                          </div>
                        ) : (
                          visibleNotifications.slice(0, 10).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "/dashboard"}
                              onClick={() => {
                                setNotifOpen(false);
                                // 楽観的にリストから削除 → DBからも削除
                                setDismissedIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(n.id);
                                  return next;
                                });
                                void deleteNotification(n.id).then(() => {
                                  router.refresh();
                                });
                              }}
                              className={`block border-b border-ink/10 px-4 py-3 transition-colors last:border-0 hover:bg-paper-deep ${!n.is_read ? "bg-primary-50" : ""}`}
                            >
                              <p className={`text-sm ${!n.is_read ? "font-bold text-ink" : "text-ink-muted"}`}>
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="mt-0.5 truncate text-xs text-ink-muted">
                                  {n.body}
                                </p>
                              )}
                              <p className="mt-1 text-[10px] text-ink-soft">
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
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 border border-ink/30 px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                style={{ borderRadius: "2px" }}
              >
                <div className="flex h-6 w-6 items-center justify-center bg-primary-500 font-display text-xs font-medium text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{displayName}</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
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
                  <div className="absolute right-0 top-full z-50 mt-3 w-52 border border-ink bg-paper py-2 shadow-[6px_6px_0_0_rgba(26,26,26,1)]">
                    <div className="border-b border-ink/15 px-4 py-2">
                      <p className="text-xs text-ink-muted">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-paper-deep"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      ダッシュボード
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2.5 text-sm text-ink transition-colors hover:bg-paper-deep"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      設定
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full border-t border-ink/15 px-4 py-2.5 text-left text-sm text-primary-600 transition-colors hover:bg-primary-50"
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
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-primary-500"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 bg-ink px-5 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-primary-500"
                style={{ borderRadius: "2px" }}
              >
                新規登録
                <span aria-hidden>→</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center border border-ink md:hidden"
          style={{ borderRadius: "2px" }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg
            className="h-5 w-5 text-ink"
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
        <div className="fixed inset-x-0 top-[80px] border-t border-ink/10 bg-paper md:hidden">
          <div className="space-y-0 px-6 py-6">
            <Link
              href="/creators"
              className="flex items-center justify-between border-b border-ink/15 py-4 font-display text-2xl font-medium tracking-tightest-x text-ink"
              onClick={() => setMobileMenuOpen(false)}
            >
              クリエイター
              <span className="text-primary-500">→</span>
            </Link>
            <Link
              href="/jobs"
              className="flex items-center justify-between border-b border-ink/15 py-4 font-display text-2xl font-medium tracking-tightest-x text-ink"
              onClick={() => setMobileMenuOpen(false)}
            >
              案件
              <span className="text-primary-500">→</span>
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="flex items-center justify-between border-b border-ink/15 py-4 font-display text-2xl font-medium tracking-tightest-x text-ink"
                onClick={() => setMobileMenuOpen(false)}
              >
                マイページ
                <span className="text-primary-500">→</span>
              </Link>
            )}
            <Link
              href="/how-it-works"
              className="flex items-center justify-between border-b border-ink/15 py-4 font-display text-2xl font-medium tracking-tightest-x text-ink"
              onClick={() => setMobileMenuOpen(false)}
            >
              使い方
              <span className="text-primary-500">→</span>
            </Link>
            <div className="mt-6 flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  <div className="mb-2 text-sm text-ink-muted">
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
                    className="btn-white justify-center text-primary-600"
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
