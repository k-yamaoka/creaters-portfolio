import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(price);
}

// Vercel (UTC) サーバーで日付フォーマットすると JST と最大 9 時間ズレる。
// 表示は常に Asia/Tokyo で行うため、明示的に timeZone を指定したフォーマッタを共通化する。
const JST_DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const JST_DATETIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatDateJP(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return JST_DATE_FORMATTER.format(d);
}

export function formatDateTimeJP(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const parts = JST_DATETIME_FORMATTER.formatToParts(d).reduce(
    (acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    },
    {} as Record<string, string>
  );
  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}
