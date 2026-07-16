import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "料金体系",
  description:
    "AILIER の料金体系。クリエイター手数料 0%、企業側手数料 15%。他プラットフォームより最大 12 ポイント有利なトータル コストで、AI クリエイティブ制作をスタートできます。",
};

// F-4: 2026-07-16 全面リニューアル。
//   ✓ 「クリエイター 0% / 企業 15%」を明記
//   ✓ 他クラウドソーシング (合計 22〜27%) との比較インフォグラフィック
//   ✓ クリエイター満額受取の訴求
export const revalidate = 3600;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      {/* Hero */}
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-neon-pink/40 bg-neon-pink/5 px-3 py-1 text-xs font-bold text-neon-pink">
          <Sparkles size={12} strokeWidth={2} aria-hidden />
          クリエイター 手数料 0% ・ 企業側 15% のみ
        </div>
        <h1 className="mt-4 text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          シンプルで、業界最安水準。
        </h1>
        <p className="mt-4 text-base text-[#828282]">
          追加の月額費用なし。取引成立時にのみ、企業側から 15% のシステム手数料を頂きます。
        </p>
      </div>

      {/* 2 プラン カード */}
      <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-2">
        {/* Client */}
        <div className="relative overflow-hidden rounded-[20px] border-2 border-neon-purple/20 bg-white p-8 sm:p-10">
          <p className="text-sm font-bold text-neon-purple-deep">
            企業・クライアント
          </p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-5xl font-bold text-[#222]">15</span>
            <span className="text-xl font-bold text-[#828282]">%</span>
            <span className="ml-2 text-xs text-[#828282]">
              取引成立時のみ
            </span>
          </div>
          <p className="mt-2 text-sm text-[#828282]">
            登録・検索・依頼はすべて無料。取引成立時に発注金額の 15% を上乗せしてお支払いいただきます。
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "アカウント登録・利用料 なし",
              "AI クリエイター検索・閲覧 無制限",
              "メッセージ機能 無料",
              "AI 動画・静止画案件の掲載 無料",
              "エスクロー決済で安心取引",
              "月額固定費 なし (完全成果報酬)",
            ].map((t) => (
              <li
                key={t}
                className="flex items-center gap-2.5 text-sm text-[#4F4F4F]"
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="shrink-0 text-neon-pink"
                  aria-hidden
                />
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="btn-primary mt-8 inline-block w-full text-center text-sm"
          >
            無料で始める
          </Link>
        </div>

        {/* Creator */}
        <div className="relative overflow-hidden rounded-[20px] border-2 border-neon-pink/50 bg-white p-8 sm:p-10">
          <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            0% Forever
          </div>
          <p className="text-sm font-bold text-[#222]">AI クリエイター</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-5xl font-bold text-[#222]">0</span>
            <span className="text-xl font-bold text-[#828282]">%</span>
            <span className="ml-2 text-xs text-[#828282]">永久無料</span>
          </div>
          <p className="mt-2 text-sm text-[#828282]">
            発注金額を <b>100% 満額</b> 受け取れます。プラットフォーム手数料はクリエイターには一切かかりません。
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "アカウント登録・ポートフォリオ掲載 無料",
              "料金プラン 自由設定",
              "案件への応募 無料",
              "メッセージ機能 無料",
              "取引成立時の手数料 0% (満額受取)",
              "Stripe 経由で確実に報酬受取",
            ].map((t) => (
              <li
                key={t}
                className="flex items-center gap-2.5 text-sm text-[#4F4F4F]"
              >
                <Check
                  size={16}
                  strokeWidth={2.2}
                  className="shrink-0 text-neon-pink"
                  aria-hidden
                />
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 inline-flex w-full items-center justify-center rounded-pill border-2 border-[#222] bg-white px-8 py-3 text-sm font-bold text-[#222] transition-all hover:bg-[#222] hover:text-white"
          >
            AI クリエイターとして登録
          </Link>
        </div>
      </div>

      {/* F-4: 他クラウドソーシング との比較インフォグラフィック */}
      <ComparisonInfographic />

      {/* 手数料内訳: 発注金額に対するフロー図 */}
      <FeeFlowDiagram />

      {/* Price examples */}
      <div className="mx-auto mt-24 max-w-2xl">
        <h2 className="text-center text-xl font-bold text-[#222]">
          AI 動画・静止画制作の費用目安
        </h2>
        <div className="mt-8 space-y-3">
          {[
            { genre: "SNS ショート AI 動画 (縦型 1 本)", price: "¥10,000〜¥25,000" },
            { genre: "SNS 広告 静止画バナー (5 枚セット)", price: "¥15,000〜¥40,000" },
            { genre: "YouTube AI 動画編集 (10 分)", price: "¥25,000〜¥50,000" },
            { genre: "商品・サービス紹介 AI 動画", price: "¥80,000〜¥250,000" },
            { genre: "Midjourney 商品ビジュアル (10 枚)", price: "¥30,000〜¥80,000" },
            { genre: "企業紹介・採用 AI 動画", price: "¥200,000〜¥450,000" },
            { genre: "AI 絵コンテ / CM 案 複数パターン", price: "¥100,000〜¥600,000" },
            { genre: "Sora / Veo 活用 ハイエンド映像", price: "¥300,000〜¥1,000,000" },
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
          ※ 上記は参考価格です。実際の金額は AI クリエイターの料金プランをご確認ください。
        </p>
      </div>
    </div>
  );
}

// =========================================================
// F-4: 他プラットフォームとの手数料比較
//
// - ランサーズ / クラウドワークス は システム利用料 = 発注者 5% + 受注者 5〜22%
// - ココナラ は サービス手数料 = 発注者 5.5% + 受注者 22%
// (2026-07 時点の各社公開情報 / 変動可)
//
// 本セクションは "AI クリエイター視点の可処分収入" を主軸にして
// AILIER 優位性を可視化する。
// =========================================================

const COMPARISON = [
  {
    key: "ailier",
    name: "AILIER",
    creatorFee: 0,
    clientFee: 15,
    total: 15,
    highlight: true,
    note: "クリエイター 100% 受取",
  },
  {
    key: "lancers",
    name: "ランサーズ",
    creatorFee: 16.5, // 5〜22% レンジの中央付近 (税込 目安)
    clientFee: 5.5,
    total: 22,
    highlight: false,
    note: "受注者から高率控除",
  },
  {
    key: "crowdworks",
    name: "クラウドワークス",
    creatorFee: 16.5,
    clientFee: 5.5,
    total: 22,
    highlight: false,
    note: "受注者から高率控除",
  },
  {
    key: "coconala",
    name: "ココナラ",
    creatorFee: 22,
    clientFee: 5.5,
    total: 27.5,
    highlight: false,
    note: "受注者控除 22%",
  },
];

function ComparisonInfographic() {
  // レンジ 0〜30% でバー幅を正規化
  const MAX = 30;

  return (
    <div className="mx-auto mt-24 max-w-4xl">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neon-pink">
          Cost Comparison
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#222]">
          他プラットフォーム比較 — 合計手数料
        </h2>
        <p className="mt-2 text-sm text-[#828282]">
          大手クラウドソーシングは 発注者 + 受注者 で 22〜27% 前後。
          AILIER は合計 <b className="text-neon-pink">15%</b> のみで、
          クリエイターは満額受取が可能です。
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-3">プラットフォーム</th>
              <th className="px-4 py-3 text-right">発注者手数料</th>
              <th className="px-4 py-3 text-right">受注者手数料</th>
              <th className="px-4 py-3 text-right">合計</th>
              <th className="px-4 py-3">相対比較 (0〜{MAX}%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {COMPARISON.map((row) => (
              <tr
                key={row.key}
                className={row.highlight ? "bg-neon-pink/5" : ""}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        row.highlight ? "text-neon-pink" : "text-gray-900"
                      }`}
                    >
                      {row.name}
                    </span>
                    {row.highlight && (
                      <span className="rounded-full bg-neon-pink px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                        当社
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    {row.note}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-700">
                  {row.clientFee}%
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono tabular-nums ${
                    row.creatorFee === 0
                      ? "font-bold text-neon-pink"
                      : "text-gray-700"
                  }`}
                >
                  {row.creatorFee === 0 ? "0% ✨" : `${row.creatorFee}%`}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono tabular-nums font-bold ${
                    row.highlight ? "text-neon-pink" : "text-gray-900"
                  }`}
                >
                  {row.total}%
                </td>
                <td className="px-4 py-3">
                  <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        row.highlight
                          ? "bg-gradient-to-r from-neon-pink to-neon-purple"
                          : "bg-gray-400"
                      }`}
                      style={{
                        width: `${Math.min(100, (row.total / MAX) * 100)}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 差額の可視化 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SavingsTile
          label="クリエイター 実質収入 差"
          value="+22%"
          desc="他社 22% 控除 vs AILIER 0%"
        />
        <SavingsTile
          label="10 万円案件 の手取り差額"
          value="+¥22,000"
          desc="他社 ¥78,000 → AILIER ¥100,000"
        />
        <SavingsTile
          label="合計手数料 差"
          value="-7〜12pt"
          desc="他社 22〜27% → AILIER 15%"
        />
      </div>

      <p className="mt-6 text-center text-[11px] text-[#BDBDBD]">
        ※ 2026 年 7 月時点の各社公開情報 (税込目安) に基づく比較です。
        料率改定により実際の値は変動する可能性があります。
      </p>
    </div>
  );
}

function SavingsTile({
  label,
  value,
  desc,
}: {
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-neon-pink/30 bg-gradient-to-br from-neon-pink/5 via-white to-neon-purple/5 p-4 text-center shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neon-pink">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-black text-[#222]">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-[#828282]">{desc}</p>
    </div>
  );
}

// =========================================================
// 発注金額 → クライアント支払 → クリエイター受取 の流れ図
// =========================================================
function FeeFlowDiagram() {
  return (
    <div className="mx-auto mt-24 max-w-3xl">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neon-purple-deep">
          Fee Flow
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#222]">
          手数料の流れ (10 万円 の案件例)
        </h2>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <FlowStep
          n="01"
          title="企業が支払う"
          amount="¥115,000"
          subline="発注金額 ¥100,000 + 15% 手数料"
          tone="client"
        />
        <FlowStep
          n="02"
          title="AILIER が受け取る"
          amount="¥15,000"
          subline="15% のシステム手数料 (企業側負担)"
          tone="platform"
        />
        <FlowStep
          n="03"
          title="クリエイターが受取"
          amount="¥100,000"
          subline="発注金額を 100% 満額 (手数料 0%)"
          tone="creator"
        />
      </div>

      <p className="mt-4 text-center text-[11px] text-[#BDBDBD]">
        ※ Stripe 決済手数料は別途発生します (企業側負担)。振込手数料はクリエイター負担 (¥250)。
      </p>
    </div>
  );
}

function FlowStep({
  n,
  title,
  amount,
  subline,
  tone,
}: {
  n: string;
  title: string;
  amount: string;
  subline: string;
  tone: "client" | "platform" | "creator";
}) {
  const toneClass =
    tone === "creator"
      ? "border-neon-pink/40 bg-gradient-to-br from-neon-pink/10 to-white text-neon-pink"
      : tone === "platform"
        ? "border-gray-300 bg-gray-50 text-gray-700"
        : "border-neon-purple/30 bg-neon-purple/5 text-neon-purple-deep";
  return (
    <div
      className={`rounded-2xl border-2 p-5 shadow-sm ${toneClass}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
        Step {n}
      </p>
      <p className="mt-1 text-sm font-bold">{title}</p>
      <p className="mt-2 font-display text-2xl font-black">{amount}</p>
      <p className="mt-1.5 text-[11px] leading-snug opacity-75">{subline}</p>
    </div>
  );
}
