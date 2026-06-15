import Link from "next/link";

export type ActivityItem = {
  id: string;
  kind: "message" | "application" | "order" | "notification";
  title: string;
  body?: string | null;
  href: string;
  createdAt: string;
  isUnread?: boolean;
};

/**
 * ダッシュボードに置く「最新のアクティビティ」枠。
 * - 直近の通知 / 未読メッセージ / 新着応募 / 取引更新 をマージして時系列で表示
 * - 親 (server) でクエリを束ね、ここはピュア表示に専念
 */
export function DashboardLatestActivity({
  items,
}: {
  items: ActivityItem[];
}) {
  return (
    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan/15 to-neon-purple/15 text-neon-cyan"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
          </span>
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
            最新のアクティビティ
          </h2>
        </div>
        <Link
          href="/dashboard/messages"
          className="text-xs font-bold text-neon-purple-deep transition-colors hover:text-neon-pink"
        >
          すべて →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          まだアクティビティはありません。
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((it) => (
            <li key={`${it.kind}-${it.id}`}>
              <Link
                href={it.href}
                className="flex items-start gap-3 py-2.5 transition-colors hover:bg-gray-50/60"
              >
                <ActivityIcon kind={it.kind} unread={it.isUnread} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      it.isUnread
                        ? "font-bold text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {it.title}
                  </p>
                  {it.body && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {it.body}
                    </p>
                  )}
                </div>
                <span className="shrink-0 self-center text-[10px] text-gray-400">
                  {formatRelative(it.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActivityIcon({
  kind,
  unread,
}: {
  kind: ActivityItem["kind"];
  unread?: boolean;
}) {
  const path =
    kind === "message"
      ? "M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.671 1.09-.085 2.17-.207 3.238-.364 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
      : kind === "application"
        ? "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6"
        : kind === "order"
          ? "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664"
          : "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0";
  return (
    <span
      className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        unread
          ? "bg-neon-pink/10 text-neon-pink"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      <svg
        aria-hidden
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
      {unread && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 inline-block h-2 w-2 rounded-full bg-red-500"
        />
      )}
    </span>
  );
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}日前`;
  const mo = Math.floor(day / 30);
  return `${mo}ヶ月前`;
}
