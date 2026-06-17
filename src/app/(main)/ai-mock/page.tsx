import Link from "next/link";
import type { Metadata } from "next";
import {
  SparkStar,
  FlowerMark,
  Blob,
  SunMark,
} from "@/components/ui/illustrations";
import { NeonStar, RetroSun } from "@/components/ui/illustrations-retrowave";
import { AI_CREATORS } from "./_data/creators";

export const metadata: Metadata = {
  title: "AI Creators Hub — SNS広告動画を、AIで量産する",
  description:
    "Sora・Veo・Runway・Midjourneyを使いこなすAIクリエイターに、SNS広告動画の制作を依頼できる専門プラットフォーム",
};

const AI_TOOLS = [
  { name: "Sora 2", category: "Video", color: "from-neon-pink to-neon-purple" },
  { name: "Veo 3", category: "Video", color: "from-neon-cyan to-neon-purple" },
  {
    name: "Runway Gen-4",
    category: "Video",
    color: "from-neon-purple to-neon-magenta",
  },
  {
    name: "Kling 2.x",
    category: "Video",
    color: "from-neon-cyan to-neon-pink",
  },
  {
    name: "Midjourney",
    category: "Image",
    color: "from-neon-sunset to-neon-pink",
  },
  {
    name: "ElevenLabs",
    category: "Audio",
    color: "from-neon-purple to-neon-cyan",
  },
  { name: "Suno", category: "Music", color: "from-neon-magenta to-neon-sunset" },
  {
    name: "Topaz",
    category: "Upscale",
    color: "from-neon-cyan to-neon-purple",
  },
];

