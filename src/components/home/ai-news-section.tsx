import { ExternalLink } from "lucide-react";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import { getCachedAiNews, type AiNewsItem } from "@/lib/ai-news";
import { AiNewsThumb } from "./ai-news-thumb";

/**
 * TOP LP 内: 「生成AI 動画」ニュースセクション (Server Component)。
 *
 * データ:
 *  - getCachedAiNews() で unstable_cache から 24 時間キャッシュ済み結果
 *  - 各アイテムは og:title と og:image URL のみ (本文/リード文は取得しない)
 *
 * UI:
 *  - 4 列 × 2 行 (計 8 件、モバイル 1 列)
 *  - 各カード: サムネ + 記事タイトル + 出典 / 日付
 *  - <a target="_blank" rel="noopener noreferrer"> で元記事へ
 *
 * 著作権配慮:
 *  - サムネは <img src> で og:image URL を直参照 (DL/保存しない)
 *  - 記事本文は表示しない (タイトルのみ)
 *  - 各カードで出典を明示、原文リンクを主要動線に
 */

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Google News RSS の title は "記事タイトル - ソース名" の形式で返ってくる
 * ことが多い。末尾の "- 〇〇" を出典表示に、残りをタイトルに分離する。
 */
function splitTitle(raw: string): { title: string; source: string | null } {
  const m = raw.match(/^(.+?)\s+-\s+([^-]+)$/);
  if (m) return { title: m[1].trim(), source: m[2].trim() };
  return { title: raw.trim(), source: null };
}

function NewsCard({ item }: { item: AiNewsItem }) {
  const { title, source } = splitTitle(item.title);
  const publishedLabel = formatDate(item.publishedAt);
  const displaySource = source ?? item.sourceName;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-ink/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-ink/25 hover:shadow-md"
      aria-label={`外部サイトを開く: ${title}`}
    >
      <div className="relative aspect-video overflow-hidden bg-ink/[0.04]">
        <AiNewsThumb src={item.imageUrl} alt={title} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="body-jp line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-sand">
          {title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex min-w-0 items-center gap-2 text-[10px] text-ink/50">
            {displaySource && (
              <span className="truncate font-mono uppercase tracking-widest">
                {displaySource}
              </span>
            )}
            {publishedLabel && (
              <>
                {displaySource && <span aria-hidden>·</span>}
                <span className="shrink-0 font-mono">{publishedLabel}</span>
              </>
            )}
          </div>
          <ExternalLink
            size={11}
            strokeWidth={1.5}
            className="shrink-0 text-ink/40 transition-colors group-hover:text-sand"
            aria-hidden
          />
        </div>
      </div>
    </a>
  );
}

export async function AiNewsSection() {
  const items = await getCachedAiNews();

  // 取得失敗 / 0 件のときはセクション自体を表示しない (空 UI で LP のリズムを乱さない)
  if (items.length === 0) return null;

  return (
    <section className="relative bg-paper text-ink">
      <div className="relative mx-auto max-w-wide px-gutter py-section-y-sm lg:py-section-y">
        <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
          <RevealOnScroll delay={0}>
            <p className="eyebrow-mono">
              (05.5 — News)
              <span className="ml-2 text-ink/35">／ 最新ニュース</span>
            </p>
          </RevealOnScroll>
          <div>
            <RevealOnScroll delay={80}>
              <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-ink">
                Now in{" "}
                <span className="italic text-sand">generative video.</span>
              </h2>
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <p className="body-jp mt-8 max-w-prose-jp text-ink/70">
                生成 AI 動画に関する最新ニュース。各種メディアの見出しを毎日
                自動収集しています。カードをクリックすると元記事へ遷移します。
              </p>
            </RevealOnScroll>
          </div>
        </div>

        <RevealOnScroll
          delay={120}
          className="mt-section-y-sm grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </RevealOnScroll>

        <p className="mt-6 text-[10px] text-ink/40">
          出典: Google News RSS フィード。掲載画像 ・ タイトルの著作権は各配信元に帰属します。
          サムネイルは表示用に外部 URL を参照するのみで、当サイトには保存されません。
        </p>
      </div>
    </section>
  );
}
