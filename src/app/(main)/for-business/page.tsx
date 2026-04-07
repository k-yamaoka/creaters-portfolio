import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "企業の方へ",
  description:
    "制作会社を通さず、実力あるフリーランスクリエイターに直接依頼。コスト削減とスピードアップを実現。",
};

export default function ForBusinessPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      {/* Hero */}
      <div className="text-center">
        <p className="text-sm font-bold tracking-widest text-primary-500">
          FOR BUSINESS
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          企業の映像制作を、
          <br className="hidden sm:block" />
          もっとシンプルに
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#828282]">
          制作会社を通さず、実力あるフリーランスクリエイターに直接依頼。
          <br className="hidden sm:block" />
          コスト削減とスピードアップを同時に実現します。
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-20 grid gap-8 md:grid-cols-3">
        {[
          {
            title: "コスト削減",
            desc: "制作会社の中間マージンをカット。同じ予算でより高品質な映像制作が可能です。一般的な制作会社と比較して30〜50%のコスト削減を実現。",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
              />
            ),
          },
          {
            title: "スピーディな発注",
            desc: "ポートフォリオを見て即日相談開始。検索から発注まで最短1日。急ぎのプロジェクトにも柔軟に対応できます。",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            ),
          },
          {
            title: "実力で選べる安心感",
            desc: "全クリエイターのポートフォリオ動画を事前に確認。過去の作品・評価・レビューで実力を可視化しています。",
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
              />
            ),
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[15px] bg-white p-8 shadow-card"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
              <svg
                className="h-7 w-7 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                {item.icon}
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-bold text-[#222]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#828282]">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Use cases */}
      <div className="mt-24 text-center">
        <h2 className="text-2xl font-bold text-[#222]">こんな企業に最適です</h2>
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
          {[
            "採用動画・企業紹介映像を作りたい",
            "YouTube・SNSの動画マーケティングを始めたい",
            "商品・サービスのプロモーション動画が必要",
            "社内研修・マニュアル動画を効率的に制作したい",
            "テレビCM・Web CMの制作パートナーを探している",
            "イベント・セミナーの映像記録を残したい",
          ].map((text) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-card"
            >
              <svg
                className="h-5 w-5 shrink-0 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              <p className="text-sm font-medium text-[#222]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-24 text-center">
        <h2 className="text-2xl font-bold text-[#222]">料金体系</h2>
        <p className="mt-4 text-sm text-[#828282]">
          登録無料。取引成立時のみシステム手数料が発生します
        </p>
        <div className="mx-auto mt-12 max-w-md rounded-2xl bg-white p-8 shadow-card">
          <p className="text-sm text-[#828282]">システム手数料</p>
          <p className="mt-2 text-4xl font-bold text-primary-500">15%</p>
          <p className="mt-2 text-sm text-[#828282]">
            取引金額に対して（クリエイター負担）
          </p>
          <ul className="mt-6 space-y-3 text-left">
            {[
              "企業側の登録・利用は完全無料",
              "仮払い（エスクロー）方式で安心",
              "追加の月額費用なし",
              "1件からでも利用可能",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-[#4F4F4F]">
                <svg className="h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-24 rounded-2xl bg-[#242424] p-10 text-center sm:p-16">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          まずは無料登録から始めましょう
        </h2>
        <p className="mt-4 text-sm text-[#828282]">
          登録後すぐにクリエイターの検索・依頼が可能です
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/register" className="btn-primary text-sm">
            無料で企業登録
          </Link>
          <Link href="/creators" className="inline-flex items-center justify-center rounded-pill border-2 border-white/30 px-8 py-3 text-sm font-bold text-white transition-all hover:bg-white/10">
            クリエイターを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
