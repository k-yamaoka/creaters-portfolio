import Link from "next/link";
import { MIcon } from "@/components/ui/m-icon";

type Props = {
  unreadMessages: number;
  unreadNotifications: number;
  activeOrders: number;
  // 取引で次の自分のアクション待ちが何件か (進行中のうち、自分のターン)
  awaitingMyAction: number;
};

/**
 * ダッシュボード最上部の「未読・要対応アラート」セクション。
 * 何も無ければ「すべて対応済み」の静的メッセージを出す。
 *
 * 設計方針:
 * - 4 つの指標 (未読メッセージ / 未読通知 / 進行中取引 / 自分待ち) を 1 行で並列表示
 * - 0 の指標は控えめなグレーカード、> 0 はネオンピンクで強調 + リンク
 * - 自分待ち件数があるときは赤の優先度マーカー
 */
export function DashboardAlertsBar({
  unreadMessages,
  unreadNotifications,
  activeOrders,
  awaitingMyAction,
}: Props) {
  const items: Array<{
    label: string;
    value: number;
    href: string;
    accentWhen: "any" | "myAction";
    icon: React.ReactNode;
  }> = [
    {
      label: "未読メッセージ",
      value: unreadMessages,
      href: "/dashboard/messages",
      accentWhen: "any",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      ),
    },
    {
      label: "未読通知",
      value: unreadNotifications,
      href: "/dashboard",
      accentWhen: "any",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
        />
      ),
    },
    {
      label: "進行中の取引",
      value: activeOrders,
      href: "/dashboard/orders",
      accentWhen: "any",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25"
        />
      ),
    },
    {
      label: "あなたの対応待ち",
      value: awaitingMyAction,
      href: "/dashboard/orders",
      accentWhen: "myAction",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      ),
    },
  ];

  const allClear = items.every((i) => i.value === 0);

  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-neon-pink" />
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
          要対応アラート
        </h2>
      </div>

      {allClear ? (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <MIcon name="check_circle" fill size={16} className="text-green-600" />
          現在、対応が必要なアラートはありません。
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {items.map((it) => {
            const isHot = it.value > 0;
            const isUrgent = isHot && it.accentWhen === "myAction";
            return (
              <Link
                key={it.label}
                href={it.href}
                className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${
                  isUrgent
                    ? "border-red-300 bg-red-50 hover:border-red-400 hover:shadow-card"
                    : isHot
                      ? "border-neon-pink/40 bg-neon-pink/[0.06] hover:border-neon-pink hover:shadow-card"
                      : "border-gray-200 bg-gray-50/60 opacity-70"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isUrgent
                      ? "bg-red-100 text-red-600"
                      : isHot
                        ? "bg-neon-pink/15 text-neon-pink"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <svg
                    aria-hidden
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.7}
                    stroke="currentColor"
                  >
                    {it.icon}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {it.label}
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-black leading-none ${
                      isUrgent
                        ? "text-red-600"
                        : isHot
                          ? "text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {it.value}
                    <span className="ml-0.5 text-xs font-bold text-gray-400">
                      件
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
