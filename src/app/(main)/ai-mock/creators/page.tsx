import Link from "next/link";
import type { Metadata } from "next";
import { AI_CREATORS } from "../_data/creators";
import { CreatorsFilter } from "./creators-filter";

export const metadata: Metadata = {
  title: "AIクリエイターを探す — AI Creators Hub",
  description:
    "Sora・Veo・Runwayを使いこなすAIクリエイターを、ツール・ジャンル・料金で検索",
};

export default function AiCreatorsListPage() {
  return (
    <>
      {/* Mock banner */}
      <div className="bg-aimovie-ember-500/10 border-y border-aimovie-ember-500/30 px-4 py-2 text-center">
        <p className="text-xs font-bold text-aimovie-navy-900">
          🚀 AIクリエイター特化型モック
          <Link href="/ai-mock" className="ml-3 underline hover:no-underline">
            LPに戻る
          </Link>
          <span className="mx-2 text-ink-muted">|</span>
          <Link href="/" className="underline hover:no-underline">
            現行サイトへ
          </Link>
        </p>
      </div>

      {/* Header band */}
      <section className="relative overflow-hidden bg-aimovie-navy-950 py-16 text-white">
        <div className="absolute -left-32 top-0 h-[300px] w-[300px] rounded-full bg-aimovie-ember-500 opacity-25 blur-[100px]" />
        <div className="absolute -right-20 bottom-0 h-[280px] w-[280px] rounded-full bg-aimovie-navy-500 opacity-20 blur-[100px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <p className="inline-flex items-center gap-2 rounded-pill border border-aimovie-ember-500/40 bg-aimovie-ember-500/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-aimovie-ember-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-aimovie-ember-500" />
            AI CREATORS
          </p>
          <h1 className="mt-6 text-[2rem] font-black leading-[1.2] sm:text-[3rem]">
            <span className="bg-gradient-to-r from-aimovie-ember-500 via-aimovie-navy-700 to-aimovie-ivory-300 bg-clip-text text-transparent">
              専門家
            </span>
            を、ツールから選ぶ。
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-[2] text-white/70">
            {AI_CREATORS.length}名のAIクリエイターが登録中。
            使用ツール・得意ジャンル・料金で絞り込めます。
          </p>
        </div>
      </section>

      {/* Filter & list */}
      <section className="bg-paper py-16">
        <div className="mx-auto max-w-container px-6 lg:px-10">
          <CreatorsFilter creators={AI_CREATORS} />
        </div>
      </section>
    </>
  );
}
