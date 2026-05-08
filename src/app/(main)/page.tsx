import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const InfiniteSlider = dynamic(
  () =>
    import("@/components/home/infinite-slider").then((m) => m.InfiniteSlider),
  { loading: () => <div className="h-[280px] bg-paper-deep" /> }
);

export default function HomePage() {
  return (
    <>
      {/* ==============================
          Hero — Editorial / asymmetric
          ============================== */}
      <section className="grain relative overflow-hidden bg-paper">
        <div className="mx-auto grid max-w-container grid-cols-12 gap-x-6 px-6 pb-24 pt-16 lg:gap-x-10 lg:px-[6.25rem] lg:pb-32 lg:pt-24">
          {/* Left meta column */}
          <aside className="col-span-12 mb-10 lg:col-span-2 lg:mb-0">
            <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-6">
              <span className="font-display text-xs uppercase tracking-[0.35em] text-ink-muted">
                Issue / 2026
              </span>
              <span className="hidden h-px w-12 bg-ink lg:block" />
              <span className="font-display text-xs uppercase tracking-[0.35em] text-ink-muted">
                Vol. 01 — Tokyo
              </span>
            </div>
          </aside>

          {/* Headline */}
          <div className="col-span-12 lg:col-span-10">
            <p className="eyebrow mb-8 text-primary-600">Creators × Business</p>
            <h1 className="h-display text-balance text-[2.75rem] leading-[1.05] sm:text-[4.5rem] lg:text-[6.5rem]">
              映像の力で、
              <br />
              ビジネスを<span className="italic text-primary-500">、加速</span>。
            </h1>

            <div className="mt-12 grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-6 lg:col-start-1">
                <p className="max-w-md text-[15px] leading-[2] text-ink-muted">
                  企業VP・YouTube・SNS広告・ウェディングまで。
                  実績豊富な映像クリエイターと、最適な形でマッチング。
                  ポートフォリオを見て依頼するか、案件を掲載してクリエイターを募るか。
                </p>
                <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/creators"
                    className="group/btn inline-flex items-center justify-between gap-4 bg-ink px-6 py-4 font-display text-base font-medium text-paper transition-colors hover:bg-primary-500"
                    style={{ borderRadius: "2px" }}
                  >
                    <span>クリエイターを探す</span>
                    <span className="text-primary-300 transition-transform group-hover/btn:translate-x-1">
                      →
                    </span>
                  </Link>
                  <Link
                    href="/jobs"
                    className="group/btn inline-flex items-center justify-between gap-4 border-2 border-ink px-6 py-4 font-display text-base font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
                    style={{ borderRadius: "2px" }}
                  >
                    <span>案件を探す</span>
                    <span className="transition-transform group-hover/btn:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right column: editorial image with caption */}
              <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:row-start-1">
                <figure className="relative">
                  <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink">
                    <Image
                      src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=720&h=900&fit=crop"
                      alt="ポートフォリオサンプル"
                      fill
                      className="object-cover"
                      priority
                      sizes="(min-width: 1024px) 40vw, 100vw"
                    />
                    {/* Editorial caption strip */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-baseline justify-between bg-paper/95 px-4 py-3 backdrop-blur-sm">
                      <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-muted">
                        Fig. 01 — Showreel
                      </span>
                      <span className="font-display text-[10px] uppercase tracking-[0.3em] text-primary-500">
                        ▶ Play
                      </span>
                    </div>
                  </div>
                  {/* Numerical detail */}
                  <div className="absolute -left-3 -top-4 z-10 hidden lg:block">
                    <span className="font-display text-[5rem] font-medium leading-none tracking-tightest-x text-primary-500">
                      ’26
                    </span>
                  </div>
                </figure>
              </div>
            </div>

            {/* Stats row — minimalist */}
            <div className="mt-20 grid grid-cols-2 gap-y-8 border-y border-ink/20 py-8 lg:grid-cols-4">
              {[
                { num: "500+", label: "Projects matched" },
                { num: "4.9", label: "Avg. satisfaction" },
                { num: "100%", label: "Remote ready" },
                { num: "0¥", label: "Registration" },
              ].map((s) => (
                <div key={s.label} className="px-2">
                  <p className="font-display text-4xl font-medium leading-none tracking-tightest-x text-ink sm:text-5xl">
                    {s.num}
                  </p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marquee tagline */}
        <div className="overflow-hidden border-y border-ink bg-ink py-4 text-paper">
          <div className="flex animate-marquee whitespace-nowrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="mx-8 font-display text-2xl font-medium uppercase tracking-tightest-x"
              >
                Corporate VP <span className="text-primary-500">●</span> YouTube{" "}
                <span className="text-primary-500">●</span> SNS Ads{" "}
                <span className="text-primary-500">●</span> Wedding{" "}
                <span className="text-primary-500">●</span> Documentary{" "}
                <span className="text-primary-500">●</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================
          Showreel slider
          ============================== */}
      <InfiniteSlider />

      {/* ==============================
          Two ways to match — editorial split
          ============================== */}
      <section className="bg-paper py-28">
        <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-7">
              <p className="eyebrow text-ink-muted">— Two methods</p>
              <h2 className="h-display mt-6 text-[2.25rem] sm:text-[3.5rem] lg:text-[4.5rem]">
                探すか、<span className="italic text-primary-500">募るか</span>。
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-4 lg:col-start-9">
              <p className="text-sm leading-[2] text-ink-muted">
                スカウト型と募集型。あなたのプロジェクトに合った方法で、
                クリエイターと企業がフラットに繋がります。
              </p>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-px bg-ink/15 lg:grid-cols-2">
            {/* Pattern A: スカウト型 */}
            <div className="group/col relative bg-paper p-8 transition-colors hover:bg-paper-deep sm:p-12">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-soft">
                  Method A — Scout
                </span>
                <span className="font-display text-7xl font-medium leading-none tracking-tightest-x text-ink/10 transition-colors group-hover/col:text-primary-500/30 sm:text-8xl">
                  01
                </span>
              </div>

              <h3 className="h-display mt-6 text-3xl sm:text-4xl">
                スカウト型
              </h3>
              <p className="mt-2 text-sm font-medium text-primary-600">
                クリエイターを探して直接依頼する
              </p>

              <ol className="mt-10 space-y-0">
                {[
                  { actor: "Creator", text: "ポートフォリオ・料金表を掲載" },
                  { actor: "Client", text: "検索・比較してクリエイターを選定" },
                  { actor: "Client", text: "メッセージで相談・見積もり依頼" },
                  { actor: "Both", text: "仮払い → 制作 → 納品 → 検収" },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-5 border-b border-ink/15 py-4 last:border-0"
                  >
                    <span className="font-display text-sm font-medium tabular-nums text-ink-muted">
                      0{i + 1}
                    </span>
                    <span className="font-display text-[10px] uppercase tracking-[0.25em] text-primary-500">
                      {item.actor}
                    </span>
                    <span className="flex-1 text-sm text-ink">{item.text}</span>
                  </li>
                ))}
              </ol>

              <Link
                href="/creators"
                className="group/btn mt-10 inline-flex items-center gap-3 font-display text-base font-medium text-ink transition-colors hover:text-primary-500"
              >
                <span>クリエイターを探す</span>
                <span className="block h-px w-12 bg-current transition-all group-hover/btn:w-20" />
                <span>→</span>
              </Link>
            </div>

            {/* Pattern B: 募集型 */}
            <div className="group/col relative bg-paper p-8 transition-colors hover:bg-paper-deep sm:p-12">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-soft">
                  Method B — Open call
                </span>
                <span className="font-display text-7xl font-medium leading-none tracking-tightest-x text-ink/10 transition-colors group-hover/col:text-primary-500/30 sm:text-8xl">
                  02
                </span>
              </div>

              <h3 className="h-display mt-6 text-3xl sm:text-4xl">募集型</h3>
              <p className="mt-2 text-sm font-medium text-primary-600">
                案件を掲載してクリエイターを募る
              </p>

              <ol className="mt-10 space-y-0">
                {[
                  { actor: "Client", text: "案件の要件・予算・納期を掲載" },
                  { actor: "Creator", text: "案件を閲覧して応募・提案" },
                  { actor: "Client", text: "提案を比較してクリエイターを選定" },
                  { actor: "Both", text: "仮払い → 制作 → 納品 → 検収" },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-5 border-b border-ink/15 py-4 last:border-0"
                  >
                    <span className="font-display text-sm font-medium tabular-nums text-ink-muted">
                      0{i + 1}
                    </span>
                    <span className="font-display text-[10px] uppercase tracking-[0.25em] text-primary-500">
                      {item.actor}
                    </span>
                    <span className="flex-1 text-sm text-ink">{item.text}</span>
                  </li>
                ))}
              </ol>

              <Link
                href="/jobs"
                className="group/btn mt-10 inline-flex items-center gap-3 font-display text-base font-medium text-ink transition-colors hover:text-primary-500"
              >
                <span>案件を探す</span>
                <span className="block h-px w-12 bg-current transition-all group-hover/btn:w-20" />
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          Working style / pricing — list
          ============================== */}
      <section className="border-y border-ink/15 bg-paper-deep py-28">
        <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <p className="eyebrow text-ink-muted">— On the table</p>
              <h2 className="h-display mt-6 text-[2.25rem] sm:text-[3rem]">
                働き方と
                <br />
                料金のはなし。
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-[2] text-ink-muted">
                すべてリモート完結。料金はパッケージ制で、
                発注前に総額が見える。
              </p>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <dl className="divide-y divide-ink/15 border-y border-ink/15">
                {[
                  {
                    no: "01",
                    title: "フルリモート対応",
                    body: "打ち合わせから納品まで完全オンライン。全国どこからでも依頼・受注。",
                  },
                  {
                    no: "02",
                    title: "明確なパッケージ料金",
                    body: "事前に費用を把握。追加費用なしのシンプルな料金設計。",
                    extras: [
                      ["SNS動画（1本）", "¥15,000〜"],
                      ["YouTube編集", "¥30,000〜"],
                      ["企業VP", "¥300,000〜"],
                    ] as [string, string][],
                  },
                  {
                    no: "03",
                    title: "エスクロー決済",
                    body: "仮払い方式で安心。納品確認後にクリエイターへ報酬が支払われる。",
                  },
                ].map((item) => (
                  <div
                    key={item.no}
                    className="grid grid-cols-12 gap-4 py-8"
                  >
                    <div className="col-span-2">
                      <span className="font-display text-3xl font-medium tabular-nums tracking-tightest-x text-primary-500">
                        {item.no}
                      </span>
                    </div>
                    <div className="col-span-10">
                      <h3 className="h-display text-2xl">{item.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-[1.9] text-ink-muted">
                        {item.body}
                      </p>
                      {item.extras && (
                        <ul className="mt-5 grid gap-1 sm:max-w-md">
                          {item.extras.map(([label, price]) => (
                            <li
                              key={label}
                              className="flex items-baseline justify-between border-b border-dashed border-ink/20 py-1.5 text-sm"
                            >
                              <span className="text-ink-muted">{label}</span>
                              <span className="font-display font-medium tabular-nums text-ink">
                                {price}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          Benefits — magazine spread
          ============================== */}
      <section className="bg-paper py-28">
        <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
          <div className="text-center">
            <p className="eyebrow justify-center text-ink-muted">— Membership</p>
            <h2 className="h-display mt-6 text-[2.25rem] sm:text-[3.5rem] lg:text-[4.5rem]">
              登録するメリット。
            </h2>
          </div>

          <div className="mt-20 grid gap-px bg-ink/15 lg:grid-cols-2">
            {/* 企業 */}
            <article className="bg-paper p-8 sm:p-12">
              <div className="flex items-center gap-3">
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-soft">
                  For
                </span>
                <span className="h-px flex-1 bg-ink/20" />
                <span className="font-display text-2xl font-medium tracking-tightest-x text-ink">
                  Business
                </span>
              </div>

              <h3 className="h-display mt-8 text-3xl sm:text-4xl">
                企業・クライアントの方
              </h3>

              <ol className="mt-10 space-y-6">
                {[
                  ["実績で選べる安心感", "ポートフォリオで過去の作品を確認。スキルが一目でわかる。"],
                  ["コスト削減", "制作会社を介さず直接依頼。中間マージンをカット。"],
                  ["スピーディな発注", "検索→相談→発注がオンラインで完結。最短即日で制作開始。"],
                  ["安心の決済システム", "エスクロー方式で納品まで資金が保護される。"],
                ].map(([title, desc], i) => (
                  <li key={title} className="flex items-baseline gap-5">
                    <span className="font-display text-2xl font-medium tabular-nums tracking-tightest-x text-primary-500">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="font-display text-base font-medium text-ink">
                        {title}
                      </p>
                      <p className="mt-1 text-sm leading-[1.85] text-ink-muted">
                        {desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <Link
                href="/register"
                className="group/btn mt-10 inline-flex items-center gap-3 font-display text-base font-medium text-ink transition-colors hover:text-primary-500"
              >
                <span>企業として登録（無料）</span>
                <span className="block h-px w-12 bg-current transition-all group-hover/btn:w-20" />
                <span>→</span>
              </Link>
            </article>

            {/* クリエイター */}
            <article className="bg-paper p-8 sm:p-12">
              <div className="flex items-center gap-3">
                <span className="font-display text-[10px] uppercase tracking-[0.3em] text-ink-soft">
                  For
                </span>
                <span className="h-px flex-1 bg-ink/20" />
                <span className="font-display text-2xl font-medium tracking-tightest-x text-ink">
                  Creator
                </span>
              </div>

              <h3 className="h-display mt-8 text-3xl sm:text-4xl">
                クリエイターの方
              </h3>

              <ol className="mt-10 space-y-6">
                {[
                  ["営業不要で案件獲得", "ポートフォリオを掲載するだけで企業からスカウトが届く。"],
                  ["自分の価格で受注", "料金表を自由に設定。スキルに見合った報酬を得られる。"],
                  ["フルリモート対応", "場所を選ばず仕事ができる。全国の企業と取引可能。"],
                  ["確実な報酬受取", "エスクロー方式で未払いリスクゼロ。制作に集中できる。"],
                ].map(([title, desc], i) => (
                  <li key={title} className="flex items-baseline gap-5">
                    <span className="font-display text-2xl font-medium tabular-nums tracking-tightest-x text-primary-500">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="font-display text-base font-medium text-ink">
                        {title}
                      </p>
                      <p className="mt-1 text-sm leading-[1.85] text-ink-muted">
                        {desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <Link
                href="/register"
                className="group/btn mt-10 inline-flex items-center gap-3 font-display text-base font-medium text-ink transition-colors hover:text-primary-500"
              >
                <span>クリエイターとして登録（無料）</span>
                <span className="block h-px w-12 bg-current transition-all group-hover/btn:w-20" />
                <span>→</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ==============================
          Closing CTA — bold typographic
          ============================== */}
      <section className="grain relative overflow-hidden bg-ink py-28 text-paper">
        <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-9">
              <p className="eyebrow text-primary-300">— Start now</p>
              <h2 className="h-display mt-6 text-balance text-[2.5rem] leading-[1.05] text-paper sm:text-[4rem] lg:text-[6rem]">
                さあ、はじめよう。
                <br />
                映像が、<span className="italic text-primary-500">仕事を変える</span>。
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-3">
              <p className="text-sm leading-[2] text-paper/70">
                無料で会員登録して、いますぐクリエイターを探すか、
                ポートフォリオを公開しよう。
              </p>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group/btn inline-flex items-center justify-between gap-4 bg-primary-500 px-7 py-4 font-display text-base font-medium text-white transition-colors hover:bg-primary-600"
              style={{ borderRadius: "2px" }}
            >
              <span>無料で会員登録</span>
              <span className="transition-transform group-hover/btn:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/creators"
              className="group/btn inline-flex items-center justify-between gap-4 border-2 border-paper/40 px-7 py-4 font-display text-base font-medium text-paper transition-colors hover:border-paper hover:bg-paper/10"
              style={{ borderRadius: "2px" }}
            >
              <span>クリエイターを見る</span>
              <span className="transition-transform group-hover/btn:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
