import Link from "next/link";

/**
 * 2026-06-17: サイト全体を白基調に統一したのに合わせ、Footer を Axis Ov Films
 * 系の単一 light テーマに統合 (旧 dark / 旧 dashboard light の二系統を撤去)。
 * - bg-paper (白) + 巨大 AILIER. ロゴ + "(Menu) / (Creator) / (Support) /
 *   (Our social)" の 4 カラム mono ラベル構造はそのまま継承。
 */
export function Footer() {
  // 2026-06-22: 余白とロゴサイズを引き締めて 5 カラムグリッドに整列。
  // - 旧 py-20 / mt-32 / clamp(2.5rem,7vw,5rem) などの巨大なサイズを半減。
  // - 左ロゴ + 4 リンクカラム = 計 5 列の grid-cols-5 で全体高さを抑制。
  const T = {
    footer: "relative mt-12 bg-paper text-ink border-t border-ink/10",
    logoText:
      "font-display text-4xl font-medium leading-none tracking-tight text-ink",
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
      <div className="mx-auto max-w-wide px-gutter py-10 lg:py-12">
        {/* ロゴ + 4 リンクカラム を 1 行 5 列 (lg) に統合 */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-10">
          {/* 左: ブランドロゴ (テキスト 4xl) */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="inline-block">
              <span className={T.logoText}>
                AILIER<span className="text-sand">.</span>
              </span>
            </Link>
            <div className={`${T.muted} mt-4 space-y-0.5`}>
              <p>AIクリエイター × 企業のマッチング</p>
              <p>Comhuman-Quality Co., Ltd.</p>
            </div>
          </div>

          {/* 4 リンクカラム (lg は 4 列、ロゴと合わせて grid-cols-5) */}
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

        {/* Bottom bar — 余白も縮める */}
        <div
          className={`mt-10 flex flex-col items-start justify-between gap-2 ${T.divider} pt-5 sm:flex-row sm:items-center`}
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
