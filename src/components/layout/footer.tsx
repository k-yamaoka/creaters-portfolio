"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 2026-06-16 Step 4: Footer を Axis Ov Films 系の引き算ハイエンドに刷新。
 * - ダーク (LP / 公開ページ) は bg-ink-deep、巨大 AILIER. ロゴ、罫線分割の
 *   "(Menu)" "(Our social)" カラム構造
 * - ライト (dashboard) は従来の薄グレー基調を維持 (構造は同形に揃える)
 */
export function Footer() {
  const pathname = usePathname() ?? "";
  const isLight = pathname.startsWith("/dashboard");

  const T = isLight
    ? {
        footer: "relative mt-10 bg-[#F8F9FA] text-gray-800 border-t border-gray-200",
        logoText: "font-display text-[clamp(2.5rem,7vw,5rem)] font-medium leading-none tracking-tight text-gray-900",
        sectionLabel: "font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-400",
        link: "font-display text-sm font-medium text-gray-700 transition-colors hover:text-neon-pink",
        muted: "text-[11px] text-gray-500",
        copyLink: "underline-offset-2 transition-colors hover:text-neon-pink hover:underline",
        divider: "border-t border-gray-200",
      }
    : {
        footer: "relative mt-10 bg-ink-deep text-paper",
        logoText: "font-display text-[clamp(2.5rem,7vw,5rem)] font-medium leading-none tracking-tight text-paper",
        sectionLabel: "font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper/45",
        link: "font-display text-sm font-medium text-paper/85 transition-colors hover:text-sand",
        muted: "text-[11px] text-paper/50",
        copyLink: "underline-offset-2 transition-colors hover:text-sand hover:underline",
        divider: "border-t border-paper/10",
      };

  return (
    <footer className={T.footer}>
      <div className={`mx-auto max-w-wide px-gutter py-section-y-sm lg:py-20 ${T.divider}`}>
        {/* 巨大ロゴ + 5 カラム */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_2.4fr] lg:gap-16">
          {/* 左: ブランドロゴ — Axis "axis." 直系の Fraunces 巨大表記 */}
          <div className="flex flex-col justify-between gap-12">
            <Link href="/" className="inline-block">
              <span className={T.logoText}>
                AILIER<span className="text-sand">.</span>
              </span>
            </Link>
            <div className={T.muted}>
              <p>〒100-0001</p>
              <p>AI creators × business platform</p>
              <p className="mt-3">2026 Comhuman-Quality Co., Ltd.</p>
            </div>
          </div>

          {/* 右: メニュー & ソーシャル */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <FooterColumn label="(Menu)" labelCls={T.sectionLabel}>
              <FooterLink href="/creators" cls={T.link}>Creators</FooterLink>
              <FooterLink href="/portfolios" cls={T.link}>Works</FooterLink>
              <FooterLink href="/how-it-works" cls={T.link}>Service</FooterLink>
              <FooterLink href="/pricing" cls={T.link}>Pricing</FooterLink>
              <FooterLink href="/for-business" cls={T.link}>For Business</FooterLink>
            </FooterColumn>

            <FooterColumn label="(Creator)" labelCls={T.sectionLabel}>
              <FooterLink href="/register" cls={T.link}>Join</FooterLink>
              <FooterLink href="/creator-guide" cls={T.link}>Guidelines</FooterLink>
            </FooterColumn>

            <FooterColumn label="(Support)" labelCls={T.sectionLabel}>
              <FooterLink href="/help" cls={T.link}>Help</FooterLink>
              <FooterLink href="/terms" cls={T.link}>Terms</FooterLink>
              <FooterLink href="/privacy" cls={T.link}>Privacy</FooterLink>
              <FooterLink href="/company" cls={T.link}>Company</FooterLink>
            </FooterColumn>

            <FooterColumn label="(Our social)" labelCls={T.sectionLabel}>
              <FooterExternal href="https://www.instagram.com/" cls={T.link}>
                Instagram
              </FooterExternal>
              <FooterExternal href="https://x.com/" cls={T.link}>
                X
              </FooterExternal>
              <FooterExternal href="https://youtube.com/" cls={T.link}>
                Youtube
              </FooterExternal>
            </FooterColumn>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`mt-section-y-sm flex flex-col items-start justify-between gap-3 ${T.divider} pt-8 sm:flex-row sm:items-center`}
        >
          <p className={T.muted}>
            &copy; 2026 AILIER by{" "}
            <a
              href="https://comhuman-quality.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={T.copyLink}
            >
              Comhuman-Quality Co., Ltd.
            </a>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/35">
            Crafted in Tokyo
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  labelCls,
  children,
}: {
  label: string;
  labelCls: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  cls,
  children,
}: {
  href: string;
  cls: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link href={href} className={cls}>
        {children}
      </Link>
    </li>
  );
}

function FooterExternal({
  href,
  cls,
  children,
}: {
  href: string;
  cls: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    </li>
  );
}
