import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "運営会社",
  description: "AIクリエイター特化型マッチングプラットフォーム AILIER の運営会社（Comhuman-Quality株式会社）情報。",
};

export const revalidate = 3600;

export default function CompanyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-0">
      <h1 className="text-3xl font-bold text-[#222]">運営会社</h1>

      <div className="mt-10 rounded-2xl bg-white p-8 shadow-card">
        <table className="w-full">
          <tbody className="divide-y divide-[#F2F2F2]">
            {[
              { label: "会社名", value: "Comhuman-Quality株式会社" },
              { label: "所在地", value: "〒150-0013 東京都渋谷区恵比寿1-15-9-403" },
              { label: "設立", value: "2023年6月9日" },
              { label: "代表者", value: "山岡 浩志" },
              {
                label: "事業内容",
                value:
                  "システム開発・Web制作、AI活用・開発コンサルティング、AI動画制作・SNS運用、AIクリエイター特化型マッチングプラットフォーム『AILIER』の運営",
              },
              { label: "メール", value: "info@comhuman-quality.com" },
              { label: "電話", value: "03-6403-3319" },
              { label: "コーポレートサイト", value: "https://comhuman-quality.com/" },
            ].map((row) => (
              <tr key={row.label}>
                <th className="w-32 py-4 text-left text-sm font-medium text-[#828282] sm:w-40">
                  {row.label}
                </th>
                <td className="py-4 text-sm text-[#222]">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mission */}
      <div className="mt-12 rounded-2xl bg-[#F8F8F8] p-8 sm:p-12">
        <h2 className="text-xl font-bold text-[#222]">ミッション</h2>
        <p className="mt-4 text-sm leading-relaxed text-[#4F4F4F]">
          私たちは「AI動画の力で、すべての人のビジネスを加速させる」をミッションに掲げています。
          Sora / Veo / Runway / Midjourney などを使いこなすAIクリエイターと、AI動画制作を必要とする企業を最適な形でつなぎ、
          双方にとって価値のある取引を実現するプラットフォームを目指しています。
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#4F4F4F]">
          AIクリエイターが営業に時間を費やすことなく、プロンプト設計と編集に集中できる環境。
          企業が信頼できるAIクリエイターに、最短2日で高品質なAI動画を依頼できる仕組み。
          AILIERは、そのどちらも実現します。
        </p>
      </div>

      {/* Values */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-[#222]">バリュー</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "透明性",
              desc: "作品・料金・評価をすべて可視化。情報の非対称性をなくします。",
            },
            {
              title: "安全性",
              desc: "エスクロー決済と本人確認、AI生成物の権利確認で、安心して取引できる環境を提供します。",
            },
            {
              title: "スピード",
              desc: "AI生成 × 編集 を前提とした体験設計で、最短2日納品・AB案10倍の制作スピードを実現します。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-card"
            >
              <h3 className="font-bold text-[#222]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#828282]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
