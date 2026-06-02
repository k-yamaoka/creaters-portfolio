/**
 * Server-side 入力検証ヘルパー
 *
 * クライアント側の HTML 属性 (maxLength / pattern / type=number 等) は UX 補助でしかなく、
 * 改ざんされた FormData がそのまま DB に届く可能性がある。
 * server actions / API ルートはこのモジュールの関数を通して値を正規化する。
 */

/**
 * 文字列を整数に変換。空文字や非数値、範囲外は null を返す。
 * 上限を必ず指定すること (DB 桁あふれと UX 上の不自然な金額を同時に防ぐ)。
 */
export function parseIntInRange(
  raw: FormDataEntryValue | null | undefined,
  opts: { min?: number; max: number }
): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  const min = opts.min ?? 0;
  if (n < min || n > opts.max) return null;
  return n;
}

/** 文字列がホワイトリスト enum に含まれるか。含まれなければ null */
export function parseEnum<T extends string>(
  raw: FormDataEntryValue | null | undefined,
  allowed: readonly T[]
): T | null {
  if (raw == null) return null;
  const s = String(raw);
  return (allowed as readonly string[]).includes(s) ? (s as T) : null;
}

/** 複数選択のホワイトリスト適用。許容値以外を sanitize */
export function parseEnumList<T extends string>(
  raws: FormDataEntryValue[],
  allowed: readonly T[]
): T[] {
  return raws
    .map((r) => String(r))
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
}

/** 文字列を maxLen で切り詰める。null/undefined は null */
export function parseText(
  raw: FormDataEntryValue | null | undefined,
  maxLen: number
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** YYYY-MM-DD 形式の日付として有効か。Date オブジェクトとして parse できなければ null */
export function parseDate(
  raw: FormDataEntryValue | null | undefined
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  // YYYY-MM-DD 形式のみ受け入れる
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

/**
 * 動画 URL ホワイトリスト。
 * クライアント側で打ち込まれた任意 URL を拒否し、許容ホスト + パスパターンのみ通す。
 */
// SNS 埋め込みは AILIER で廃止。動画は Supabase Storage の portfolio-videos
// バケットへの直接アップロード (mp4) のみ許可する。
const VIDEO_URL_PATTERNS: { platform: string; re: RegExp }[] = [
  { platform: "mp4", re: /^https?:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/portfolio-videos\// },
];

export function isAllowedVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some((p) => p.re.test(url));
}

// 既存データ互換のため SNS 系の enum 値も残置 (新規登録は mp4 のみ)
export const VIDEO_PLATFORMS = [
  "youtube",
  "youtube_short",
  "vimeo",
  "tiktok",
  "instagram",
  "mp4",
  "other",
] as const;
export type VideoPlatform = (typeof VIDEO_PLATFORMS)[number];

/** http/https の通常 URL として妥当か */
export function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 金額の上限値。
 * 単発予算は最大 9 桁 (1億未満)、単価は最大 6 桁 (100万未満)。
 */
export const LIMITS = {
  TITLE_LEN: 200,
  DESCRIPTION_LEN: 5000,
  BUDGET: 999_999_999,
  UNIT_PRICE: 999_999,
  FOOTAGE_MINUTES: 999,
  FINISH_DURATION: 9999,
  DELIVERY_DAYS: 999,
  REVISION_COUNT: 99,
  MONTHLY_COUNT: 999,
  COUNT: 999,
} as const;
