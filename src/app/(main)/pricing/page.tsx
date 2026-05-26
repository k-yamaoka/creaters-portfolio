import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "料金体系",
  description:
    "AILIERの料金体系。AI動画・静止画制作の標準料金と、企業無料・クリエイター15%のシンプルな手数料設計をご案内します。",
};

export const revalidate = 3600;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          AI動画・静止画制作の標準料金
        </h1>
        <p className="mt-4 text-base text-[#828282]">
          登録無料。AILIERはシンプルで分かりやすい料金設計です
        </p>
      </div>

      {/* Plans */}
      <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
        {/* Client */}
        <div className="rounded-[20px] border-2 border-neon-purple/20 bg-white p-8 sm:p-10">
          <p className="text-sm font-bold text-neon-purple-deep">企業・クライアント</p>
          <p className="mt-4 text-4xl font-bold text-[#222]">
            無料
          </p>
          <p className="mt-2 text-sm text-[#828282]">
            登録・検索・依頼すべて無料
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "アカウント登録・利用料なし",
              "AIクリエイター検索・閲覧無制限",
              "メッセージ機能無料",
              "AI動画案件の掲載無料",
              "エスクロー決済で安心取引",
              "追加の月額費用なし",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-[#4F4F4F]">
                <svg className="h-4 w-4 shrink-0 text-neon-pink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
          <p className="text-sm font-bold text-[#222]">AIクリエイター</p>
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
            AIクリエイターとして登録
          </Link>
        </div>
      </div>

      {/* Price examples */}
      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-xl font-bold text-[#222]">
          AI動画・静止画制作の費用目安
        </h2>
        <div className="mt-8 space-y-3">
          {[
            { genre: "SNSショートAI動画(縦型1本)", price: "¥10,000〜¥25,000" },
            { genre: "SNS広告用 静止画バナー(5枚セット)", price: "¥15,000〜¥40,000" },
            { genre: "YouTube AI動画編集(10分)", price: "¥25,000〜¥50,000" },
            { genre: "商品・サービス紹介AI動画", price: "¥80,000〜¥250,000" },
            { genre: "Midjourney 商品ビジュアル(10枚)", price: "¥30,000〜¥80,000" },
            { genre: "企業紹介・採用AI動画", price: "¥200,000〜¥450,000" },
            { genre: "AI絵コンテ / CM案複数パターン", price: "¥100,000〜¥600,000" },
            { genre: "Sora / Veo 活用ハイエンドAI映像", price: "¥300,000〜¥1,000,000" },
          ].map((item) => (
            <div
              key={item.genre}
              className="flex items-center justify-between rounded-xl bg-white p-5 shadow-card"
            >
              <span className="text-sm font-medium text-[#4F4F4F]">
                {item.genre}
              </span>
              <span className="text-sm font-bold text-neon-purple-deep">
                {item.price}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[#BDBDBD]">
          ※ 上記は参考価格です。実際の金額はAIクリエイターの料金プランをご確認ください。
        </p>
      </div>
    </div>
  );
}
