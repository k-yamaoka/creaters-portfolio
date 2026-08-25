import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * sitemap.xml を Next.js ネイティブ形式で配信。
 * - 公開ページ (LP / 案内 / 規約) を静的に列挙
 * - 動的: /creators/[id] (is_searchable=true), /jobs/[id] (status=open) を DB から
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://aimovie-works.com";

const STATIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/creators", changeFrequency: "daily", priority: 0.9 },
  { path: "/portfolios", changeFrequency: "daily", priority: 0.8 },
  { path: "/jobs", changeFrequency: "daily", priority: 0.8 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.7 },
  { path: "/for-business", changeFrequency: "weekly", priority: 0.7 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.6 },
  { path: "/creator-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/case-studies", changeFrequency: "monthly", priority: 0.5 },
  { path: "/company", changeFrequency: "yearly", priority: 0.4 },
  { path: "/help", changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${APP_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // 動的 URL (DB 依存)。env 未設定時は静的だけ返す。
  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const admin = getSupabaseAdmin();
    const [{ data: creators }, { data: jobs }] = await Promise.all([
      admin
        .from("creator_profiles")
        .select("id, updated_at")
        .eq("is_searchable", true)
        .order("updated_at", { ascending: false })
        .limit(500),
      admin
        .from("jobs")
        .select("id, updated_at")
        .eq("status", "open")
        .order("updated_at", { ascending: false })
        .limit(500),
    ]);
    dynamicEntries = [
      ...(creators ?? []).map((c) => ({
        url: `${APP_URL}/creators/${c.id}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...(jobs ?? []).map((j) => ({
        url: `${APP_URL}/jobs/${j.id}`,
        lastModified: j.updated_at ? new Date(j.updated_at) : now,
        changeFrequency: "daily" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    // service key 無ければ動的分を skip
  }

  return [...staticEntries, ...dynamicEntries];
}
