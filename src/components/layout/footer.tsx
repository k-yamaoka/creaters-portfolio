import Link from "next/link";
import { NeonStar } from "@/components/ui/illustrations-retrowave";

export function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden bg-neon-midnight-deep text-white">
      {/* Glow accents */}
      <div className="pointer-events-none absolute -left-24 top-0 h-[280px] w-[280px] rounded-full bg-neon-pink opacity-20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-[260px] w-[260px] rounded-full bg-neon-cyan opacity-15 blur-[100px]" />

      {/* Neon top rule */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-pink/60 to-transparent" />

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
                <span className="text-lg font-black tracking-tight text-white">
                  AI<span className="bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent">LIER</span>
                </span>
                <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.22em] text-white/40">
                  AI creators × business
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-xs leading-[1.85] text-white/60">
              AIクリエイターと企業を、まっすぐつなぐ。
              <br />
              Sora・Veo・Runway を使いこなす専門家に、SNS広告動画・プロダクト紹介・コーポレートVPを依頼できる専門プラットフォーム。
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <FooterColumn title="Service">
              <FooterLink href="/creators">AIクリエイター一覧</FooterLink>
              <FooterLink href="/portfolios">ポートフォリオ一覧</FooterLink>
              <FooterLink href="/how-it-works">使い方</FooterLink>
              <FooterLink href="/pricing">料金</FooterLink>
            </FooterColumn>
            <FooterColumn title="Creator">
              <FooterLink href="/register">クリエイター登録</FooterLink>
              <FooterLink href="/creator-guide">ガイドライン</FooterLink>
            </FooterColumn>
            <FooterColumn title="Business">
              <FooterLink href="/for-business">法人プラン</FooterLink>
              <FooterLink href="/case-studies">導入事例</FooterLink>
            </FooterColumn>
            <FooterColumn title="Support">
              <FooterLink href="/help">ヘルプ</FooterLink>
              <FooterLink href="/terms">利用規約</FooterLink>
              <FooterLink href="/privacy">プライバシー</FooterLink>
              <FooterLink href="/company">運営会社</FooterLink>
            </FooterColumn>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
          <p className="text-[11px] text-white/50">
            &copy; 2026 AILIER by{" "}
            <a
              href="https://comhuman-quality.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-2 transition-colors hover:text-neon-pink hover:underline"
            >
              Comhuman-Quality Co., Ltd.
            </a>
          </p>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/40">
            <span aria-hidden className="text-neon-cyan drop-shadow-[0_0_6px_rgba(77,213,247,0.6)]">
              ✦
            </span>
            Powered by AI, crafted in Tokyo.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-neon-cyan">
        <span className="h-1.5 w-1.5 rounded-full bg-neon-pink shadow-[0_0_6px_rgba(255,77,157,0.7)]" />
        {title}
      </h3>
      <ul className="mt-2.5 space-y-1.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-white/70 transition-colors hover:text-neon-pink"
      >
        {children}
      </Link>
    </li>
  );
}
