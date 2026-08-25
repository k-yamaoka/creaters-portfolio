import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "使い方",
  description:
    "アイムビの使い方。企業もAIクリエイターも3ステップでAI動画制作を始められます。",
};

export const revalidate = 3600;

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          アイムビの使い方
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
              color: "bg-gradient-to-r from-aimovie-navy-900 to-aimovie-ember-500",
            },
            {
              step: "02",
              title: "相談・見積もり",
              desc: "メッセージで要件と参考動画を共有。AB案や絵コンテの相談を経て見積もりを受け取り、そのまま直接依頼できます。",
              color: "bg-gradient-to-r from-aimovie-navy-900 to-aimovie-ember-500",
            },
            {
              step: "03",
              title: "AIで動画・静止画を生成 × 納品",
              desc: "エスクロー仮払い後、AIで動画(MP4)と静止画バナー(JPG・PNG)を生成・編集し、最短2日納品。納品物を確認して検収完了で報酬が確定します。",
              color: "bg-gradient-to-r from-aimovie-navy-900 to-aimovie-ember-500",
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
              color: "bg-aimovie-navy-950",
            },
            {
              step: "02",
              title: "スカウト or 応募",
              desc: "企業からの直接スカウトを受けるか、AI動画案件に自ら応募して仕事を獲得します。営業活動はアイムビにお任せ。",
              color: "bg-aimovie-navy-950",
            },
            {
              step: "03",
              title: "AIで動画・静止画を生成 × 納品",
              desc: "AIで動画と静止画クリエイティブを生成・編集し、短納期で納品。クライアントの検収完了後、エスクロー方式で確実に報酬を受け取れます。",
              color: "bg-aimovie-navy-950",
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

      {/* 2026-07-07 移植 → 2026-07-14 A-3 で拡張:
          - トップに公式説明文 + 図解画像 プレースホルダー
          - その下に既存 3 カラム (仕組み) + 出金スケジュール補足 */}
      <div className="mt-24">
        <h2 className="text-center text-2xl font-bold text-[#222]">
          エスクロー決済 ＋ 取引管理
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-relaxed text-[#828282]">
          安心・安全なエスクロー決済を採用しています。発注時に企業様が先に
          代金をプラットフォームへ信託（仮払い）し、納品物の検収が完了した
          後にクリエイターへ報酬が支払われます。
        </p>

        {/* エスクロー フロー 図解 (inline SVG) — 発注 → 仮払い → 制作 → 検収 → 送金 */}
        <div className="mx-auto mt-8 max-w-4xl overflow-x-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <svg
            viewBox="0 0 720 260"
            role="img"
            aria-label="エスクロー決済フロー: 企業が仮払い → アイムビ が預かり → 検収完了後にクリエイターへ送金"
            className="mx-auto block h-auto w-full max-w-3xl"
          >
            {/* 3 ノード: 企業 / アイムビ / クリエイター */}
            <g fontFamily="Inter, system-ui, sans-serif">
              {/* 企業 */}
              <rect x="20" y="80" width="160" height="100" rx="16" fill="#F7F5F0" stroke="#0F1E3D" strokeWidth="1.5"/>
              <text x="100" y="120" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0F1E3D">企業</text>
              <text x="100" y="142" textAnchor="middle" fontSize="11" fill="#3A3A44">発注 + 仮払い</text>
              <text x="100" y="158" textAnchor="middle" fontSize="10" fill="#5C5D67">Stripe 決済</text>

              {/* アイムビ (中央、深紺塗り + オレンジ アクセント。主役として強調) */}
              <rect x="280" y="60" width="160" height="140" rx="16" fill="#0F1E3D" stroke="#FF6B35" strokeWidth="2"/>
              <text x="360" y="100" textAnchor="middle" fontSize="14" fontWeight="700" fill="#FF6B35">アイムビ</text>
              <text x="360" y="122" textAnchor="middle" fontSize="11" fill="#F7F5F0">代金を預かる</text>
              <text x="360" y="140" textAnchor="middle" fontSize="10" fill="#FFE4D6">(エスクロー)</text>
              <text x="360" y="168" textAnchor="middle" fontSize="10" fill="#F7F5F0" fontStyle="italic">検収後に送金</text>

              {/* クリエイター (再定義) */}
              <rect x="540" y="80" width="160" height="100" rx="16" fill="#F7F5F0" stroke="#0F1E3D" strokeWidth="1.5"/>
              <text x="620" y="120" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0F1E3D">クリエイター</text>
              <text x="620" y="142" textAnchor="middle" fontSize="11" fill="#3A3A44">制作 + 納品</text>
              <text x="620" y="158" textAnchor="middle" fontSize="10" fill="#5C5D67">3 営業日で入金</text>

              {/* 矢印: 企業 → アイムビ (仮払い、深紺) */}
              <defs>
                <marker id="arrNavy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#0F1E3D"/>
                </marker>
                <marker id="arrEmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill="#FF6B35"/>
                </marker>
              </defs>
              <path d="M 180 110 L 280 110" stroke="#0F1E3D" strokeWidth="2" fill="none" markerEnd="url(#arrNavy)"/>
              <text x="230" y="100" textAnchor="middle" fontSize="10" fill="#0F1E3D">仮払い</text>

              {/* 矢印: アイムビ → クリエイター (送金、オレンジ = お金の動きを主役に) */}
              <path d="M 440 150 L 540 150" stroke="#FF6B35" strokeWidth="2.5" fill="none" markerEnd="url(#arrEmber)"/>
              <text x="490" y="140" textAnchor="middle" fontSize="10" fill="#E5541B" fontWeight="700">送金</text>

              {/* 矢印: クリエイター → 企業 (納品、破線 グレー) */}
              <path
                d="M 540 165 Q 360 240 180 165"
                stroke="#8A8A93"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                fill="none"
                markerEnd="url(#arrNavy)"
              />
              <text x="360" y="238" textAnchor="middle" fontSize="10" fill="#5C5D67">納品</text>

              {/* 下段: 4 ステップ タイムライン */}
              <g transform="translate(0, 15)">
                <text x="360" y="30" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F1E3D">
                  発注 → 仮払い → 制作 → 検収 → 送金 (3 営業日)
                </text>
              </g>
            </g>
          </svg>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {[
            {
              title: "Stripe 連携で仮払い",
              desc: "案件成立時にクライアントが決済 → プラットフォームが預かり、検収後に自動でクリエイターへ送金。決済トラブルを防ぎます。",
            },
            {
              title: "ステータス一覧化",
              desc: "案件のステータス (制作中 / 納品済 / 支払完了) をダッシュボードで一覧管理。進行中の複数案件も俯瞰できます。",
            },
            {
              title: "1 取引にひとまとめ",
              desc: "メッセージ・ファイル・契約条件を 1 つの取引ページに集約。過去のやりとりや納品物にすぐアクセスできます。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-6 shadow-card"
            >
              <h3 className="text-base font-bold text-[#222]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#828282]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/dashboard/orders"
            className="btn-secondary text-sm"
          >
            取引管理を見る
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