export default function AiMockHome() {
  const featuredCreators = AI_CREATORS.slice(0, 4);

  return (
    <>
      {/* =================================================
          BANNER — Mock notice
          ================================================= */}
      <div className="bg-neon-pink/10 border-y border-neon-pink/30 px-4 py-2 text-center">
        <p className="text-xs font-bold text-neon-purple-deep">
          🚀 これは「AIクリエイター特化型」のデザインモックです（社内検討用）
          <Link
            href="/"
            className="ml-3 underline hover:no-underline"
          >
            現行サイトに戻る
          </Link>
        </p>
      </div>

      {/* =================================================
          HERO — Dark midnight neon
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep text-white">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(157,92,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        {/* Glow accents */}
        <div className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-neon-pink opacity-30 blur-[120px]" />
        <div className="absolute -right-24 top-32 h-[400px] w-[400px] rounded-full bg-neon-cyan opacity-25 blur-[100px]" />
        <div className="absolute left-1/2 -bottom-32 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-neon-purple opacity-20 blur-[100px]" />

        <span
          aria-hidden
          className="pointer-events-none absolute right-12 top-16 text-neon-pink animate-float"
        >
          <NeonStar size={36} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-12 bottom-24 text-neon-cyan animate-sway"
        >
          <SparkStar size={28} />
        </span>

        <div className="relative mx-auto max-w-container px-6 pb-28 pt-20 lg:px-10 lg:pb-36 lg:pt-28">
          <div className="grid grid-cols-12 gap-8 lg:gap-12">
            <div className="col-span-12 lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-pink-soft">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-pink" />
                AI CREATORS PLATFORM
              </p>

              <h1 className="mt-8 text-[2.4rem] font-black leading-[1.1] tracking-tight sm:text-[3.6rem] lg:text-[4.8rem]">
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                  SNS広告動画
                </span>
                を、
                <br />
                <span className="text-white">AIで量産</span>
                <span className="text-neon-pink">する。</span>
              </h1>

              <p className="mt-8 max-w-xl text-[15px] leading-[2] text-white/70">
                Sora・Veo・Runwayを使いこなすクリエイターに、
                <span className="font-bold text-white">
                  Meta/TikTok広告動画
                </span>
                を依頼できる専門プラットフォーム。
                <br />
                撮影不要・最短2日納品・AB案を10倍量産。
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/ai-mock/creators"
                  className="group inline-flex items-center justify-between gap-3 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-7 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(255,77,157,0.6)]"
                >
                  <span>AIクリエイターを探す</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="#how"
                  className="group inline-flex items-center justify-between gap-3 rounded-pill border-2 border-white/30 bg-white/5 px-7 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
                >
                  <span>仕組みを見る</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-14 grid grid-cols-2 gap-y-6 lg:grid-cols-4">
                {[
                  { num: "2日", label: "最短納品", color: "text-neon-pink" },
                  { num: "1/5", label: "従来比コスト", color: "text-neon-cyan" },
                  { num: "10×", label: "クリエイティブ量", color: "text-neon-purple" },
                  { num: "0円", label: "撮影費", color: "text-neon-sunset" },
                ].map((s) => (
                  <div key={s.label}>
                    <p
                      className={`text-3xl font-black leading-none sm:text-4xl ${s.color}`}
                    >
                      {s.num}
                    </p>
                    <p className="mt-2.5 text-[11px] font-bold tracking-[0.1em] text-white/60">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side — Sample creative grid */}
            <div className="relative col-span-12 lg:col-span-5">
              <div className="relative grid grid-cols-2 gap-3">
                {[
                  "from-neon-pink to-neon-purple",
                  "from-neon-cyan to-neon-purple",
                  "from-neon-sunset to-neon-pink",
                  "from-neon-purple to-neon-cyan",
                ].map((g, i) => (
                  <div
                    key={i}
                    className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-white/10 shadow-[0_0_24px_rgba(157,92,255,0.3)]"
                    style={{
                      transform: `translateY(${i % 2 === 0 ? "-12px" : "12px"})`,
                    }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${g}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neon-midnight-deep/80 to-transparent" />
                    <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white">
                      <p className="opacity-70">Gen by</p>
                      <p>
                        {["Sora 2", "Runway", "Veo 3", "Kling"][i]}
                      </p>
                    </div>
                    <div className="absolute right-2 top-2 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                      AI
                    </div>
                  </div>
                ))}
              </div>
              {/* Floating badge */}
              <div className="absolute -left-4 -top-4 rotate-[-6deg] rounded-xl border-2 border-neon-pink bg-neon-midnight-deep px-3 py-1.5 text-xs font-black text-neon-pink shadow-[0_0_20px_rgba(255,77,157,0.5)]">
                AB案 +27
              </div>
              <div className="absolute -bottom-2 -right-2 rotate-[5deg] rounded-xl border-2 border-neon-cyan bg-neon-midnight-deep px-3 py-1.5 text-xs font-black text-neon-cyan shadow-[0_0_20px_rgba(77,213,247,0.5)]">
                CTR 2.3x
              </div>
            </div>
          </div>
        </div>

        {/* Marquee — AI tools */}
        <div className="relative overflow-hidden border-y border-neon-purple/40 bg-neon-midnight py-4">
          <div className="flex animate-marquee whitespace-nowrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="mx-6 inline-flex items-center gap-4 text-lg font-black tracking-tight text-white"
              >
                <span className="text-neon-pink">Sora 2</span>
                <span className="text-neon-purple">×</span>
                <span className="text-neon-cyan">Veo 3</span>
                <span className="text-neon-purple">×</span>
                <span className="text-neon-pink">Runway</span>
                <span className="text-neon-purple">×</span>
                <span className="text-neon-sunset">Midjourney</span>
                <span className="text-neon-purple">×</span>
                <span className="text-neon-cyan">Kling</span>
                <span className="text-neon-purple">×</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          WHY AI VIDEO — 3 reasons
          ================================================= */}
      <section className="relative overflow-hidden bg-paper py-28">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 top-32 text-neon-pink/20"
        >
          <Blob size={200} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-10 bottom-24 text-neon-cyan/30"
        >
          <Blob size={160} />
        </span>

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <p className="eyebrow justify-center">なぜAI動画なのか</p>
            <h2 className="mt-6 text-[2.25rem] font-black leading-[1.2] tracking-tight sm:text-[3rem] lg:text-[3.75rem]">
              <span className="underline-yellow">広告クリエイティブ</span>は、
              <br />
              量と速さで決まる時代。
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-[2] text-ink-muted">
              Meta/TikTok広告で勝つには、AB案を高速で回せることが必須。
              <br />
              AIクリエイターなら、撮影なし・低コストで、毎週新しいクリエイティブを生み出せます。
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {[
              {
                no: "01",
                title: "撮影費・人件費ゼロ",
                body: "ロケ・スタジオ・出演者・機材費すべて不要。AI生成だけで完結。従来制作の1/5のコストで同等品質を実現。",
                accent: "bg-neon-pink",
                badge: "Cost",
              },
              {
                no: "02",
                title: "AB案を10倍量産",
                body: "1日10本の高速イテレーション。広告効果を見ながら毎週新クリエイティブを投入。勝ちパターンを発見しやすい。",
                accent: "bg-neon-cyan",
                badge: "Speed",
              },
              {
                no: "03",
                title: "クリエイターの専門知識",
                body: "プロンプト力・ツール選定・ブランド整合性は人間の判断。「AI使うだけ」のフリーランスとは段違いの仕上がり。",
                accent: "bg-neon-purple",
                badge: "Quality",
              },
            ].map((item) => (
              <article
                key={item.no}
                className="group relative overflow-hidden rounded-xl border-2 border-ink bg-white p-8 shadow-pop transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(42,42,50,1)] sm:p-10"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-pill text-white ${item.accent}`}
                  >
                    <span className="text-base font-black">{item.no}</span>
                  </span>
                  <span className="rounded-pill bg-neon-midnight-deep px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-black sm:text-[1.7rem]">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-[2] text-ink-muted">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          Featured creators
          ================================================= */}
      <section className="relative overflow-hidden bg-paper-deep py-28">
        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">注目のAIクリエイター</p>
              <h2 className="mt-6 text-[2.25rem] font-black leading-[1.2] tracking-tight sm:text-[3rem]">
                厳選された、<span className="underline-yellow">専門家</span>たち。
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-[2] text-ink-muted">
                各クリエイターは「使うAIツール」「得意ジャンル」「料金レンジ」が明確。
                <br />
                プロンプト力だけでなく、広告ディレクション力で選ばれた精鋭。
              </p>
            </div>
            <Link
              href="/ai-mock/creators"
              className="group inline-flex items-center gap-2 rounded-pill border-2 border-ink bg-white px-5 py-2.5 text-sm font-bold text-ink transition-all hover:-translate-y-0.5 hover:bg-ink/5 hover:text-ink"
            >
              すべて見る ({AI_CREATORS.length}名)
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredCreators.map((c) => (
              <Link
                key={c.id}
                href={`/ai-mock/creators/${c.id}`}
                className="group block overflow-hidden rounded-xl border-2 border-ink bg-white shadow-pop transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(42,42,50,1)]"
              >
                <div
                  className="relative aspect-[4/3] w-full"
                  style={{ background: c.avatar }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black text-neon-purple-deep">
                    AI
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-base font-black text-white">{c.name}</p>
                    <p className="text-[11px] font-bold text-white/80">
                      {c.handle}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-bold text-ink">
                    {c.headline}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.tools.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="rounded-full bg-neon-midnight-deep px-2 py-0.5 text-[10px] font-bold text-white"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      from
                    </span>
                    <span className="text-base font-black text-neon-purple-deep">
                      ¥{c.priceFrom.toLocaleString()}〜
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          AI tools we support
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-28 text-white">
        <div className="absolute -left-32 top-12 h-[400px] w-[400px] rounded-full bg-neon-purple opacity-25 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-neon-cyan opacity-20 blur-[100px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-cyan">
              SUPPORTED AI TOOLS
            </p>
            <h2 className="mt-6 text-[2.25rem] font-black leading-[1.2] tracking-tight sm:text-[3rem] lg:text-[3.75rem]">
              主要AIツール、
              <br />
              <span className="bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent">
                すべて対応。
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-[2] text-white/70">
              最新のAI動画生成・画像生成・音声合成ツールに精通したクリエイターが在籍。
              <br />
              ツール変動の早いAI業界でも、常に最適な選択肢を提供。
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AI_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className={`group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${tool.color} p-6 transition-all hover:scale-105`}
              >
                <div className="absolute inset-0 bg-neon-midnight-deep/40" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {tool.category}
                  </p>
                  <p className="mt-2 text-xl font-black text-white">
                    {tool.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          Pricing — Packaged plans
          ================================================= */}
      <section className="relative overflow-hidden bg-paper py-28">
        <span
          aria-hidden
          className="pointer-events-none absolute right-12 top-20 text-accent-400 animate-sway"
        >
          <FlowerMark size={70} />
        </span>

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <p className="eyebrow justify-center">パッケージ料金</p>
            <h2 className="mt-6 text-[2.25rem] font-black leading-[1.2] tracking-tight sm:text-[3rem] lg:text-[3.75rem]">
              発注前に
              <span className="underline-yellow">総額が見える</span>。
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-sm leading-[2] text-ink-muted">
              追加費用なし。シンプルな3プラン。
              <br />
              SNS広告動画の標準パッケージで、すぐに見積もり判断できる。
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {[
              {
                name: "ライト",
                price: "30,000",
                tag: "お試し向け",
                features: [
                  "縦型15秒動画 × 3本",
                  "AB案バリエーション",
                  "修正2回まで",
                  "3営業日納品",
                ],
                style: "bg-white border-ink",
                priceColor: "text-ink",
              },
              {
                name: "スタンダード",
                price: "100,000",
                tag: "もっとも人気",
                features: [
                  "縦型15-30秒動画 × 10本",
                  "AB案 + 派生バリエーション",
                  "修正5回まで",
                  "1週間納品",
                  "効果分析レポート",
                ],
                style:
                  "bg-neon-midnight-deep border-neon-pink text-white shadow-[0_0_40px_rgba(255,77,157,0.3)]",
                priceColor: "text-neon-pink",
                featured: true,
              },
              {
                name: "プロ",
                price: "300,000",
                tag: "月次運用",
                features: [
                  "縦型動画 30本以上",
                  "ABテスト設計込み",
                  "修正無制限",
                  "2週間納品",
                  "月次戦略MTG",
                  "クリエイターと直接やり取り",
                ],
                style: "bg-white border-ink",
                priceColor: "text-ink",
              },
            ].map((plan) => (
              <article
                key={plan.name}
                className={`relative overflow-hidden rounded-xl border-2 p-8 transition-all hover:-translate-y-1 ${plan.style} ${
                  plan.featured ? "lg:-translate-y-4" : ""
                }`}
              >
                {plan.featured && (
                  <div className="absolute right-6 top-6 rounded-pill bg-neon-pink px-3 py-1 text-[10px] font-black text-white">
                    {plan.tag}
                  </div>
                )}
                {!plan.featured && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    {plan.tag}
                  </p>
                )}
                <h3
                  className={`mt-3 text-2xl font-black ${
                    plan.featured ? "text-white" : "text-ink"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-sm">¥</span>
                  <span
                    className={`text-5xl font-black tracking-tight ${plan.priceColor}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-xs ${plan.featured ? "text-white/60" : "text-ink-muted"}`}
                  >
                    〜
                  </span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-sm ${
                        plan.featured ? "text-white/90" : "text-ink"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold leading-4 ${
                          plan.featured
                            ? "bg-neon-pink text-white"
                            : "bg-accent-500 text-ink"
                        }`}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/ai-mock/creators"
                  className={`mt-8 inline-flex w-full items-center justify-between gap-2 rounded-pill px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                    plan.featured
                      ? "bg-neon-pink text-white hover:bg-neon-pink-soft"
                      : "border-2 border-ink bg-paper text-ink hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  <span>このプランで選ぶ</span>
                  <span>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          How it works
          ================================================= */}
      <section id="how" className="relative overflow-hidden bg-paper-deep py-28">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <p className="eyebrow justify-center">制作フロー</p>
            <h2 className="mt-6 text-[2.25rem] font-black leading-[1.2] tracking-tight sm:text-[3rem]">
              依頼から納品まで<span className="underline-yellow">最短2日</span>。
            </h2>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-4">
            {[
              {
                step: "STEP 1",
                title: "クリエイター選択",
                body: "ツール・ジャンル・料金で絞り込み、ポートフォリオを見て選定",
              },
              {
                step: "STEP 2",
                title: "ヒアリング",
                body: "商品・ブランド・ターゲットをチャットで共有(15分〜30分)",
              },
              {
                step: "STEP 3",
                title: "AI生成 × 編集",
                body: "クリエイターがAIで複数案を生成し、最適な編集で仕上げ",
              },
              {
                step: "STEP 4",
                title: "納品 × 修正",
                body: "MP4形式で納品。修正は契約プラン内で対応",
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="relative rounded-xl border-2 border-ink bg-white p-6 shadow-pop"
              >
                <span className="absolute -left-3 -top-3 inline-flex h-10 w-10 items-center justify-center rounded-pill bg-gradient-to-br from-neon-pink to-neon-purple text-sm font-black text-white shadow-[0_0_15px_rgba(255,77,157,0.5)]">
                  {i + 1}
                </span>
                <p className="text-[10px] font-bold tracking-[0.16em] text-neon-purple-deep">
                  {s.step}
                </p>
                <h3 className="mt-3 text-lg font-black">{s.title}</h3>
                <p className="mt-2 text-sm leading-[1.85] text-ink-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          Closing CTA
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-28 text-white">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-neon-pink opacity-30 blur-[140px]" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-neon-cyan opacity-25 blur-[120px]" />

        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 text-neon-pink animate-float"
        >
          <RetroSun size={70} />
        </span>

        <div className="relative mx-auto max-w-container px-6 text-center lg:px-10">
          <p className="inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-cyan">
            START NOW
          </p>
          <h2 className="mt-8 text-balance text-[2.5rem] font-black leading-[1.1] sm:text-[3.5rem] lg:text-[5rem]">
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              AIで、広告動画を
            </span>
            <br />
            次のレベルへ。
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-sm leading-[2] text-white/70">
            まずはクリエイターを見てみる。
            プロフィール閲覧は無料、依頼前にチャット相談もできます。
          </p>

          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/ai-mock/creators"
              className="group inline-flex items-center justify-between gap-3 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-8 py-4 text-base font-black text-white shadow-[0_0_30px_rgba(255,77,157,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_rgba(255,77,157,0.7)]"
            >
              <span>AIクリエイターを探す</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/"
              className="group inline-flex items-center justify-between gap-3 rounded-pill border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              <span>現行サイトに戻る</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
