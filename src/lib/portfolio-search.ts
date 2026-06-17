/**
 * /portfolios (Adobe Stock 型) の作品単位フィルタリング + URL 同期ユーティリティ。
 *
 * - WorkEntry = portfolio_item + 親 creator の最小情報。一覧で扱う単位。
 * - URL クエリ ↔ PortfolioSearchFilters の相互変換 (ブックマーク / リロード復元)
 * - 適用関数 applyPortfolioFilters: 作品リストを絞り込み + 並び替え
 */
import type { CreatorWithRelations } from "@/lib/supabase/queries";
import type {
  DurationBucket,
  Orientation,
  PortfolioSearchFilters,
  Resolution,
} from "@/types/database";

export type WorkEntry = {
  // portfolio_item 由来
  id: string;
  title: string;
  description: string;
  media_type: "video" | "image";
  video_url: string | null;
  video_platform: string;
  image_url: string | null;
  thumbnail_url: string | null;
  aspect_ratio: "vertical" | "horizontal" | "square";
  like_count: number;
  genre: string | null;
  tags: string[];
  used_ai_tools: string[];
  duration_seconds: number | null;
  visual_style: string | null;
  resolution: string | null;
  // 親 creator 由来 (絞り込み・並び替え + カード表示用)
  creator_id: string;
  creator_display_name: string;
  creator_avatar_url: string | null;
  creator_rating: number;
  creator_review_count: number;
  creator_minimum_order_amount: number | null;
  creator_used_ai_tools: string[]; // 作品単位の AI ツールが空のとき fallback
  creator_genres: string[];
};

export function flattenCreatorsToWorks(
  creators: CreatorWithRelations[]
): WorkEntry[] {
  const out: WorkEntry[] = [];
  for (const c of creators) {
    for (const p of c.portfolio_items) {
      out.push({
        id: p.id,
        title: p.title,
        description: p.description,
        media_type: p.media_type,
        video_url: p.video_url,
        video_platform: p.video_platform,
        image_url: p.image_url,
        thumbnail_url: p.thumbnail_url,
        aspect_ratio: p.aspect_ratio,
        like_count: p.like_count,
        genre: p.genre,
        tags: p.tags,
        used_ai_tools: p.used_ai_tools ?? [],
        duration_seconds: p.duration_seconds ?? null,
        visual_style: p.visual_style ?? null,
        resolution: p.resolution ?? null,
        creator_id: c.id,
        creator_display_name: c.profiles.display_name,
        creator_avatar_url: c.profiles.avatar_url,
        creator_rating: c.rating,
        creator_review_count: c.review_count,
        creator_minimum_order_amount: c.minimum_order_amount,
        creator_used_ai_tools: c.ai_tools ?? [],
        creator_genres: c.genres ?? [],
      });
    }
  }
  return out;
}

// 〜15秒 / 〜60秒 / 〜180秒 / 180+秒 のバケット判定
function inDurationBucket(s: number | null, b: DurationBucket): boolean {
  if (s == null) return false;
  switch (b) {
    case "u15":
      return s <= 15;
    case "u60":
      return s > 15 && s <= 60;
    case "u180":
      return s > 60 && s <= 180;
    case "o180":
      return s > 180;
  }
}

// AI ツールはまず作品単位 (used_ai_tools)、空ならクリエイター単位 ai_tools を見る。
// 文字列マッチは大文字小文字無視 + バージョン号無視 (e.g. "Sora 2" は "Sora" にマッチ)。
function workHasAiTool(w: WorkEntry, toolKey: string): boolean {
  const needle = toolKey.toLowerCase();
  const pool = w.used_ai_tools.length > 0 ? w.used_ai_tools : w.creator_used_ai_tools;
  return pool.some((t) => t.toLowerCase().includes(needle));
}

