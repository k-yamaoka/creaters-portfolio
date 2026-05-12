import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/15 bg-paper">
      <div className="mx-auto max-w-container px-6 py-20 lg:px-[6.25rem]">
        {/* Editorial mast */}
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-medium leading-none tracking-tightest-x text-ink">
                Creators
              </span>
              <span className="font-display text-3xl font-medium leading-none tracking-tightest-x text-primary-500">
                .
              </span>
              <span className="font-display text-xs font-medium uppercase tracking-[0.3em] text-ink-muted">
                hub
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-[1.9] text-ink-muted">
              映像クリエイターとビジネスを直接つなぐマッチングプラットフォーム。
              <br />
              スカウトと公募、ふたつの方法で。
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                Service
              </h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/creators" className="text-sm text-ink transition-colors hover:text-primary-500">
                    クリエイター
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-sm text-ink transition-colors hover:text-primary-500">
                    使い方
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-ink transition-colors hover:text-primary-500">
                    料金
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                Creator
              </h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/register" className="text-sm text-ink transition-colors hover:text-primary-500">
                    クリエイター登録
                  </Link>
                </li>
                <li>
                  <Link href="/creator-guide" className="text-sm text-ink transition-colors hover:text-primary-500">
                    ガイドライン
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                Business
              </h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/for-business" className="text-sm text-ink transition-colors hover:text-primary-500">
                    法人プラン
                  </Link>
                </li>
                <li>
                  <Link href="/case-studies" className="text-sm text-ink transition-colors hover:text-primary-500">
                    導入事例
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                Support
              </h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/help" className="text-sm text-ink transition-colors hover:text-primary-500">
                    ヘルプ
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-ink transition-colors hover:text-primary-500">
                    利用規約
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-ink transition-colors hover:text-primary-500">
                    プライバシー
                  </Link>
                </li>
                <li>
                  <Link href="/company" className="text-sm text-ink transition-colors hover:text-primary-500">
                    運営会社
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-ink/15 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs tracking-wider text-ink-muted">
            &copy; 2026 CreatorsHub by{" "}
            <a
              href="https://comhuman-quality.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:text-ink hover:underline"
            >
              Comhuman-Quality Co., Ltd.
            </a>{" "}
            — All rights reserved.
          </p>
          <p className="font-display text-xs uppercase tracking-[0.3em] text-ink-soft">
            Made for creators, in Tokyo.
          </p>
        </div>
      </div>
    </footer>
  );
}
