"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NeonStar } from "@/components/ui/illustrations-retrowave";
import { MIcon } from "@/components/ui/m-icon";

export function Footer() {
  const pathname = usePathname() ?? "";
  // ダッシュボード配下のみライトフッター (薄グレー基調)。他は従来のネオン暗テーマ。
  const isLight = pathname.startsWith("/dashboard");

  const T = isLight
    ? {
        footer:
          "relative mt-10 overflow-hidden bg-[#F8F9FA] text-gray-800 border-t border-gray-200",
        topRule:
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-pink/40 to-transparent",
        logoText: "text-lg font-black tracking-tight text-gray-900",
        logoSubtitle:
          "mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-gray-400",
        bio: "mt-4 max-w-sm text-xs leading-[1.85] text-gray-500",
        divider:
          "mt-8 flex flex-col items-start justify-between gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:items-center",
        copy: "text-[11px] text-gray-500",
        copyLink:
          "font-medium underline-offset-2 transition-colors hover:text-neon-pink hover:underline",
        powered: "inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400",
        columnTitle:
          "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-neon-purple-deep",
        link: "text-sm text-gray-600 transition-colors hover:text-neon-pink",
      }
    : {
        footer:
          "relative mt-10 overflow-hidden bg-neon-midnight-deep text-white",
        topRule:
          "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-pink/60 to-transparent",
        logoText: "text-lg font-black tracking-tight text-white",
        logoSubtitle:
          "mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-white/40",
        bio: "mt-4 max-w-sm text-xs leading-[1.85] text-white/60",
        divider:
          "mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center",
        copy: "text-[11px] text-white/50",
        copyLink:
          "font-medium underline-offset-2 transition-colors hover:text-neon-pink hover:underline",
        powered:
          "inline-flex items-center gap-1.5 text-[11px] font-medium text-white/40",
        columnTitle:
          "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-neon-cyan",
        link: "text-sm text-white/70 transition-colors hover:text-neon-pink",
      };

  return (
    <footer className={T.footer}>
      {/* Glow accents — ライトでは控えめに */}
      {!isLight && (
        <>
          <div className="pointer-events-none absolute -left-24 top-0 h-[280px] w-[280px] rounded-full bg-neon-pink opacity-20 blur-[100px]" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-[260px] w-[260px] rounded-full bg-neon-cyan opacity-15 blur-[100px]" />
        </>
      )}

      {/* 上端のネオン区切り (ピンクのアクセントは両テーマで維持) */}
      <div className={T.topRule} />

      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-5 text-neon-pink animate-float drop-shadow-[0_0_10px_rgba(255,77,157,0.6)]"
      >
        <NeonStar size={28} />
      </span>

      <div className="relative mx-auto max-w-container px-6 py-10 lg:px-10 lg:py-12">
        {/* Brand mast */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="block text-neon-pink drop-shadow-[0_0_8px_rgba(255,77,157,0.6)]">
                <NeonStar size={26} />
              </span>
              <span className="flex flex-col leading-none">
                <span className={T.logoText}>
                  AI<span className="bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent">LIER</span>
                </span>
                <span className={T.logoSubtitle}>
                  AI creators × business
                </span>
              </span>
            </Link>
            <p className={T.bio}>
              AIクリエイターと企業を、まっすぐつなぐ。
              <br />
              Sora・Veo・Runway を使いこなす専門家に、SNS広告動画・プロダクト紹介・コーポレートVPを依頼できる専門プラットフォーム。
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <FooterColumn title="Service" titleCls={T.columnTitle}>
              <FooterLink href="/creators" cls={T.link}>AIクリエイター一覧</FooterLink>
              <FooterLink href="/portfolios" cls={T.link}>ポートフォリオ一覧</FooterLink>
              <FooterLink href="/how-it-works" cls={T.link}>使い方</FooterLink>
              <FooterLink href="/pricing" cls={T.link}>料金</FooterLink>
            </FooterColumn>
            <FooterColumn title="Creator" titleCls={T.columnTitle}>
              <FooterLink href="/register" cls={T.link}>クリエイター登録</FooterLink>
              <FooterLink href="/creator-guide" cls={T.link}>ガイドライン</FooterLink>
            </FooterColumn>
            <FooterColumn title="Business" titleCls={T.columnTitle}>
              <FooterLink href="/for-business" cls={T.link}>法人プラン</FooterLink>
              <FooterLink href="/case-studies" cls={T.link}>導入事例</FooterLink>
            </FooterColumn>
            <FooterColumn title="Support" titleCls={T.columnTitle}>
              <FooterLink href="/help" cls={T.link}>ヘルプ</FooterLink>
              <FooterLink href="/terms" cls={T.link}>利用規約</FooterLink>
              <FooterLink href="/privacy" cls={T.link}>プライバシー</FooterLink>
              <FooterLink href="/company" cls={T.link}>運営会社</FooterLink>
            </FooterColumn>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={T.divider}>
          <p className={T.copy}>
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
          <p className={T.powered}>
            <MIcon
              name="auto_awesome"
              fill
              size={14}
              className="text-neon-cyan drop-shadow-[0_0_6px_rgba(77,213,247,0.6)]"
            />
            Powered by AI, crafted in Tokyo.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  titleCls,
  children,
}: {
  title: string;
  titleCls: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className={titleCls}>
        <span className="h-1.5 w-1.5 rounded-full bg-neon-pink shadow-[0_0_6px_rgba(255,77,157,0.7)]" />
        {title}
      </h3>
      <ul className="mt-2.5 space-y-1.5">{children}</ul>
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
