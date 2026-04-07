import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const InfiniteSlider = dynamic(
  () =>
    import("@/components/home/infinite-slider").then((m) => m.InfiniteSlider),
  { loading: () => <div className="h-[220px] bg-[#F8F8F8]" /> }
);

export default function HomePage() {
  return (
    <>
      {/* ==============================
          Hero Section (2-column)
          ============================== */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto flex max-w-container flex-col items-center px-6 py-20 lg:flex-row lg:gap-16 lg:px-[6.25rem] lg:py-28">
          {/* Left: Concept */}
          <div className="max-w-xl lg:max-w-[48%]">
            <p className="text-sm font-bold tracking-widest text-primary-500">
              CREATORS HUB
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-[120%] text-[#222] sm:text-[3.25rem]">
              映像の力で、
              <br />
              ビジネスを
              <span className="text-primary-500">加速</span>させる
            </h1>
            <p className="mt-6 text-base leading-[180%] text-[#828282] sm:text-lg">
              企業VP・YouTube・SNS広告・ウェディングまで。
              <br className="hidden sm:block" />
              実績豊富な映像クリエイターと、最適な形でマッチング。
              <br className="hidden sm:block" />
              ポートフォリオを見て依頼、または案件を掲載して募集。
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/creators" className="btn-primary px-10 py-4 text-lg">
                クリエイターを探す
              </Link>
              <Link
                href="/jobs"
                className="btn-secondary px-10 py-4 text-lg"
              >
                案件を探す
              </Link>
            </div>
          </div>

          {/* Right: Portfolio samples */}
          <div className="mt-12 flex flex-1 justify-center lg:mt-0 lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Main video thumbnail */}
              <div className="overflow-hidden rounded-[20px] shadow-card-hover">
                <Image
                  src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=380&fit=crop"
                  alt="ポートフォリオサンプル"
                  width={600}
                  height={380}
                  className="h-auto w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <svg
                      className="ml-1 h-7 w-7 text-primary-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Floating mini cards */}
              <div className="absolute -bottom-6 -left-4 overflow-hidden rounded-2xl bg-white p-2 shadow-card sm:-left-8">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                    4.9
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#222]">
                      平均満足度
                    </p>
                    <p className="text-[10px] text-[#828282]">500+件の実績</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 overflow-hidden rounded-2xl bg-white p-2 shadow-card sm:-right-8">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                    <svg
                      className="h-5 w-5"
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
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#222]">
                      安心エスクロー
                    </p>
                    <p className="text-[10px] text-[#828282]">仮払い対応</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          Infinite Scroll Slider
          ============================== */}
      <InfiniteSlider />

      {/* ==============================
          取引の流れ（2パターン）
          ============================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
              2つのマッチング方法
            </h2>
            <p className="mt-4 text-base text-[#828282]">
              あなたに合った方法でクリエイター・企業と繋がれます
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* Pattern A: スカウト型 */}
            <div className="rounded-[20px] border-2 border-primary-100 bg-white p-8 transition-shadow hover:shadow-card-hover sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
                <svg
                  className="h-7 w-7 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#222]">
                スカウト型
              </h3>
              <p className="mt-1 text-sm font-medium text-primary-500">
                クリエイターを探して直接依頼
              </p>
              <div className="mt-6 space-y-4">
                {[
                  {
                    step: "1",
                    actor: "クリエイター",
                    text: "ポートフォリオ・料金表を掲載",
                  },
                  {
                    step: "2",
                    actor: "企業",
                    text: "検索・比較してクリエイターを選定",
                  },
                  {
                    step: "3",
                    actor: "企業",
                    text: "メッセージで相談・見積もり依頼",
                  },
                  {
                    step: "4",
                    actor: "双方",
                    text: "仮払い → 制作 → 納品 → 検収",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                      {item.step}
                    </div>
                    <div>
                      <span className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] font-bold text-[#828282]">
                        {item.actor}
                      </span>
                      <p className="mt-1 text-sm text-[#4F4F4F]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/creators"
                className="btn-primary mt-8 inline-block w-full text-center text-sm"
              >
                クリエイターを探す
              </Link>
            </div>

            {/* Pattern B: 募集型 */}
            <div className="rounded-[20px] border-2 border-green-100 bg-white p-8 transition-shadow hover:shadow-card-hover sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <svg
                  className="h-7 w-7 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#222]">募集型</h3>
              <p className="mt-1 text-sm font-medium text-green-600">
                案件を掲載してクリエイターを募集
              </p>
              <div className="mt-6 space-y-4">
                {[
                  {
                    step: "1",
                    actor: "企業",
                    text: "案件の要件・予算・納期を掲載",
                  },
                  {
                    step: "2",
                    actor: "クリエイター",
                    text: "案件を閲覧して応募・提案",
                  },
                  {
                    step: "3",
                    actor: "企業",
                    text: "提案を比較してクリエイターを選定",
                  },
                  {
                    step: "4",
                    actor: "双方",
                    text: "仮払い → 制作 → 納品 → 検収",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                      {item.step}
                    </div>
                    <div>
                      <span className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] font-bold text-[#828282]">
                        {item.actor}
                      </span>
                      <p className="mt-1 text-sm text-[#4F4F4F]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/jobs"
                className="mt-8 inline-flex w-full items-center justify-center rounded-pill border-2 border-green-600 bg-white px-8 py-3 text-sm font-bold text-green-600 transition-all duration-200 hover:bg-green-600 hover:text-white"
              >
                案件を探す
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          働き方・料金形態
          ============================== */}
      <section className="bg-[#F8F8F8] py-24">
        <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
              働き方・料金形態
            </h2>
            <p className="mt-4 text-base text-[#828282]">
              フルリモートで完結。柔軟な料金体系で、最適な取引を実現
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                  />
                ),
                title: "フルリモート対応",
                description:
                  "打ち合わせから納品まで完全オンライン。全国どこからでも依頼・受注が可能です。",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                  />
                ),
                title: "明確な料金体系",
                description:
                  "パッケージ料金制で事前に費用を把握。追加費用なしのシンプルな料金設計です。",
                priceExamples: [
                  { label: "SNS動画（1本）", price: "¥15,000〜" },
                  { label: "YouTube編集", price: "¥30,000〜" },
                  { label: "企業VP", price: "¥300,000〜" },
                ],
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                ),
                title: "エスクロー決済",
                description:
                  "仮払い（エスクロー）方式で安心。納品確認後にクリエイターへ報酬が支払われます。",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[15px] bg-white p-8 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
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
                <p className="mt-2 text-sm leading-[170%] text-[#828282]">
                  {item.description}
                </p>
                {item.priceExamples && (
                  <div className="mt-4 space-y-2 rounded-xl bg-[#F8F8F8] p-4">
                    {item.priceExamples.map((ex) => (
                      <div
                        key={ex.label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[#4F4F4F]">{ex.label}</span>
                        <span className="font-bold text-primary-500">
                          {ex.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================
          登録メリット（企業 / クリエイター）
          ============================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
              登録するメリット
            </h2>
            <p className="mt-4 text-base text-[#828282]">
              企業・クリエイター双方にとって価値のあるプラットフォーム
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* 企業側 */}
            <div className="rounded-[20px] bg-[#F8F8F8] p-8 sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-lg font-black text-white">
                B
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#222]">
                企業・クライアントの方
              </h3>
              <ul className="mt-6 space-y-4">
                {[
                  {
                    title: "実績で選べる安心感",
                    desc: "ポートフォリオで過去の作品を確認。スキルが一目でわかります。",
                  },
                  {
                    title: "コスト削減",
                    desc: "制作会社を介さず直接依頼。中間マージンをカットできます。",
                  },
                  {
                    title: "スピーディな発注",
                    desc: "検索→相談→発注がオンラインで完結。最短即日で制作開始。",
                  },
                  {
                    title: "安心の決済システム",
                    desc: "エスクロー方式で納品まで資金が保護されます。",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary-500"
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
                    <div>
                      <p className="text-sm font-bold text-[#222]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-[#828282]">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="btn-primary mt-8 inline-block w-full text-center text-sm"
              >
                企業として登録（無料）
              </Link>
            </div>

            {/* クリエイター側 */}
            <div className="rounded-[20px] bg-[#F8F8F8] p-8 sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#242424] text-lg font-black text-white">
                C
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#222]">
                クリエイターの方
              </h3>
              <ul className="mt-6 space-y-4">
                {[
                  {
                    title: "営業不要で案件獲得",
                    desc: "ポートフォリオを掲載するだけで企業からスカウトが届きます。",
                  },
                  {
                    title: "自分の価格で受注",
                    desc: "料金表を自由に設定。自分のスキルに見合った報酬を得られます。",
                  },
                  {
                    title: "フルリモート対応",
                    desc: "場所を選ばず仕事ができます。全国の企業と取引可能。",
                  },
                  {
                    title: "確実な報酬受取",
                    desc: "エスクロー方式で未払いリスクゼロ。安心して制作に集中できます。",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#222]"
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
                    <div>
                      <p className="text-sm font-bold text-[#222]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-[#828282]">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-pill border-2 border-[#242424] bg-white px-8 py-3 text-sm font-bold text-[#222] transition-all duration-200 hover:bg-[#242424] hover:text-white"
              >
                クリエイターとして登録（無料）
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
          CTA
          ============================== */}
      <section className="bg-[#242424] py-20">
        <div className="mx-auto max-w-container px-6 text-center lg:px-[6.25rem]">
          <h2 className="text-3xl font-bold text-white sm:text-[2.75rem]">
            あなたのプロジェクトを始めましょう
          </h2>
          <p className="mt-4 text-base text-[#828282]">
            無料で会員登録して、今すぐクリエイターを探すか、
            <br className="hidden sm:block" />
            クリエイターとしてポートフォリオを公開しましょう。
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register" className="btn-primary px-10 py-4 text-lg">
              無料で会員登録
            </Link>
            <Link
              href="/creators"
              className="inline-flex items-center justify-center rounded-pill border-2 border-white/30 px-10 py-4 text-lg font-bold text-white transition-all duration-200 hover:bg-white/10"
            >
              クリエイターを見る
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
