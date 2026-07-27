import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/creators/search
 *
 * C-3 手動マッチング (2026-07-21):
 *   管理者が案件のタグで creator を絞り込み検索する。
 *
 * Query params:
 *   ?tags=<uuid>,<uuid>,...   タグ ID の CSV (AND 条件、全て持つ creator)
 *   ?exclude_invited_job=<jobId>  この案件に既に招待済みの creator を除外
 *   ?limit=20                 (default 20, max 100)
 *
 * 認可: profiles.role='admin' のみ
 * Response: { creators: [{ id, user_id, display_name, avatar_url,
 *   is_early_member, is_searchable, matched_tag_ids }] }
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // admin 認可
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const tagsRaw = url.searchParams.get("tags") ?? "";
  const excludeJob = url.searchParams.get("exclude_invited_job");
  const limit = Math.min(
    Math.max(1, Number(url.searchParams.get("limit") ?? "20")),
    100
  );

  const tagIds = tagsRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{36}$/.test(s));

  const admin = getSupabaseAdmin();

  // AND 条件: 各タグを持つ creator_profile_id の intersection を GROUP BY で
  //   COUNT(DISTINCT tag_id) = tagIds.length で判定 (シンプル & インデックス活用)
  //
  // タグ未指定時は creator_profiles を limit 内で返す (プレビュー用途)。
  let matched: Array<{
    creator_profile_id: string;
    matched_tag_ids: string[];
  }> = [];

  if (tagIds.length > 0) {
    const { data, error } = await admin
      .from("creator_tags")
      .select("creator_profile_id, tag_id")
      .in("tag_id", tagIds);
    if (error) {
      console.error("[admin/creators/search] tag query failed", error);
      return NextResponse.json(
        { error: "検索に失敗しました" },
        { status: 500 }
      );
    }
    const byCreator = new Map<string, Set<string>>();
    for (const row of data ?? []) {
      const r = row as { creator_profile_id: string; tag_id: string };
      const s = byCreator.get(r.creator_profile_id) ?? new Set<string>();
      s.add(r.tag_id);
      byCreator.set(r.creator_profile_id, s);
    }
    matched = Array.from(byCreator.entries())
      .filter(([, tags]) => tags.size === tagIds.length)
      .map(([creator_profile_id, tags]) => ({
        creator_profile_id,
        matched_tag_ids: Array.from(tags),
      }))
      .slice(0, limit);
  } else {
    // タグ未指定: is_searchable=true の全 creator を最大 limit 件返す
    const { data: cps } = await admin
      .from("creator_profiles")
      .select("id")
      .eq("is_searchable", true)
      .limit(limit);
    matched = (cps ?? []).map((c) => ({
      creator_profile_id: (c as { id: string }).id,
      matched_tag_ids: [],
    }));
  }

  if (matched.length === 0) {
    return NextResponse.json({ creators: [] });
  }

  // クリエイター情報 (display_name / avatar) と 既招待済み一覧を join
  const ids = matched.map((m) => m.creator_profile_id);
  const [{ data: creators }, invitedRes] = await Promise.all([
    admin
      .from("creator_profiles")
      .select(
        `id, user_id, bio, is_early_member, is_searchable, ai_tools, genres,
         profiles!creator_profiles_user_id_fkey ( display_name, avatar_url, is_active )`
      )
      .in("id", ids),
    excludeJob
      ? admin
          .from("job_invitations")
          .select("creator_id")
          .eq("job_id", excludeJob)
          .in("creator_id", ids)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const invitedSet = new Set<string>(
    (invitedRes.data ?? []).map((r) => (r as { creator_id: string }).creator_id)
  );
  const matchedById = new Map(
    matched.map((m) => [m.creator_profile_id, m.matched_tag_ids])
  );

  const result = (creators ?? [])
    .filter((c) => {
      const row = c as unknown as {
        id: string;
        profiles?: { is_active?: boolean };
      };
      // 停止アカウントは除外
      return row.profiles?.is_active !== false;
    })
    .filter((c) => !invitedSet.has((c as { id: string }).id))
    .map((c) => {
      const row = c as unknown as {
        id: string;
        user_id: string;
        bio: string;
        is_early_member: boolean;
        is_searchable: boolean;
        ai_tools?: string[];
        genres?: string[];
        profiles?: {
          display_name?: string;
          avatar_url?: string | null;
        };
      };
      return {
        id: row.id,
        user_id: row.user_id,
        display_name: row.profiles?.display_name ?? "-",
        avatar_url: row.profiles?.avatar_url ?? null,
        bio: row.bio,
        is_early_member: row.is_early_member,
        is_searchable: row.is_searchable,
        ai_tools: row.ai_tools ?? [],
        genres: row.genres ?? [],
        matched_tag_ids: matchedById.get(row.id) ?? [],
        matched_tag_count: (matchedById.get(row.id) ?? []).length,
      };
    })
    // マッチ数の多い順、次にファウンディング優先
    .sort((a, b) => {
      if (b.matched_tag_count !== a.matched_tag_count) {
        return b.matched_tag_count - a.matched_tag_count;
      }
      return Number(b.is_early_member) - Number(a.is_early_member);
    });

  return NextResponse.json({ creators: result });
}
