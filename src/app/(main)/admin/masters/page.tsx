import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { TagsAdmin } from "./tags-admin";

/**
 * マスター管理 (tags テーブル)。
 * カテゴリ: skill / ai_tool / genre / industry
 * 各カテゴリで add / edit / toggle is_active / delete が可能。
 */

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string }>;

const CATEGORY_TABS = [
  { key: "ai_tool", label: "AI ツール", description: "Sora / Veo / Runway 等" },
  { key: "genre", label: "ジャンル", description: "SNS 広告 / VP / MV 等" },
  { key: "skill", label: "スキル", description: "映像表現の強み" },
  { key: "industry", label: "業種", description: "D2C / EdTech 等" },
] as const;

type CategoryKey = (typeof CATEGORY_TABS)[number]["key"];

function isCategoryKey(v: string | undefined): v is CategoryKey {
  return CATEGORY_TABS.some((t) => t.key === v);
}

export default async function AdminMastersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const activeCategory: CategoryKey = isCategoryKey(params.category)
    ? params.category
    : "ai_tool";

  const admin = getSupabaseAdmin();
  const { data: tags } = await admin
    .from("tags")
    .select("*")
    .eq("category", activeCategory)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#222]">マスター管理</h2>
      <p className="mt-2 text-sm text-[#828282]">
        AI ツール / ジャンル / スキル / 業種 のマスター。追加後は各画面で選択肢に反映されます。
      </p>

      {/* Category タブ */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-x-2 gap-y-1">
          {CATEGORY_TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin/masters?category=${t.key}`}
              className={`inline-flex items-baseline gap-2 border-b-2 px-4 py-2 text-sm ${
                t.key === activeCategory
                  ? "border-neon-purple-deep font-bold text-neon-purple-deep"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
              <span className="text-xs text-gray-400">{t.description}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <TagsAdmin category={activeCategory} tags={tags ?? []} />
      </div>
    </div>
  );
}
