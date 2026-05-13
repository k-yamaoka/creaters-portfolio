import Link from "next/link";
import {
  FlowerMark,
  MiniFlower,
  Leaf,
  WavyLine,
} from "@/components/ui/illustrations";

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-paper-deep">
      {/* うねり線ディバイダー (上端) */}
      <div className="absolute inset-x-0 top-0 h-3 text-primary-500/40">
        <div className="rule-wavy" />
      </div>

      {/* 装飾イラスト */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 top-16 text-leaf opacity-70 animate-sway"
      >
        <Leaf size={90} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-6 top-12 text-accent-400 opacity-80 animate-float"
      >
        <FlowerMark size={64} />
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-32 bottom-32 text-primary-300 opacity-70"
      >
        <MiniFlower size={36} />
      </span>

      <div className="relative mx-auto max-w-container px-6 py-20 lg:px-10">
        {/* Brand mast */}
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="block text-primary-500">
                <FlowerMark size={44} />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-2xl font-black tracking-tight text-ink">
                  Creators<span className="text-primary-500">Hub</span>
                </span>
                <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-soft">
                  creators × business
                </span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-[1.9] text-ink-muted">
              映像クリエイターとビジネスを、まっすぐつなぐ。
              <br />
              スカウトと公募、ふたつの方法で。
            </p>
            <div className="mt-6 text-primary-500/70">
              <WavyLine size={180} />
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <FooterColumn title="Service">
              <FooterLink href="/creators">クリエイター</FooterLink>
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
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-ink-muted">
            &copy; 2026 CreatorsHub by{" "}
            <a
              href="https://comhuman-quality.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline-offset-2 transition-colors hover:text-primary-600 hover:underline"
            >
              Comhuman-Quality Co., Ltd.
            </a>
          </p>
          <p className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft">
            <span aria-hidden className="text-accent-500">
              <MiniFlower size={16} />
            </span>
            Made with care, in Tokyo.
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
      <h3 className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary-600">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
        {title}
      </h3>
      <ul className="mt-5 space-y-3">{children}</ul>
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
        className="text-sm text-ink transition-colors hover:text-primary-600"
      >
        {children}
      </Link>
    </li>
  );
}
