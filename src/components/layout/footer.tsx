import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 bg-[#F8F8F8]">
      {/* Divider */}
      <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
        <div className="h-px bg-[#F2F2F2]" />
      </div>

      <div className="mx-auto max-w-container px-6 pb-16 pt-10 lg:px-[6.25rem]">
        {/* Navigation Columns */}
        <div className="grid grid-cols-2 gap-x-9 gap-y-10 md:grid-cols-4">
          <div>
            <h3 className="text-base font-medium text-[#212121]">サービス</h3>
            <ul className="mt-8 space-y-3.5">
              <li>
                <Link href="/creators" className="text-[13px] text-[#212121] hover:underline">
                  クリエイターを探す
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-[13px] text-[#212121] hover:underline">
                  使い方
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[13px] text-[#212121] hover:underline">
                  料金体系
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-medium text-[#212121]">クリエイター向け</h3>
            <ul className="mt-8 space-y-3.5">
              <li>
                <Link href="/register/creator" className="text-[13px] text-[#212121] hover:underline">
                  クリエイター登録
                </Link>
              </li>
              <li>
                <Link href="/creator-guide" className="text-[13px] text-[#212121] hover:underline">
                  ガイドライン
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-medium text-[#212121]">企業・法人向け</h3>
            <ul className="mt-8 space-y-3.5">
              <li>
                <Link href="/for-business" className="text-[13px] text-[#212121] hover:underline">
                  法人プラン
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="text-[13px] text-[#212121] hover:underline">
                  導入事例
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-medium text-[#212121]">サポート</h3>
            <ul className="mt-8 space-y-3.5">
              <li>
                <Link href="/help" className="text-[13px] text-[#212121] hover:underline">
                  ヘルプセンター
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[13px] text-[#212121] hover:underline">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[13px] text-[#212121] hover:underline">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/company" className="text-[13px] text-[#212121] hover:underline">
                  運営会社
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-sm font-black text-white">
              C
            </div>
            <span className="text-lg font-bold text-[#222]">CreatorsHub</span>
          </Link>
          <p className="text-[13px] text-[#212121]">
            &copy; 2025 CreatorsHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