export function applyPortfolioFilters(
  works: WorkEntry[],
  f: PortfolioSearchFilters
): WorkEntry[] {
  let r = works;

  if (f.keyword) {
    const kw = f.keyword.toLowerCase();
    r = r.filter(
      (w) =>
        w.title.toLowerCase().includes(kw) ||
        w.description.toLowerCase().includes(kw) ||
        w.creator_display_name.toLowerCase().includes(kw) ||
        w.tags.some((t) => t.toLowerCase().includes(kw))
    );
  }

  if (f.genres?.length) {
    r = r.filter((w) => {
      // 作品単位の genre があればそれを優先、無ければ creator の genres を見る
      if (w.genre && f.genres!.includes(w.genre)) return true;
      return w.creator_genres.some((g) => f.genres!.includes(g));
    });
  }

  if (f.orientations?.length) {
    r = r.filter((w) =>
      f.orientations!.includes(w.aspect_ratio as Orientation)
    );
  }

  if (f.aiTools?.length) {
    r = r.filter((w) => f.aiTools!.some((tool) => workHasAiTool(w, tool)));
  }

  if (f.visualStyles?.length) {
    r = r.filter(
      (w) => w.visual_style && f.visualStyles!.includes(w.visual_style)
    );
  }

  if (f.durations?.length) {
    r = r.filter((w) =>
      f.durations!.some((b) => inDurationBucket(w.duration_seconds, b))
    );
  }

  if (f.resolutions?.length) {
    r = r.filter(
      (w) =>
        w.resolution &&
        f.resolutions!.includes(w.resolution.toLowerCase() as Resolution)
    );
  }

  // 並び替え (Mutates a copy)
  const sorted = [...r];
  switch (f.sortBy) {
    case "newest":
      // newest はクリエイター順 (id 比較) — 厳密な作品 created_at は未取得のため。
      sorted.sort((a, b) => (a.id < b.id ? 1 : -1));
      break;
    case "rating":
      sorted.sort((a, b) => b.creator_rating - a.creator_rating);
      break;
    case "price_low":
    case "price_high": {
      const dir = f.sortBy === "price_low" ? 1 : -1;
      sorted.sort((a, b) => {
        const pa = a.creator_minimum_order_amount ?? Number.POSITIVE_INFINITY;
        const pb = b.creator_minimum_order_amount ?? Number.POSITIVE_INFINITY;
        const ai = !isFinite(pa);
        const bi = !isFinite(pb);
        if (ai && bi) return 0;
        if (ai) return 1;
        if (bi) return -1;
        return (pa - pb) * dir;
      });
      break;
    }
    case "recommended":
    default:
      sorted.sort(
        (a, b) =>
          (b.creator_rating * 0.5 + b.like_count * 0.5) -
          (a.creator_rating * 0.5 + a.like_count * 0.5)
      );
      break;
  }
  return sorted;
}

// ===== URL クエリ <-> Filters =====

function readArray(q: URLSearchParams, key: string): string[] | undefined {
  const v = q.get(key);
  if (!v) return undefined;
  return v.split(",").filter(Boolean);
}

export function readFiltersFromQuery(
  q: URLSearchParams
): PortfolioSearchFilters {
  const orientations = readArray(q, "orientation") as Orientation[] | undefined;
  const durations = readArray(q, "duration") as DurationBucket[] | undefined;
  const resolutions = readArray(q, "resolution") as Resolution[] | undefined;
  const sortByRaw = q.get("sort") ?? undefined;
  const sortBy: PortfolioSearchFilters["sortBy"] =
    sortByRaw === "newest" ||
    sortByRaw === "rating" ||
    sortByRaw === "price_low" ||
    sortByRaw === "price_high" ||
    sortByRaw === "recommended"
      ? sortByRaw
      : undefined;
  return {
    keyword: q.get("q") ?? undefined,
    genres: readArray(q, "genre"),
    orientations,
    aiTools: readArray(q, "tool"),
    visualStyles: readArray(q, "style"),
    durations,
    resolutions,
    sortBy,
  };
}

export function writeFiltersToQuery(
  f: PortfolioSearchFilters
): URLSearchParams {
  const q = new URLSearchParams();
  if (f.keyword) q.set("q", f.keyword);
  if (f.genres?.length) q.set("genre", f.genres.join(","));
  if (f.orientations?.length) q.set("orientation", f.orientations.join(","));
  if (f.aiTools?.length) q.set("tool", f.aiTools.join(","));
  if (f.visualStyles?.length) q.set("style", f.visualStyles.join(","));
  if (f.durations?.length) q.set("duration", f.durations.join(","));
  if (f.resolutions?.length) q.set("resolution", f.resolutions.join(","));
  if (f.sortBy && f.sortBy !== "recommended") q.set("sort", f.sortBy);
  return q;
}

export function countActiveFilters(f: PortfolioSearchFilters): number {
  let n = 0;
  if (f.keyword) n++;
  if (f.genres?.length) n += f.genres.length;
  if (f.orientations?.length) n += f.orientations.length;
  if (f.aiTools?.length) n += f.aiTools.length;
  if (f.visualStyles?.length) n += f.visualStyles.length;
  if (f.durations?.length) n += f.durations.length;
  if (f.resolutions?.length) n += f.resolutions.length;
  return n;
}
