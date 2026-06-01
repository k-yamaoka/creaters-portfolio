"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/actions/notifications";
import { NeonStar } from "@/components/ui/illustrations-retrowave";

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

type Role = "creator" | "client" | "admin" | null;

export function Header({
  user,
  unreadCount = 0,
  notifications = [],
  role = null,
}: {
  user?: User;
  unreadCount?: number;
  notifications?: Notification[];
  role?: Role;
}) {
  const isCreator = role === "creator";
  const isClient = role === "client";
  const isAdmin = role === "admin";
  // creator も「クリエイター一覧」リンクを使えるように true。
  // 文言はロールで出し分け (creator: 「クリエイター一覧」, それ以外: 「クリエイターを探す」)
  const showCreatorsLink = true;
  const creatorsLinkLabel = isCreator ? "クリエイター一覧" : "クリエイターを探す";
  const showJobsLink = !user || isCreator || isAdmin;
  const showPostJobCta = isClient;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>(
    notifications
  );

  useEffect(() => {
    setLiveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setLiveNotifications((prev) =>
            prev.some((x) => x.id === n.id) ? prev : [n, ...prev]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setLiveNotifications((prev) =>
            prev.map((x) => (x.id === n.id ? n : x))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const id = (payload.old as { id?: string })?.id;
          if (!id) return;
          setLiveNotifications((prev) => prev.filter((x) => x.id !== id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const visibleNotifications = liveNotifications.filter(
    (n) => !dismissedIds.has(n.id)
  );

  const serverUnreadNotifs = visibleNotifications.filter(
    (n) => !n.is_read
  ).length;
  const [unreadOverride, setUnreadOverride] = useState<number | null>(null);
  const unreadNotifs = unreadOverride ?? serverUnreadNotifs;

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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-neon-midnight-deep/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-container items-center justify-between px-6 lg:px-10">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="group/logo flex items-center gap-2.5"
            aria-label="AILIER ホーム"
          >
            <span className="block text-neon-pink transition-transform group-hover/logo:rotate-12 drop-shadow-[0_0_8px_rgba(255,77,157,0.6)]">
              <NeonStar size={32} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-black tracking-tight text-white">
                AI<span className="bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent">LIER</span>
              </span>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-white/40">
                AI creators × business
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {showCreatorsLink && (
              <Link
                href="/creators"
                className="rounded-pill px-4 py-2 text-[13px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-neon-pink"
              >
                {creatorsLinkLabel}
              </Link>
            )}
            {showCreatorsLink && (
              <Link
                href="/portfolios"
                className="rounded-pill px-4 py-2 text-[13px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-neon-pink"
              >
                ポートフォリオ
              </Link>
            )}
            {showJobsLink && (
              <Link
                href="/jobs"
                className="rounded-pill px-4 py-2 text-[13px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-neon-pink"
              >
                案件を探す
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                className="rounded-pill px-4 py-2 text-[13px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-neon-pink"
              >
                マイページ
              </Link>
            )}
            <Link
              href="/how-it-works"
              className="rounded-pill px-4 py-2 text-[13px] font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-neon-pink"
            >
              使い方
            </Link>
          </nav>
        </div>

        {/* Right: Auth */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {showPostJobCta && (
                <Link
                  href="/dashboard/jobs/new"
                  className="mr-1 inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(255,77,157,0.6)]"
                >
                  案件を発注する
                  <span aria-hidden>→</span>
                </Link>
              )}
              {/* Message icon */}
              <Link
                href="/dashboard/messages"
                className="relative flex h-10 w-10 items-center justify-center rounded-pill text-white/80 transition-colors hover:bg-white/10 hover:text-neon-pink"
                aria-label="メッセージ"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-neon-pink px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,77,157,0.7)]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              {/* Notification bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleNotifToggle}
                  className="relative flex h-10 w-10 items-center justify-center rounded-pill text-white/80 transition-colors hover:bg-white/10 hover:text-neon-pink"
                  aria-label="通知"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                    />
                  </svg>
                  {unreadNotifs > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-neon-pink px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,77,157,0.7)]">
                      {unreadNotifs > 99 ? "99+" : unreadNotifs}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-xl border border-white/10 bg-neon-midnight-deep shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                      <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                        <p className="text-sm font-bold text-white">通知</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {visibleNotifications.length === 0 ? (
                          <div className="px-4 py-10 text-center text-sm text-white/50">
                            通知はありません
                          </div>
                        ) : (
                          visibleNotifications.slice(0, 10).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "/dashboard"}
                              onClick={() => {
                                setNotifOpen(false);
                                setDismissedIds((prev) => {
                                  const next = new Set(prev);
                                  next.add(n.id);
                                  return next;
                                });
                                void deleteNotification(n.id).then(() => {
                                  router.refresh();
                                });
                              }}
                              className={`block border-b border-white/5 px-4 py-3 transition-colors last:border-0 hover:bg-white/5 ${
                                !n.is_read ? "bg-neon-pink/10" : ""
                              }`}
                            >
                              <p
                                className={`text-sm ${
                                  !n.is_read
                                    ? "font-bold text-white"
                                    : "text-white/70"
                                }`}
                              >
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="mt-0.5 truncate text-xs text-white/60">
                                  {n.body}
                                </p>
                              )}
                              <p className="mt-1 text-[10px] text-white/40">
                                {new Date(n.created_at).toLocaleDateString(
                                  "ja-JP",
                                  {
                                    timeZone: "Asia/Tokyo",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
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
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-neon-pink/60 hover:text-neon-pink"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-pill bg-gradient-to-br from-neon-pink to-neon-purple font-bold text-xs text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <svg
                    className={`h-3.5 w-3.5 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
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
                    <div className="absolute right-0 top-full z-50 mt-3 w-52 overflow-hidden rounded-xl border border-white/10 bg-neon-midnight-deep shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                      <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                        <p className="truncate text-xs text-white/60">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5 hover:text-neon-pink"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ダッシュボード
                      </Link>
                      <Link
                        href="/dashboard/likes"
                        className="block px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5 hover:text-neon-pink"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ❤️ いいねした動画
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5 hover:text-neon-pink"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        設定
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full border-t border-white/10 px-4 py-2.5 text-left text-sm font-medium text-neon-pink transition-colors hover:bg-neon-pink/10"
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
                className="rounded-pill px-4 py-2 text-sm font-bold text-white/85 transition-colors hover:bg-white/10 hover:text-neon-pink"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(255,77,157,0.6)]"
              >
                無料ではじめる
                <span aria-hidden>→</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-pill border border-white/15 text-white md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="メニュー"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
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
        <div className="fixed inset-x-0 top-[80px] border-t border-white/5 bg-neon-midnight-deep md:hidden">
          <div className="space-y-0 px-6 py-6">
            {showCreatorsLink && (
              <Link
                href="/creators"
                className="flex items-center justify-between border-b border-white/10 py-4 text-lg font-bold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {creatorsLinkLabel}
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            {showCreatorsLink && (
              <Link
                href="/portfolios"
                className="flex items-center justify-between border-b border-white/10 py-4 text-lg font-bold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                ポートフォリオ
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            {showJobsLink && (
              <Link
                href="/jobs"
                className="flex items-center justify-between border-b border-white/10 py-4 text-lg font-bold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                案件を探す
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            {showPostJobCta && (
              <Link
                href="/dashboard/jobs/new"
                className="flex items-center justify-between border-b border-white/10 py-4 text-lg font-bold text-neon-pink"
                onClick={() => setMobileMenuOpen(false)}
              >
                案件を発注する
                <span>→</span>
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                className="flex items-center justify-between border-b border-white/10 py-4 text-lg font-bold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                マイページ
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            <Link
              href="/how-it-works"
              className="flex items-center justify-between border-b border-white/10 py-4 text-lg font-bold text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              使い方
              <span className="text-neon-pink">→</span>
            </Link>
            <div className="mt-6 flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  <div className="mb-2 text-sm text-white/60">
                    {displayName} でログイン中
                  </div>
                  <Link
                    href="/dashboard"
                    className="btn-neon justify-center"
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
                    className="btn-neon-outline justify-center"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn-neon-outline justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/register"
                    className="btn-neon justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    無料ではじめる
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
