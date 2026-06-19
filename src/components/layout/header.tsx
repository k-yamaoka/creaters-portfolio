"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/lib/actions/notifications";
import { NeonStar } from "@/components/ui/illustrations-retrowave";
import { Heart } from "lucide-react";

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

  // ===== テーマ判定 (2026-06-17: サイト全体を白基調に統一) =====
  // 旧仕様: dashboard 配下のみ light、それ以外 dark。
  // 新仕様: 常に light。例外として home top の Hero (動画 dark) の上に重なる
  // ときだけ Header を「透過モード」で白文字に切替 (over dark video)。
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/";
  const [scrolledPast, setScrolledPast] = useState(false);
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolledPast(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);
  const isTransparent = isHome && !scrolledPast;
  // 透過時 (=Hero 直上) は白文字 dark テーマの T を使用、それ以外は light。
  const isLight = !isTransparent;

  // 主要なクラス群をテーマ別に集約。ロジック (構造) は同じ、色だけ切替え。
  const T = isLight
    ? {
        header:
          "fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04)]",
        logoText: "font-display text-xl font-black tracking-tight text-gray-900",
        logoSubtitle:
          "mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-gray-400",
        navLink:
          "rounded-pill px-4 py-2 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-100 hover:text-neon-pink",
        iconBtn:
          "relative flex h-10 w-10 items-center justify-center rounded-pill text-gray-600 transition-colors hover:bg-gray-100 hover:text-neon-pink",
        userMenuBtn:
          "flex items-center gap-2 rounded-pill border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 hover:border-neon-pink/60 hover:text-neon-pink",
        dropdown:
          "absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        dropdownSm:
          "absolute right-0 top-full z-50 mt-3 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        dropdownHeader: "border-b border-gray-200 bg-gray-50 px-4 py-3",
        dropdownHeaderText: "text-sm font-bold text-gray-900",
        dropdownSubText: "truncate text-xs text-gray-500",
        notifEmpty: "px-4 py-10 text-center text-sm text-gray-400",
        notifItem:
          "block border-b border-gray-100 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50",
        notifTitleUnread: "text-sm font-bold text-gray-900",
        notifTitle: "text-sm text-gray-700",
        notifBody: "mt-0.5 truncate text-xs text-gray-500",
        notifMeta: "mt-1 text-[10px] text-gray-400",
        menuItem:
          "block px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-neon-pink",
        logoutBtn:
          "w-full border-t border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50",
        loginLink:
          "rounded-pill px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100 hover:text-neon-pink",
        mobileBtn:
          "flex h-10 w-10 items-center justify-center rounded-pill border border-gray-300 text-gray-700 md:hidden",
        mobileMenu:
          "fixed inset-x-0 top-[80px] border-t border-gray-200 bg-white md:hidden",
        mobileLink:
          "flex items-center justify-between border-b border-gray-200 py-4 text-lg font-bold text-gray-900",
        mobileMuted: "mb-2 text-sm text-gray-500",
      }
    : {
        // 2026-06-16 Step 4: ダーク (LP) テーマを Axis Ov Films 系へ刷新。
        // 旧 neon-midnight-deep/neon-pink hover を ink-deep/sand に統一。
        header:
          "fixed left-0 right-0 top-0 z-50 border-b border-paper/10 bg-ink-deep/85 backdrop-blur-xl",
        logoText: "font-display text-xl font-medium tracking-tight text-paper",
        logoSubtitle:
          "mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-paper/40",
        navLink:
          "rounded-pill px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-paper/70 transition-colors hover:text-paper",
        iconBtn:
          "relative flex h-10 w-10 items-center justify-center rounded-pill text-paper/70 transition-colors hover:text-paper",
        userMenuBtn:
          "flex items-center gap-2 rounded-pill border border-paper/20 bg-transparent px-3 py-2 text-xs font-medium text-paper transition-colors hover:border-paper/60",
        dropdown:
          "absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-md border border-paper/15 bg-ink-deep shadow-[0_8px_30px_rgba(0,0,0,0.6)]",
        dropdownSm:
          "absolute right-0 top-full z-50 mt-3 w-52 overflow-hidden rounded-md border border-paper/15 bg-ink-deep shadow-[0_8px_30px_rgba(0,0,0,0.6)]",
        dropdownHeader: "border-b border-paper/10 px-4 py-3",
        dropdownHeaderText: "font-display text-sm font-medium text-paper",
        dropdownSubText: "truncate text-xs text-paper/55",
        notifEmpty: "px-4 py-10 text-center text-sm text-paper/45",
        notifItem:
          "block border-b border-paper/8 px-4 py-3 transition-colors last:border-0 hover:bg-paper/[0.03]",
        notifTitleUnread: "text-sm font-medium text-paper",
        notifTitle: "text-sm text-paper/65",
        notifBody: "mt-0.5 truncate text-xs text-paper/55",
        notifMeta: "mt-1 font-mono text-[10px] uppercase tracking-wider text-paper/35",
        menuItem:
          "block px-4 py-2.5 text-sm font-medium text-paper/85 transition-colors hover:bg-paper/[0.04] hover:text-paper",
        logoutBtn:
          "w-full border-t border-paper/10 px-4 py-2.5 text-left text-sm font-medium text-paper/65 transition-colors hover:bg-paper/[0.04] hover:text-paper",
        loginLink:
          "rounded-pill px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-paper/70 transition-colors hover:text-paper",
        mobileBtn:
          "flex h-10 w-10 items-center justify-center rounded-pill border border-paper/20 text-paper md:hidden",
        mobileMenu:
          "fixed inset-x-0 top-[80px] border-t border-paper/10 bg-ink-deep md:hidden",
        mobileLink:
          "flex items-center justify-between border-b border-paper/10 py-4 font-display text-lg font-medium text-paper",
        mobileMuted: "mb-2 text-sm text-paper/55",
      };

  // 透過時は border / bg を外し、トランジションで自然に切り替える。
  // T.header (ダーク solid 状態) との差分のみ上書きする。
  const headerClassName = isTransparent
    ? "fixed left-0 right-0 top-0 z-50 bg-transparent transition-[background-color,border-color,backdrop-filter] duration-500"
    : `${T.header} transition-[background-color,border-color,backdrop-filter] duration-500`;

  return (
    <header className={headerClassName}>
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
              <span className={T.logoText}>
                AILIER<span className="text-sand">.</span>
              </span>
              {/* 透過モード (home 最上部) では subtitle を隠してミニマルに */}
              {!isTransparent && (
                <span className={T.logoSubtitle}>
                  AIクリエイター × 企業のマッチング
                </span>
              )}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {showCreatorsLink && (
              <Link
                href="/creators"
                className={T.navLink}
              >
                {creatorsLinkLabel}
              </Link>
            )}
            {showCreatorsLink && (
              <Link
                href="/portfolios"
                className={T.navLink}
              >
                ポートフォリオ
              </Link>
            )}
            {showJobsLink && (
              <Link
                href="/jobs"
                className={T.navLink}
              >
                案件を探す
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                className={T.navLink}
              >
                マイページ
              </Link>
            )}
            <Link
              href="/how-it-works"
              className={T.navLink}
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
                  className={
                    isLight
                      ? "btn-primary mr-1 text-xs"
                      : "btn-axis mr-1"
                  }
                >
                  {isLight ? "案件を発注する" : "Post a job"}
                </Link>
              )}
              {/* Message icon */}
              <Link
                href="/dashboard/messages"
                className={T.iconBtn}
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
                  className={T.iconBtn}
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
                    <div className={T.dropdown}>
                      <div className={T.dropdownHeader}>
                        <p className={T.dropdownHeaderText}>通知</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {visibleNotifications.length === 0 ? (
                          <div className={T.notifEmpty}>
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
                              className={`${T.notifItem} ${
                                !n.is_read ? "bg-neon-pink/10" : ""
                              }`}
                            >
                              <p
                                className={
                                  !n.is_read ? T.notifTitleUnread : T.notifTitle
                                }
                              >
                                {n.title}
                              </p>
                              {n.body && (
                                <p className={T.notifBody}>
                                  {n.body}
                                </p>
                              )}
                              <p className={T.notifMeta}>
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
                  className={T.userMenuBtn}
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
                    <div className={T.dropdownSm}>
                      <div className={T.dropdownHeader}>
                        <p className={T.dropdownSubText}>
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className={T.menuItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ダッシュボード
                      </Link>
                      <Link
                        href="/dashboard/likes"
                        className={`${T.menuItem} inline-flex items-center gap-2`}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart size={16} strokeWidth={1.8} fill="currentColor" className="text-neon-pink" aria-hidden />
                        いいねした動画
                      </Link>
                      <Link
                        href="/settings"
                        className={T.menuItem}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        設定
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={T.logoutBtn}
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
                className={T.loginLink}
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className={isLight ? "btn-primary text-xs" : "btn-axis"}
              >
                {isLight ? "無料ではじめる" : "Get started"}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className={T.mobileBtn}
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
        <div className={T.mobileMenu}>
          <div className="space-y-0 px-6 py-6">
            {showCreatorsLink && (
              <Link
                href="/creators"
                className={T.mobileLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {creatorsLinkLabel}
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            {showCreatorsLink && (
              <Link
                href="/portfolios"
                className={T.mobileLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                ポートフォリオ
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            {showJobsLink && (
              <Link
                href="/jobs"
                className={T.mobileLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                案件を探す
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            {showPostJobCta && (
              <Link
                href="/dashboard/jobs/new"
                className={`${T.mobileLink} text-sand`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {isLight ? "案件を発注する" : "Post a job"}
                <span aria-hidden>→</span>
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                className={T.mobileLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                マイページ
                <span className="text-neon-pink">→</span>
              </Link>
            )}
            <Link
              href="/how-it-works"
              className={T.mobileLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              使い方
              <span className="text-neon-pink">→</span>
            </Link>
            <div className="mt-6 flex flex-col gap-3 pt-2">
              {user ? (
                <>
                  <div className={T.mobileMuted}>
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
                    className={isLight ? "btn-primary justify-center" : "btn-axis justify-center"}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {isLight ? "無料ではじめる" : "Get started"}
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
