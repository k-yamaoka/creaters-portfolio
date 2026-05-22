import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AI_CREATORS, getCreator } from "../../_data/creators";

export async function generateStaticParams() {
  return AI_CREATORS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const creator = getCreator(id);
  if (!creator) return { title: "Not Found" };
  return {
    title: `${creator.name} (${creator.handle}) — AI Creators Hub`,
    description: creator.headline,
  };
}

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = getCreator(id);
  if (!creator) notFound();

  return (
    <>
      {/* Mock banner */}
      <div className="bg-neon-pink/10 border-y border-neon-pink/30 px-4 py-2 text-center">
        <p className="text-xs font-bold text-neon-purple-deep">
          🚀 AIクリエイター特化型モック
          <Link href="/ai-mock" className="ml-3 underline hover:no-underline">
            LPに戻る
          </Link>
          <span className="mx-2 text-ink-muted">|</span>
          <Link
            href="/ai-mock/creators"
            className="underline hover:no-underline"
          >
            クリエイター一覧へ
          </Link>
        </p>
      </div>

      {/* Hero band */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-16 text-white">
        <div className="absolute -left-32 top-0 h-[400px] w-[400px] rounded-full bg-neon-pink opacity-25 blur-[120px]" />
        <div className="absolute -right-20 bottom-0 h-[360px] w-[360px] rounded-full bg-neon-cyan opacity-20 blur-[100px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <nav className="text-[11px] font-bold text-white/60">
            <Link href="/ai-mock" className="hover:text-white">
              AI Creators Hub
            </Link>
            <span className="mx-2">/</span>
            <Link href="/ai-mock/creators" className="hover:text-white">
              クリエイターを探す
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">{creator.name}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[200px_1fr] lg:items-center">
            <div
              className="aspect-square w-40 overflow-hidden rounded-2xl border-4 border-white/20 shadow-[0_0_40px_rgba(255,77,157,0.4)] sm:w-48 lg:w-full"
              style={{ background: creator.avatar }}
            >
              <div className="flex h-full items-center justify-center">
                <span className="text-5xl font-black text-white">
                  {creator.name.charAt(0)}
                </span>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-neon-pink-soft">
                  {creator.specialty}
                </span>
                <span className="rounded-pill bg-white/10 px-3 py-1 text-[10px] font-bold text-white">
                  ★ {creator.rating}
                </span>
                <span className="rounded-pill bg-white/10 px-3 py-1 text-[10px] font-bold text-white">
                  実績 {creator.works}件
                </span>
                <span className="rounded-pill bg-white/10 px-3 py-1 text-[10px] font-bold text-white">
                  {creator.location}
                </span>
              </div>

              <h1 className="mt-4 text-[2rem] font-black leading-tight sm:text-[2.6rem]">
                {creator.name}
              </h1>
              <p className="mt-1 text-base font-bold text-white/70">
                {creator.handle}
              </p>

              <p className="mt-4 text-base font-bold text-white">
                {creator.headline}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="group inline-flex items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-7 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(255,77,157,0.6)]"
                >
                  <span>このクリエイターに依頼</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-pill border-2 border-white/30 bg-white/5 px-7 py-3 text-sm font-bold text-white transition-all hover:border-white/60 hover:bg-white/10"
                >
                  チャット相談
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-paper py-16">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
            {/* Left: profile detail */}
            <div className="space-y-10">
              {/* Bio */}
              <div>
                <p className="eyebrow">プロフィール</p>
                <p className="mt-6 text-base leading-[2] text-ink">
                  {creator.bio}
                </p>
              </div>

              {/* Highlights */}
              <div>
                <p className="eyebrow">強み</p>
                <ul className="mt-6 space-y-3">
                  {creator.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-ink/10 bg-white p-4"
                    >
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-gradient-to-br from-neon-pink to-neon-purple text-xs font-black text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-[1.85] text-ink">
                        {h}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Tools */}
              <div>
                <p className="eyebrow">使用AIツール</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {creator.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-2 rounded-pill border border-ink bg-neon-midnight-deep px-4 py-2 text-sm font-bold text-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-pink" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <p className="eyebrow">得意ジャンル</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {creator.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-pill border-2 border-neon-purple/40 bg-neon-purple/10 px-4 py-2 text-sm font-bold text-neon-purple-deep"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample works */}
              {creator.samples.length > 0 && (
                <div>
                  <p className="eyebrow">実績サンプル</p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {creator.samples.map((s, i) => (
                      <div
                        key={i}
                        className="overflow-hidden rounded-xl border-2 border-ink bg-white shadow-pop"
                      >
                        <div
                          className="relative aspect-video w-full"
                          style={{ background: s.thumbnail }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent">
                            <span className="rounded-full bg-white/95 p-4 text-2xl text-neon-purple-deep">
                              ▶
                            </span>
                          </div>
                          <span className="absolute right-3 top-3 rounded-full bg-neon-pink px-2 py-0.5 text-[10px] font-black text-white">
                            AI生成
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-black text-ink">
                            {s.title}
                          </p>
                          <p className="mt-1 text-xs text-ink-muted">
                            {s.client}
                          </p>
                          <p className="mt-2 inline-block rounded-md bg-neon-cyan/15 px-2 py-1 text-[11px] font-bold text-neon-purple-deep">
                            {s.metrics}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: pricing sidebar (sticky) */}
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="overflow-hidden rounded-xl border-2 border-ink bg-white shadow-pop">
                <div className="bg-neon-midnight-deep p-5 text-white">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neon-cyan">
                    PACKAGES
                  </p>
                  <p className="mt-1 text-lg font-black">料金プラン</p>
                </div>

                <div className="divide-y divide-rule">
                  {creator.packages.map((p, i) => (
                    <div key={p.name} className="p-5">
                      <div className="flex items-baseline justify-between">
                        <p className="text-base font-black text-ink">
                          {p.name}
                        </p>
                        {i === 1 && (
                          <span className="rounded-pill bg-neon-pink px-2 py-0.5 text-[9px] font-black text-white">
                            人気
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-2xl font-black text-neon-purple-deep">
                        ¥{p.price.toLocaleString()}
                      </p>
                      <dl className="mt-4 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">納品物</dt>
                          <dd className="font-bold text-ink">{p.deliverables}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">修正</dt>
                          <dd className="font-bold text-ink">{p.revisions}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">納期</dt>
                          <dd className="font-bold text-ink">{p.duration}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-pill px-4 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 ${
                          i === 1
                            ? "bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_15px_rgba(255,77,157,0.3)]"
                            : "border-2 border-ink bg-paper text-ink hover:bg-ink hover:text-paper"
                        }`}
                      >
                        このプランで依頼する →
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-rule bg-paper-deep p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                    安心の仕組み
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-ink">
                    <li className="flex items-center gap-2">
                      <span className="text-neon-pink">●</span>
                      エスクロー決済
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-neon-cyan">●</span>
                      納品確認後にお支払い
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-neon-purple">●</span>
                      シンプル手数料 15%
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related creators */}
      <section className="bg-paper-deep py-16">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <p className="eyebrow">こんなクリエイターも</p>
          <h2 className="mt-4 text-2xl font-black sm:text-3xl">
            似た領域の<span className="underline-yellow">専門家</span>
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {AI_CREATORS.filter((c) => c.id !== creator.id)
              .slice(0, 4)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/ai-mock/creators/${c.id}`}
                  className="group overflow-hidden rounded-xl border-2 border-ink bg-white shadow-pop transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(42,42,50,1)]"
                >
                  <div
                    className="relative aspect-[4/3] w-full"
                    style={{ background: c.avatar }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-sm font-black text-white">{c.name}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-bold text-ink">
                      {c.headline}
                    </p>
                    <p className="mt-2 text-xs font-black text-neon-purple-deep">
                      ¥{c.priceFrom.toLocaleString()}〜
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
