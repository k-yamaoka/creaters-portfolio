import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "使い方",
  description:
    "AILIERの使い方。企業もAIクリエイターも3ステップでAI動画制作を始められます。",
};

export const revalidate = 3600;

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          AILIERの使い方
        </h1>
        <p className="mt-4 text-base text-[#828282]">
          はじめての方でも簡単。3ステップでAI動画制作を依頼できます
        </p>
      </div>

      {/* For Clients */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold text-[#222]">
          企業・クライアントの方
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "AIクリエイターを探す",
              desc: "得意ツール（Sora / Veo / Runway / Midjourney）・ジャンル・予算で検索。ポートフォリオを見て最適な人材を見つけます。",
              color: "bg-gradient-to-r from-neon-pink to-neon-purple",
            },
            {
              step: "02",
              title: "相談・見積もり",
              desc: "メッセージで要件と参考動画を共有。AB案や絵コンテの相談を経て見積もりを受け取り、そのまま直接依頼できます。",
              color: "bg-gradient-to-r from-neon-pink to-neon-purple",
            },
            {
              step: "03",
              title: "AIで動画・静止画を生成 × 納品",
              desc: "エスクロー仮払い後、AIで動画(MP4)と静止画バナー(JPG・PNG)を生成・編集し、最短2日納品。納品物を確認して検収完了で報酬が確定します。",
              color: "bg-gradient-to-r from-neon-pink to-neon-purple",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${item.color} text-xl font-black text-white`}
              >
                {item.step}
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
        <div className="mt-10 text-center">
          <Link href="/creators" className="btn-primary text-sm">
            AIクリエイターを探す
          </Link>
        </div>
      </div>

      {/* For Creators */}
      <div className="mt-24">
        <h2 className="text-center text-2xl font-bold text-[#222]">
          AIクリエイターの方
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "プロフィール登録",
              desc: "アカウントを作成し、自己紹介・使用ツール（Sora / Veo / Runway / Midjourney など）・得意ジャンル・最低受注金額を設定。ポートフォリオを掲載します。",
              color: "bg-neon-midnight-deep",
            },
            {
              step: "02",
              title: "スカウト or 応募",
              desc: "企業からの直接スカウトを受けるか、AI動画案件に自ら応募して仕事を獲得します。営業活動はAILIERにお任せ。",
              color: "bg-neon-midnight-deep",
            },
            {
              step: "03",
              title: "AIで動画・静止画を生成 × 納品",
              desc: "AIで動画と静止画クリエイティブを生成・編集し、短納期で納品。クライアントの検収完了後、エスクロー方式で確実に報酬を受け取れます。",
              color: "bg-neon-midnight-deep",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${item.color} text-xl font-black text-white`}
              >
                {item.step}
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
        <div className="mt-10 text-center">
          <Link href="/register" className="btn-secondary text-sm">
            AIクリエイターとして登録
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-24">
        <h2 className="text-center text-2xl font-bold text-[#222]">
          よくある質問
        </h2>
        <div className="mx-auto mt-12 max-w-2xl space-y-4">
          {[
            {
              q: "登録は無料ですか？",
              a: "はい、企業・AIクリエイターともに登録は完全無料です。取引成立時にシステム手数料（15%）が発生します。",
            },
            {
              q: "どんなジャンルのAI動画・静止画を依頼できますか？",
              a: "Sora / Veo を活用したCM・PV、Runway / Midjourney を組み合わせた商品紹介、SNS広告用バナー静止画、AI絵コンテ、SNSショート動画、採用動画、企業VP、アニメーションなど、動画・静止画ともに幅広く対応しています。",
            },
            {
              q: "支払いはどのように行われますか？",
              a: "エスクロー（仮払い）方式を採用しています。制作開始前にクライアントが仮払いを行い、納品確認後にAIクリエイターへ報酬が支払われます。",
            },
            {
              q: "キャンセルはできますか？",
              a: "制作開始前（仮払い前）であればキャンセル可能です。仮払い後のキャンセルについては、双方の合意のもと対応いたします。",
            },
            {
              q: "打ち合わせは対面で行いますか？",
              a: "すべてオンラインで完結します。メッセージ機能やビデオ通話で打ち合わせを行い、納品までフルリモートで対応可能です。",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-2xl bg-white p-6 shadow-card"
            >
              <h3 className="font-bold text-[#222]">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#828282]">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
