"use client";

import { useEffect } from "react";

/**
 * FAQ セクション (URL-009 対応)。
 *
 * 配置履歴:
 *   - 2026-06 頃 〜 2026-09: LP TOP の 06 セクションとして掲載
 *   - 2026-09-03 (URL-009): /pricing 下部に移設。ヘッダー「FAQ」リンクは
 *     /pricing#faq を指す。
 *
 * 自動スクロール:
 *   ブラウザは通常 URL hash に自動スクロールするが、Client Component の
 *   マウントや Suspense boundary の解決タイミング次第でスクロールが
 *   ミスするケースがあるため、mount 後に window.location.hash === "#faq"
 *   を検出した場合は明示的に scrollIntoView を呼ぶ。
 */
export function FaqSection() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollIfHash = () => {
      if (window.location.hash !== "#faq") return;
      // mount / hashchange 直後は layout が確定していない場合があるので次の frame で
      requestAnimationFrame(() => {
        const el = document.getElementById("faq");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    // 1) 初回マウント時のハッシュ (直接 /pricing#faq を開いたケース)
    scrollIfHash();
    // 2) 同一ページ内でヘッダーの FAQ リンクを再クリックしたときも発火させる
    //    (Next の <Link> は hash のみ変更のときページ全体をリマウントしない)
    window.addEventListener("hashchange", scrollIfHash);
    return () => window.removeEventListener("hashchange", scrollIfHash);
  }, []);

  return (
    <section
      id="faq"
      className="relative mx-auto mt-24 max-w-narrow px-gutter scroll-mt-24"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
        <div>
          <p className="eyebrow-mono">
            (FAQ)
            <span className="ml-2 text-ink/35">／ よくある質問</span>
          </p>
        </div>
        <div>
          <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-ink">
            <span className="italic text-sand">Questions.</span>
          </h2>
          <p className="mt-3 text-sm font-medium tracking-wide text-ink/60">
            よくある質問
          </p>
          <p className="body-jp mt-8 max-w-prose-jp text-ink/70">
            発注前に、よくある質問。
          </p>
        </div>
      </div>

      <div className="mt-12 border-y border-ink/10">
        <ul className="divide-y divide-ink/10">
          {FAQ_ITEMS.map((f, i) => {
            const num = String(i + 1).padStart(2, "0");
            return (
              <li key={i}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-6 sm:gap-6 sm:py-8">
                    <span className="flex min-w-0 flex-1 items-baseline gap-3 sm:gap-6">
                      <span className="eyebrow-mono shrink-0">Q.{num}</span>
                      <span className="font-display min-w-0 text-base font-medium text-ink sm:text-xl">
                        {f.q}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/30 text-ink/60 transition-transform duration-300 group-open:rotate-180"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div className="flex items-start gap-3 pb-8 sm:gap-6 sm:pb-10">
                    <span className="eyebrow-mono shrink-0">A.{num}</span>
                    <p className="body-jp text-sm text-ink/70 sm:text-base">
                      {f.a}
                    </p>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// 2026-09-03: 旧 /how-it-works の重複 FAQ を統合。単一情報源として /pricing#faq
// にまとめる (URL-009 で確定した導線)。
const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "動画 1 本の費用はどれくらいかかりますか？",
    a: "クリエイターと内容によりますが、SNS 広告 15 秒なら ¥30,000 〜 が目安です。詳細ページで最低対応プランの内訳が公開されているので、相談前に概算が把握できます。AI 見積もりチャットも併用ください。",
  },
  {
    q: "どんなジャンルの AI 動画・静止画を依頼できますか？",
    a: "Sora / Veo を活用した CM・PV、Runway / Midjourney を組み合わせた商品紹介、SNS 広告用バナー静止画、AI 絵コンテ、SNS ショート動画、採用動画、企業 VP、アニメーションなど、動画・静止画ともに幅広く対応しています。",
  },
  {
    q: "制作期間はどれくらいですか？",
    a: "クリエイターと作品の規模によって異なります。1 本単発の SNS 広告であれば数日、シリーズ展開やコーポレート VP は 1〜3 週間が目安です。納期は依頼時にクリエイターと合意できます。",
  },
  {
    q: "修正は何回まで対応してもらえますか？",
    a: "プランごとに修正回数が明示されています (例: 2 回まで)。追加修正が必要な場合は別途見積もりで対応します。",
  },
  {
    q: "打ち合わせは対面で行いますか？",
    a: "すべてオンラインで完結します。メッセージ機能やビデオ通話で打ち合わせを行い、納品までフルリモートで対応可能です。",
  },
  {
    q: "著作権は誰に帰属しますか？",
    a: "完成物の利用権は発注者に譲渡されます (詳細はクリエイターと取り交わす契約内容に従います)。AI 生成素材のライセンスもプラン明細で確認できます。",
  },
  {
    q: "支払いはどのように行われますか？",
    a: "案件成立時にエスクロー (仮払い) 方式でクライアントが仮払いを行います。納品確認後にプラットフォームからクリエイターへ送金され、検収完了までは万一のトラブルでも全額返金可能です。",
  },
  {
    q: "キャンセルはできますか？",
    a: "制作開始前 (仮払い前) であればキャンセル可能です。仮払い後のキャンセルについては、双方の合意のもと対応いたします。",
  },
  {
    q: "登録は無料ですか？アイムビ の手数料はどれくらい？",
    a: "企業・AI クリエイターともに登録・掲載・閲覧は完全無料です。取引成立時にのみ、企業側から取引金額の 15% のシステム手数料を頂きます。クリエイター側の手数料は 0% で、発注金額を満額受け取れます。",
  },
];
