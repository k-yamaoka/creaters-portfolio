import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  FlowerMark,
  MiniFlower,
  Leaf,
  CloudShape,
  SunMark,
  SparkStar,
  WavyLine,
  HeartMark,
  Blob,
} from "@/components/ui/illustrations";
import { PlayTriangle } from "@/components/ui/illustrations-modern";
import { NeonStar } from "@/components/ui/illustrations-retrowave";

const InfiniteSlider = dynamic(
  () =>
    import("@/components/home/infinite-slider").then((m) => m.InfiniteSlider),
  { loading: () => <div className="h-[280px] bg-paper-deep" /> }
);

export default function HomePage() {
  return (
    <>
      {/* =================================================
          HERO — Modern flat editor at desk
          ================================================= */}
      <section className="relative overflow-hidden bg-paper">
        {/* 背景の装飾 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-10 text-coral-100 opacity-70"
        >
          <Blob size={320} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-10 -top-4 text-accent-200 opacity-80"
        >
          <Blob size={180} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-32 top-8 text-accent-500 animate-float"
        >
          <SunMark size={64} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/3 top-28 text-coral-300 animate-sway"
        >
          <SparkStar size={20} />
        </span>

        <div className="relative mx-auto max-w-container px-6 pb-24 pt-20 lg:px-10 lg:pb-32 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12">
            {/* テキスト */}
            <div className="col-span-12 lg:col-span-6">
              <p className="eyebrow">CREATORS × BUSINESS</p>

              <h1 className="mt-6 text-balance text-[2.4rem] font-black leading-[1.2] tracking-tight text-ink sm:text-[3.4rem] lg:text-[4.25rem]">
                映像で、
                <br />
                <span className="underline-yellow">仕事</span>
                <span className="text-coral-500">と</span>
                <span className="underline-yellow">人</span>
                <span className="text-coral-500">が</span>
                <br />
                出会う場所。
              </h1>

              <p className="mt-8 max-w-xl text-[15px] leading-[2] text-ink-muted">
                企業VP・YouTube・SNS広告・ウェディングまで。
                クリエイターと企業を、まっすぐ・気持ちよく繋ぐ
                <span className="font-bold text-ink">マッチングプラットフォーム</span>
                。<br />
                ポートフォリオで選ぶか、案件を掲載して募るか。あなたに合う方法で。
              </p>

              {/* CTA */}
              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/creators"
                  className="group inline-flex items-center justify-between gap-3 rounded-pill bg-coral-500 px-7 py-4 text-base font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-coral-600 hover:shadow-card"
                >
                  <span>クリエイターを探す</span>
                  <span className="text-accent-300 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/jobs"
                  className="group inline-flex items-center justify-between gap-3 rounded-pill border-2 border-ink bg-paper px-7 py-4 text-base font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
                >
                  <span>案件を探す</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              {/* Stats row */}
              <div className="mt-14 grid grid-cols-2 gap-y-6 lg:grid-cols-4">
                {[
                  { num: "500+", label: "マッチング成立" },
                  { num: "4.9", label: "平均満足度" },
                  { num: "100%", label: "リモート対応" },
                  { num: "¥0", label: "登録料金" },
                ].map((s) => (
                  <div key={s.label} className="px-1">
                    <p className="text-3xl font-black leading-none text-primary-600 sm:text-4xl">
                      {s.num}
                    </p>
                    <p className="mt-2.5 text-[11px] font-bold tracking-[0.1em] text-ink-muted">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* イラスト — ヘッドホンつけて編集中のクリエイター (実画像) */}
            <div className="relative col-span-12 lg:col-span-6">
              <div className="relative mx-auto w-full max-w-2xl">
                {/* メイン画像 */}
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border-2 border-ink bg-paper-deep shadow-pop">
                  <Image
                    src="/hero/editor.png"
                    alt="ヘッドホンを着けて動画編集をする映像クリエイターのイラスト"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                {/* 装飾: 星 (画像外) */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 -top-3 text-accent-500 animate-float"
                >
                  <SparkStar size={34} />
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-3 top-1/3 hidden text-neon-pink animate-sway lg:block"
                >
                  <NeonStar size={22} />
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-6 -bottom-2 hidden rotate-12 text-coral-300 animate-float lg:block"
                >
                  <PlayTriangle size={36} />
                </span>

                {/* 浮かぶ通知バブル */}
                <div className="absolute -top-3 right-6 z-20 rotate-[4deg] rounded-xl border-2 border-ink bg-accent-500 px-3 py-1.5 text-xs font-black text-ink shadow-pop">
                  新着案件 +3
                </div>
                <div className="absolute -bottom-3 left-6 z-20 rotate-[-4deg] rounded-xl border-2 border-ink bg-white px-3 py-1.5 text-xs font-black shadow-pop">
                  <p className="text-ink">納品完了！</p>
                  <p className="text-coral-600">★ 5.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* マーキー — タグライン */}
        <div className="relative overflow-hidden border-y-2 border-ink bg-accent-500 py-4 text-ink">
          <div className="flex animate-marquee whitespace-nowrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="mx-6 inline-flex items-center gap-4 text-xl font-black tracking-tight"
              >
                Corporate VP
                <span className="text-primary-500">
                  <MiniFlower size={18} />
                </span>
                YouTube
                <span className="text-primary-500">
                  <MiniFlower size={18} />
                </span>
                SNS Ads
                <span className="text-primary-500">
                  <MiniFlower size={18} />
                </span>
                Wedding
                <span className="text-primary-500">
                  <MiniFlower size={18} />
                </span>
                Documentary
                <span className="text-primary-500">
                  <MiniFlower size={18} />
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          Showreel slider
          ================================================= */}
      <InfiniteSlider />

      {/* =================================================
          Two methods — Scout vs Open call
          ================================================= */}
      <section className="relative overflow-hidden bg-paper py-28">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 top-32 text-leaf opacity-60"
        >
          <Leaf size={140} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-10 bottom-20 text-accent-200"
        >
          <Blob size={180} />
        </span>

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <p className="eyebrow justify-center">2つの出会い方</p>
            <h2 className="mt-6 text-[2.25rem] font-black leading-[1.25] tracking-tight sm:text-[3rem] lg:text-[3.75rem]">
              <span className="underline-yellow">探す</span>か、
              <span className="underline-yellow">募る</span>か。
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-[2] text-ink-muted">
              スカウト型と募集型。あなたのプロジェクトに合った方法で、
              <br className="hidden sm:block" />
              クリエイターと企業がフラットに繋がります。
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {/* スカウト型 */}
            <article className="group relative overflow-hidden rounded-xl border-2 border-ink bg-white p-8 shadow-pop transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(46,108,160,1)] sm:p-10">
              <span
                aria-hidden
                className="absolute -right-8 -top-8 text-accent-300 opacity-50 transition-transform group-hover:rotate-12"
              >
                <FlowerMark size={140} />
              </span>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-pill bg-primary-500 text-white">
                    <span className="text-xl font-black">01</span>
                  </span>
                  <span className="rounded-pill bg-accent-100 px-3 py-1 text-xs font-bold text-accent-800">
                    Method A
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black sm:text-3xl">
                  スカウト型
                </h3>
                <p className="mt-2 text-sm font-bold text-primary-600">
                  クリエイターを探して直接依頼する
                </p>

                <ol className="mt-8 space-y-3">
                  {[
                    {
                      actor: "Creator",
                      text: "ポートフォリオ・料金表を掲載",
                    },
                    {
                      actor: "Client",
                      text: "検索・比較してクリエイターを選定",
                    },
                    {
                      actor: "Client",
                      text: "メッセージで相談・見積もり依頼",
                    },
                    {
                      actor: "Both",
                      text: "仮払い → 制作 → 納品 → 検収",
                    },
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-md bg-paper-deep/60 px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-primary-500 text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="inline-flex shrink-0 rounded-pill bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-600">
                        {item.actor}
                      </span>
                      <span className="text-sm text-ink">{item.text}</span>
                    </li>
                  ))}
                </ol>

                <Link
                  href="/creators"
                  className="group/btn mt-8 inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper px-5 py-2.5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
                >
                  クリエイターを探す
                  <span className="transition-transform group-hover/btn:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </article>

            {/* 募集型 */}
            <article className="group relative overflow-hidden rounded-xl border-2 border-ink bg-white p-8 shadow-pop transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(247,205,71,1)] sm:p-10">
              <span
                aria-hidden
                className="absolute -right-8 -top-8 text-primary-300 opacity-50 transition-transform group-hover:rotate-12"
              >
                <FlowerMark size={140} />
              </span>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-pill bg-accent-500 text-ink">
                    <span className="text-xl font-black">02</span>
                  </span>
                  <span className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">
                    Method B
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black sm:text-3xl">
                  募集型
                </h3>
                <p className="mt-2 text-sm font-bold text-primary-600">
                  案件を掲載してクリエイターを募る
                </p>

                <ol className="mt-8 space-y-3">
                  {[
                    {
                      actor: "Client",
                      text: "案件の要件・予算・納期を掲載",
                    },
                    {
                      actor: "Creator",
                      text: "案件を閲覧して応募・提案",
                    },
                    {
                      actor: "Client",
                      text: "提案を比較してクリエイターを選定",
                    },
                    {
                      actor: "Both",
                      text: "仮払い → 制作 → 納品 → 検収",
                    },
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-md bg-paper-deep/60 px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-accent-500 text-[11px] font-bold text-ink">
                        {i + 1}
                      </span>
                      <span className="inline-flex shrink-0 rounded-pill bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-600">
                        {item.actor}
                      </span>
                      <span className="text-sm text-ink">{item.text}</span>
                    </li>
                  ))}
                </ol>

                <Link
                  href="/jobs"
                  className="group/btn mt-8 inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-paper px-5 py-2.5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
                >
                  案件を探す
                  <span className="transition-transform group-hover/btn:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* =================================================
          Working style / pricing
          ================================================= */}
      <section className="relative overflow-hidden bg-paper-deep py-28">
        <span
          aria-hidden
          className="pointer-events-none absolute right-10 top-10 text-accent-400 animate-sway"
        >
          <FlowerMark size={90} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-12 bottom-12 text-primary-300 animate-wiggle"
        >
          <MiniFlower size={40} />
        </span>

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4">
              <p className="eyebrow">あんしんの仕組み</p>
              <h2 className="mt-6 text-[2.25rem] font-black leading-[1.2] tracking-tight sm:text-[3rem]">
                <span className="underline-yellow">働き方</span>と
                <br />
                料金のはなし。
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-[2] text-ink-muted">
                すべてリモート完結。料金はパッケージ制で、
                発注前に総額が見える。あとから増えない、シンプルな仕組み。
              </p>
              <span aria-hidden className="mt-6 block text-primary-500">
                <WavyLine size={180} />
              </span>
            </div>

            <div className="col-span-12 lg:col-span-8">
              <dl className="space-y-4">
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
                    className="rounded-xl border border-ink/10 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-8"
                  >
                    <div className="flex items-start gap-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-accent-100 text-base font-black text-primary-600">
                        {item.no}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-xl font-black text-ink sm:text-2xl">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-[1.9] text-ink-muted">
                          {item.body}
                        </p>
                        {item.extras && (
                          <ul className="mt-4 grid gap-2 sm:max-w-md">
                            {item.extras.map(([label, price]) => (
                              <li
                                key={label}
                                className="flex items-baseline justify-between rounded-md bg-paper-deep px-3 py-2 text-sm"
                              >
                                <span className="text-ink-muted">{label}</span>
                                <span className="font-black text-primary-600">
                                  {price}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          Benefits — For business / creator
          ================================================= */}
      <section className="relative overflow-hidden bg-paper py-28">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 text-accent-500 animate-float"
        >
          <SunMark size={52} />
        </span>

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <p className="eyebrow justify-center">登録するメリット</p>
            <h2 className="mt-6 text-[2.25rem] font-black leading-[1.2] tracking-tight sm:text-[3rem] lg:text-[3.75rem]">
              <span className="text-primary-500">登録</span>するだけで、
              <br />
              <span className="underline-yellow">仕事の選択肢</span>が広がる。
            </h2>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
            {/* 企業 */}
            <article className="group relative overflow-hidden rounded-xl bg-sky p-8 sm:p-10">
              <span
                aria-hidden
                className="absolute -right-8 top-6 text-primary-500/30"
              >
                <CloudShape size={180} />
              </span>
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="rounded-pill bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary-700">
                    For Business
                  </span>
                  <span aria-hidden className="text-primary-500">
                    <HeartMark size={20} />
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-ink sm:text-3xl">
                  企業・クライアントの方
                </h3>

                <ol className="mt-8 space-y-5">
                  {[
                    [
                      "実績で選べる安心感",
                      "ポートフォリオで過去の作品を確認。スキルが一目でわかる。",
                    ],
                    [
                      "コスト削減",
                      "制作会社を介さず直接依頼。中間マージンをカット。",
                    ],
                    [
                      "スピーディな発注",
                      "検索→相談→発注がオンラインで完結。最短即日で制作開始。",
                    ],
                    [
                      "安心の決済システム",
                      "エスクロー方式で納品まで資金が保護される。",
                    ],
                  ].map(([title, desc], i) => (
                    <li key={title} className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-primary-500 text-sm font-black text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-black text-ink">{title}</p>
                        <p className="mt-1 text-sm leading-[1.85] text-ink-muted">
                          {desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Link
                  href="/register"
                  className="group/btn mt-8 inline-flex items-center gap-2 rounded-pill bg-primary-500 px-6 py-3 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary-600"
                >
                  企業として登録（無料）
                  <span className="transition-transform group-hover/btn:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </article>

            {/* クリエイター */}
            <article className="group relative overflow-hidden rounded-xl bg-accent-100 p-8 sm:p-10">
              <span
                aria-hidden
                className="absolute -right-8 top-6 text-accent-500/40 animate-sway"
              >
                <FlowerMark size={180} />
              </span>
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="rounded-pill bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-800">
                    For Creator
                  </span>
                  <span aria-hidden className="text-accent-700">
                    <SparkStar size={20} />
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-ink sm:text-3xl">
                  クリエイターの方
                </h3>

                <ol className="mt-8 space-y-5">
                  {[
                    [
                      "営業不要で案件獲得",
                      "ポートフォリオを掲載するだけで企業からスカウトが届く。",
                    ],
                    [
                      "自分の価格で受注",
                      "料金表を自由に設定。スキルに見合った報酬を得られる。",
                    ],
                    [
                      "フルリモート対応",
                      "場所を選ばず仕事ができる。全国の企業と取引可能。",
                    ],
                    [
                      "確実な報酬受取",
                      "エスクロー方式で未払いリスクゼロ。制作に集中できる。",
                    ],
                  ].map(([title, desc], i) => (
                    <li key={title} className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-accent-500 text-sm font-black text-ink">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-black text-ink">{title}</p>
                        <p className="mt-1 text-sm leading-[1.85] text-ink-muted">
                          {desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Link
                  href="/register"
                  className="group/btn mt-8 inline-flex items-center gap-2 rounded-pill bg-ink px-6 py-3 text-sm font-bold text-paper shadow-soft transition-all hover:-translate-y-0.5 hover:bg-primary-600"
                >
                  クリエイターとして登録（無料）
                  <span className="transition-transform group-hover/btn:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* =================================================
          Closing CTA — bright & inviting
          ================================================= */}
      <section className="relative overflow-hidden bg-primary-500 py-28 text-white">
        {/* デコレーション */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-8 text-accent-400 opacity-90"
        >
          <Blob size={220} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 text-primary-700 opacity-60"
        >
          <Blob size={280} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-12 top-16 text-accent-500 animate-float"
        >
          <SunMark size={60} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-20 top-20 text-white/40"
        >
          <SparkStar size={32} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/3 bottom-16 text-accent-300 animate-wiggle"
        >
          <FlowerMark size={64} />
        </span>

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-9">
              <p className="inline-flex items-center gap-2 text-[12px] font-bold tracking-[0.16em] text-accent-300">
                <span className="h-0.5 w-6 rounded-full bg-accent-300" />
                START NOW
              </p>
              <h2 className="mt-6 text-balance text-[2.25rem] font-black leading-[1.15] sm:text-[3.5rem] lg:text-[5rem]">
                さあ、はじめよう。
                <br />
                映像が、
                <span className="text-accent-400">仕事を変える</span>。
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-3">
              <p className="text-sm leading-[2] text-white/80">
                無料で会員登録して、いますぐクリエイターを探すか、
                ポートフォリオを公開しよう。
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-between gap-3 rounded-pill bg-accent-500 px-8 py-4 text-base font-black text-ink shadow-soft transition-all hover:-translate-y-0.5 hover:bg-accent-400"
            >
              <span>無料で会員登録</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/creators"
              className="group inline-flex items-center justify-between gap-3 rounded-pill border-2 border-white/60 px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
            >
              <span>クリエイターを見る</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
