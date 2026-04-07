import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "料金体系",
  description:
    "CreatorsHubの料金体系。企業は完全無料、クリエイターは取引成立時のみ15%の手数料。",
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          料金体系
        </h1>
        <p className="mt-4 text-base text-[#828282]">
          登録無料。シンプルで分かりやすい料金設計です
        </p>
      </div>

      {/* Plans */}
      <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
        {/* Client */}
        <div className="rounded-[20px] border-2 border-primary-100 bg-white p-8 sm:p-10">
          <p className="text-sm font-bold text-primary-500">企業・クライアント</p>
          <p className="mt-4 text-4xl font-bold text-[#222]">
            無料
          </p>
          <p className="mt-2 text-sm text-[#828282]">
            登録・検索・依頼すべて無料
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "アカウント登録・利用料なし",
              "クリエイター検索・閲覧無制限",
              "メッセージ機能無料",
              "案件掲載無料",
              "エスクロー決済で安心取引",
              "追加の月額費用なし",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-[#4F4F4F]">
                <svg className="h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
          <Link href="/register" className="btn-primary mt-8 inline-block w-full text-center text-sm">
            無料で始める
          </Link>
        </div>

        {/* Creator */}
        <div className="rounded-[20px] border-2 border-[#E0E0E0] bg-white p-8 sm:p-10">
          <p className="text-sm font-bold text-[#222]">クリエイター</p>
          <div className="mt-4 flex items-end gap-1">
            <span className="text-4xl font-bold text-[#222]">15</span>
            <span className="mb-1 text-lg font-bold text-[#828282]">%</span>
          </div>
          <p className="mt-2 text-sm text-[#828282]">
            取引成立時のみ手数料が発生
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "アカウント登録・ポートフォリオ掲載無料",
              "料金プラン自由設定",
              "案件への応募無料",
              "メッセージ機能無料",
              "取引成立時に15%のシステム手数料",
              "Stripe経由で確実に報酬受取",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-[#4F4F4F]">
                <svg className="h-4 w-4 shrink-0 text-[#222]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
          <Link href="/register" className="mt-8 inline-flex w-full items-center justify-center rounded-pill border-2 border-[#222] bg-white px-8 py-3 text-sm font-bold text-[#222] transition-all hover:bg-[#222] hover:text-white">
            クリエイターとして登録
          </Link>
        </div>
      </div>

      {/* Price examples */}
      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-xl font-bold text-[#222]">
          制作費用の目安
        </h2>
        <div className="mt-8 space-y-3">
          {[
            { genre: "SNS動画（縦型1本）", price: "¥15,000〜¥30,000" },
            { genre: "YouTube動画編集（10分）", price: "¥30,000〜¥60,000" },
            { genre: "商品・製品紹介動画", price: "¥100,000〜¥300,000" },
            { genre: "企業紹介・会社紹介動画", price: "¥300,000〜¥500,000" },
            { genre: "テレビCM・Web CM", price: "¥150,000〜¥800,000" },
            { genre: "MV（ミュージックビデオ）", price: "¥200,000〜¥1,000,000" },
          ].map((item) => (
            <div
              key={item.genre}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-card"
            >
              <span className="text-sm font-medium text-[#4F4F4F]">
                {item.genre}
              </span>
              <span className="text-sm font-bold text-primary-500">
                {item.price}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[#BDBDBD]">
          ※ 上記は参考価格です。実際の金額はクリエイターの料金プランをご確認ください。
        </p>
      </div>
    </div>
  );
}
