import type { ReactNode } from "react";
import Link from "next/link";

/**
 * メッセージなどの自由入力テキスト中の URL を React 要素にしてリンク化する。
 *
 * - http(s)://... は外部リンクとして target="_blank" rel="noopener noreferrer noopener"
 * - 先頭が / で始まるパス (例: /dashboard/orders/xxx) は Next.js の <Link> で
 *   クライアント遷移する。本サイト内で sendSystemMessage が埋め込む取引リンク用。
 * - それ以外はそのまま文字として残す
 *
 * dangerouslySetInnerHTML を一切使わないので XSS 安全。
 *
 * ※ 正規表現はあえて単純に作る:
 *   - 末尾の句読点 ( . , ! ? 、。!? ) は URL に含めない
 *   - 全角スペースや空白で区切る
 */
const URL_RE =
  /(https?:\/\/[^\s<>()「」『』、。]+|\/(?:dashboard|jobs|orders|creators|portfolios|messages)\/[^\s<>()「」『』、。]+)/g;

// URL の末尾でよく付いてしまう句読点を剥がす
function trimTrailingPunct(url: string): { url: string; trailing: string } {
  const m = url.match(/[)\].,!?:;、。!?]+$/);
  if (!m) return { url, trailing: "" };
  return {
    url: url.slice(0, url.length - m[0].length),
    trailing: m[0],
  };
}

export function linkifyText(input: string): ReactNode[] {
  if (!input) return [];
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // ループごとに lastIndex が進む必要があるため exec を使う
  URL_RE.lastIndex = 0;
  let keyCounter = 0;
  while ((match = URL_RE.exec(input)) !== null) {
    const raw = match[0];
    const start = match.index;
    if (start > lastIndex) {
      out.push(input.slice(lastIndex, start));
    }

    const { url, trailing } = trimTrailingPunct(raw);
    const isInternal = url.startsWith("/");
    const key = `lnk-${keyCounter++}`;

    if (isInternal) {
      out.push(
        <Link
          key={key}
          href={url}
          className="text-primary-600 underline underline-offset-2 hover:text-primary-700"
        >
          {url}
        </Link>
      );
    } else {
      out.push(
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 underline underline-offset-2 hover:text-primary-700 break-all"
        >
          {url}
        </a>
      );
    }

    if (trailing) out.push(trailing);
    lastIndex = start + raw.length;
  }
  if (lastIndex < input.length) {
    out.push(input.slice(lastIndex));
  }
  return out;
}
