import Link from "next/link";

/**
 * 2026-06-17: サイト全体を白基調に統一したのに合わせ、Footer を Axis Ov Films
 * 系の単一 light テーマに統合 (旧 dark / 旧 dashboard light の二系統を撤去)。
 * - bg-paper (白) + 巨大 AILIER. ロゴ + "(Menu) / (Creator) / (Support) /
 *   (Our social)" の 4 カラム mono ラベル構造はそのまま継承。
 */
export function Footer() {
  const T = {
    footer: "relative mt-10 bg-paper text-ink border-t border-ink/10",
    logoText:
      "font-display text-[clamp(2.5rem,7vw,5rem)] font-medium leading-none tracking-tight text-ink",
    sectionLabel:
      "font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-ink/45",
    link:
      "font-display text-sm font-medium text-ink/80 transition-colors hover:text-sand",
    muted: "text-[11px] text-ink/55",
    copyLink:
      "underline-offset-2 transition-colors hover:text-sand hover:underline",
    divider: "border-t border-ink/10",
    crafted: "font-mono text-[10px] uppercase tracking-[0.22em] text-ink/40",
  };

  return (
    <footer className={T.footer}>
      <div className={`mx-auto max-w-wide px-gutter py-section-y-sm lg:py-20`}>
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
              <p>AIクリエイター × 企業のマッチングプラットフォーム</p>
              <p className="mt-3">2026 Comhuman-Quality Co., Ltd.</p>
            </div>
          </div>

          {/* 右: メニュー & ソーシャル */}
          {/* 2026-06-19 Section 6-2: 全リンクに日本語小ラベルを併記。
              英字を主役 (font-display) + 直下に mono 小フォント JP。 */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <FooterColumn label="(Menu)" sublabel="メニュー" labelCls={T.sectionLabel}>
              <FooterLink href="/creators" cls={T.link} sub="クリエイター">Creators</FooterLink>
              <FooterLink href="/portfolios" cls={T.link} sub="制作実績">Works</FooterLink>
              <FooterLink href="/how-it-works" cls={T.link} sub="サービス内容">Service</FooterLink>
              <FooterLink href="/pricing" cls={T.link} sub="料金プラン">Pricing</FooterLink>
              <FooterLink href="/for-business" cls={T.link} sub="企業のご担当者へ">For Business</FooterLink>
            </FooterColumn>

            <FooterColumn label="(Creator)" sublabel="クリエイターの方へ" labelCls={T.sectionLabel}>
              <FooterLink href="/register" cls={T.link} sub="登録する">Join</FooterLink>
              <FooterLink href="/creator-guide" cls={T.link} sub="ガイドライン">Guidelines</FooterLink>
            </FooterColumn>

            <FooterColumn label="(Support)" sublabel="サポート" labelCls={T.sectionLabel}>
              <FooterLink href="/help" cls={T.link} sub="ヘルプ">Help</FooterLink>
              <FooterLink href="/terms" cls={T.link} sub="利用規約">Terms</FooterLink>
              <FooterLink href="/privacy" cls={T.link} sub="プライバシー">Privacy</FooterLink>
              <FooterLink href="/company" cls={T.link} sub="運営会社">Company</FooterLink>
            </FooterColumn>

            <FooterColumn label="(Our social)" sublabel="公式SNS" labelCls={T.sectionLabel}>
              <FooterExternal href="https://www.instagram.com/" cls={T.link} sub="インスタグラム">
                Instagram
              </FooterExternal>
              <FooterExternal href="https://x.com/" cls={T.link} sub="X (旧Twitter)">
                X
              </FooterExternal>
              <FooterExternal href="https://youtube.com/" cls={T.link} sub="ユーチューブ">
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
          <p className={T.crafted}>Crafted in Tokyo</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  sublabel,
  labelCls,
  children,
}: {
  label: string;
  sublabel?: string;
  labelCls: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      {sublabel && (
        <p className="mt-1 font-sans text-[10px] text-ink/55">{sublabel}</p>
      )}
      <ul className="mt-4 space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  cls,
  sub,
  children,
}: {
  href: string;
  cls: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link href={href} className={`group/fl block ${cls}`}>
        <span className="block">{children}</span>
        {sub && (
          <span className="mt-0.5 block font-sans text-[10px] text-ink/45 transition-colors group-hover/fl:text-ink/70">
            {sub}
          </span>
        )}
      </Link>
    </li>
  );
}

function FooterExternal({
  href,
  cls,
  sub,
  children,
}: {
  href: string;
  cls: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group/fl block ${cls}`}
      >
        <span className="block">{children}</span>
        {sub && (
          <span className="mt-0.5 block font-sans text-[10px] text-ink/45 transition-colors group-hover/fl:text-ink/70">
            {sub}
          </span>
        )}
      </a>
    </li>
  );
}
