import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "運営会社",
  description: "CreatorsHub運営会社の情報。",
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
              { label: "会社名", value: "CreatorsHub 運営事務局" },
              { label: "所在地", value: "東京都渋谷区（詳細は準備中）" },
              { label: "設立", value: "2025年" },
              { label: "代表者", value: "（準備中）" },
              { label: "事業内容", value: "映像クリエイターマッチングプラットフォームの企画・開発・運営" },
              { label: "メール", value: "support@creatorshub.jp" },
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
          私たちは「映像の力で、すべての人のビジネスを加速させる」をミッションに掲げています。
          優れた映像クリエイターと、映像制作を必要とする企業を最適な形でつなぎ、
          双方にとって価値のある取引を実現するプラットフォームを目指しています。
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#4F4F4F]">
          フリーランスの映像クリエイターが営業に時間を費やすことなく、制作に集中できる環境。
          企業が信頼できるクリエイターに、安心して映像制作を依頼できる仕組み。
          CreatorsHubは、そのどちらも実現します。
        </p>
      </div>

      {/* Values */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-[#222]">バリュー</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "透明性",
              desc: "ポートフォリオ、料金、評価をすべて可視化。情報の非対称性をなくします。",
            },
            {
              title: "安全性",
              desc: "エスクロー決済と本人確認で、安心して取引できる環境を提供します。",
            },
            {
              title: "シンプルさ",
              desc: "検索から納品まで、誰でも迷わず使えるシンプルなUXを追求します。",
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
