"use client";

import { Globe, Youtube, Instagram } from "lucide-react";

/**
 * クリエイター名の直下に並べる SNS / 外部リンクのアイコン行。
 *
 * - lucide が提供しないアイコン (X / TikTok) は SVG をインラインで用意
 * - 未入力 (null/undefined/空文字) のリンクは表示しない
 * - 円形ボタン (h-9 w-9) + ホバーで accent カラーに着色
 * - aria-label 必須 (アイコン単独で意味を伝えないため、視覚に頼らない navigation)
 */

export type SocialLinks = Record<string, string | null | undefined>;

const SOCIALS: Array<{
  key: string;
  label: string;
  hover: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }>;
}> = [
  { key: "website", label: "公式サイト", hover: "hover:text-gray-900 hover:bg-gray-100", icon: Globe },
  { key: "youtube", label: "YouTube", hover: "hover:text-red-600 hover:bg-red-50", icon: Youtube },
  { key: "x", label: "X (旧Twitter)", hover: "hover:text-gray-900 hover:bg-gray-100", icon: XIcon },
  { key: "instagram", label: "Instagram", hover: "hover:text-pink-600 hover:bg-pink-50", icon: Instagram },
  { key: "tiktok", label: "TikTok", hover: "hover:text-gray-900 hover:bg-gray-100", icon: TikTokIcon },
];

type Props = {
  links: SocialLinks;
};

export function SocialLinkRow({ links }: Props) {
  const entries = SOCIALS.filter((s) => !!links[s.key]).map((s) => ({
    ...s,
    url: links[s.key] as string,
  }));
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.map(({ key, label, url, hover, icon: Icon }) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} を開く (新しいタブ)`}
          title={label}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors ${hover}`}
        >
          <Icon size={16} strokeWidth={1.8} aria-hidden />
        </a>
      ))}
    </div>
  );
}

/* ====== カスタム SVG (lucide に無いもの) ====== */

function XIcon({
  size = 16,
  className,
  "aria-hidden": ariaHidden,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  // 公式 X ロゴ (黒)
  return (
    <svg
      aria-hidden={ariaHidden}
      width={size}
      height={size}
      viewBox="0 0 1200 1227"
      className={className}
      fill="currentColor"
    >
      <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
    </svg>
  );
}

function TikTokIcon({
  size = 16,
  className,
  "aria-hidden": ariaHidden,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      aria-hidden={ariaHidden}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.91a8.16 8.16 0 0 0 4.74 1.52V7a4.85 4.85 0 0 1-1.81-.31z" />
    </svg>
  );
}
