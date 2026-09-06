import { createClient } from "./server";

export type CreatorWithRelations = {
  id: string;
  user_id: string;
  bio: string;
  video_lengths: string[];
  strengths: string[];
  ai_tools: string[];
  genres: string[];
  location: string | null;
  years_of_experience: number;
  rating: number;
  review_count: number;
  // 最低受注金額 (円)。NULL = 未設定 (応相談)
  minimum_order_amount: number | null;
  // 00053-00054 で追加 — 検索 / マッチング向け
  profile_views?: number;
  cover_image_url: string | null;
  availability_status: string | null;
  typical_first_draft_days: number | null;
  social_links: Record<string, string>;
  // 00064: アーリーメンバー (=創設メンバー) 特典フラグ / 00067: 検索公開フラグ
  is_early_member: boolean;
  is_searchable: boolean;
  created_at: string;
  updated_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  portfolio_items: {
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
    is_featured?: boolean;
    // 00055 で追加
    used_ai_tools?: string[];
    role_scope?: string | null;
    external_url?: string | null;
    display_tag?: string | null;
    // 00057 で追加 (Adobe Stock 型検索ファセット)
    duration_seconds?: number | null;
    visual_style?: string | null;
    resolution?: string | null;
    // 00058 で追加 (TOP / FEATURE / Works の自動振り分け)
    usage_role?: "works" | "hero" | "feature";
  }[];
  // 旧 service_packages は 00050 migration で完全撤去。
  // クリエイターの価格は minimum_order_amount に集約。
};

// creator_profiles で 公開列だけを列挙 (RLS-001 で 00089 が stripe_account_id 等を
// REVOKE したため、"*" を使うと 401。CreatorWithRelations の型に含まれない
// 列は削って型と GRANT を一致させる)。
const CREATOR_PROFILE_PUBLIC_COLS =
  "id, user_id, bio, video_lengths, strengths, ai_tools, genres, location, years_of_experience, rating, review_count, minimum_order_amount, profile_views, cover_image_url, availability_status, typical_first_draft_days, social_links, is_early_member, is_searchable, created_at, updated_at";

export async function getCreators(): Promise<CreatorWithRelations[]> {
  const supabase = await createClient();

  // PERF-009 + RLS-001: 従来は creator_profiles.* で全カラム pull →
  //   00089 の列 REVOKE により 401 になる (stripe_account_id 等が REVOKE
  //   された結果、"*" 経由の SELECT が permission_denied)。明示列で読む。
  //   加えて、embedded portfolio_items も moderation_status=unpublished/deleted
  //   を PostgREST の .or foreignTable filter で DB 側除外する。
  //   `!inner` は付けないので portfolio 0 件の creator も残る (旧挙動維持)。
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      `
      ${CREATOR_PROFILE_PUBLIC_COLS},
      profiles!creator_profiles_user_id_fkey (
        display_name,
        avatar_url,
        is_verified
      ),
      portfolio_items!creator_id (
        id, title, description, media_type, video_url, video_platform, image_url, thumbnail_url, aspect_ratio, like_count, genre, tags, used_ai_tools, role_scope, external_url, display_tag, duration_seconds, visual_style, resolution, usage_role, moderation_status
      )
      `
    )
    .eq("is_searchable", true)
    // portfolio_items embedded に対する server-side filter:
    //   moderation_status IS NULL または NOT IN (unpublished, deleted)
    //   PostgREST の or() は foreignTable 指定で embedded 行にのみ適用される。
    .or(
      "moderation_status.is.null,moderation_status.not.in.(unpublished,deleted)",
      { foreignTable: "portfolio_items" }
    )
    // D-1: ファウンディング クリエイターを上位表示 (creator_profiles.is_early_member=true)。
    //   同順位内では従来通り rating DESC。
    .order("is_early_member", { ascending: false })
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching creators:", error);
    return [];
  }

  return (data ?? []) as unknown as CreatorWithRelations[];
}

export async function getCreatorById(
  id: string
): Promise<CreatorWithRelations | null> {
  const supabase = await createClient();

  // PERF-009 + RLS-001: getCreators と同じ列制約。"*" は 00089 で 401 化するため
  //   CREATOR_PROFILE_PUBLIC_COLS で明示列。
  //   embedded resource filter で unpublished/deleted を DB 側除外。
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      `
      ${CREATOR_PROFILE_PUBLIC_COLS},
      profiles!creator_profiles_user_id_fkey (
        display_name,
        avatar_url,
        is_verified
      ),
      portfolio_items!creator_id (
        id, title, description, media_type, video_url, video_platform, image_url, thumbnail_url, aspect_ratio, like_count, genre, tags, used_ai_tools, role_scope, external_url, display_tag, duration_seconds, visual_style, resolution, usage_role, moderation_status
      )
      `
    )
    .eq("id", id)
    .or(
      "moderation_status.is.null,moderation_status.not.in.(unpublished,deleted)",
      { foreignTable: "portfolio_items" }
    )
    .single();

  if (error) {
    console.error("Error fetching creator:", error);
    return null;
  }

  return data as unknown as CreatorWithRelations;
}

export type CurrentUser = {
  id: string;
  email: string;
  role: "creator" | "client" | "admin";
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  creator_profile?: {
    id: string;
    bio: string;
    video_lengths: string[];
    strengths: string[];
    ai_tools: string[];
    genres: string[];
    location: string | null;
    years_of_experience: number;
    rating: number;
    review_count: number;
    minimum_order_amount: number | null;
    profile_views: number;
    cover_image_url: string | null;
    availability_status: string | null;
    typical_first_draft_days: number | null;
    social_links: Record<string, string>;
    // 00064: アーリーメンバー特典 / カスタム手数料率
    is_early_member: boolean;
    custom_fee_rate: number | null;
    // 00067: アカウント種別 (個人/法人) / プロフィール公開フラグ
    user_type: "individual" | "corporate";
    is_searchable: boolean;
  };
  client_profile?: {
    id: string;
    company_name: string | null;
    company_url: string | null;
    industry: string | null;
    // 00056 で追加 (信頼性向上)
    logo_url: string | null;
    company_description: string | null;
    invoice_registration_number: string | null;
  };
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // PERF-009: select("*") で全カラム (bio 長文 / meta jsonb 等) を毎リクエスト
  //   pull していたのを、実際に使う 5 カラムに絞る。
  // RLS-001: migration 00089 で profiles.email は authenticated からも
  //   REVOKE 済み。own row の email は auth.users (user.email) から取得。
  let { data: profile } = await supabase
    .from("profiles")
    .select("id, role, display_name, avatar_url, is_verified")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist (trigger may have failed), create it
  if (!profile) {
    const role = (user.user_metadata?.role as "creator" | "client") || "client";
    const display_name =
      (user.user_metadata?.display_name as string) ||
      user.email?.split("@")[0] ||
      "ユーザー";

    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        display_name,
        role,
      })
      .select()
      .single();

    if (error || !newProfile) return null;
    profile = newProfile;
  }
  if (!profile) return null;

  let creator_profile = undefined;
  let client_profile = undefined;

  if (profile.role === "creator") {
    const { data } = await supabase
      .from("creator_profiles")
      .select(
        "id, bio, video_lengths, strengths, ai_tools, genres, location, years_of_experience, rating, review_count, minimum_order_amount, profile_views, cover_image_url, availability_status, typical_first_draft_days, social_links, is_early_member, custom_fee_rate, user_type, is_searchable"
      )
      .eq("user_id", user.id)
      .single();
    creator_profile = data ?? undefined;
  } else if (profile.role === "client") {
    const { data } = await supabase
      .from("client_profiles")
      .select(
        "id, company_name, company_url, industry, logo_url, company_description, invoice_registration_number"
      )
      .eq("user_id", user.id)
      .single();
    client_profile = data ?? undefined;
  }

  return {
    id: user.id,
    // migration 00089 で profiles.email は authenticated からも REVOKE 済み。
    // 自分自身の email は auth.users (supabase.auth.getUser 経由) だけから取得。
    email: user.email ?? "",
    role: profile.role,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    is_verified: profile.is_verified,
    creator_profile,
    client_profile,
  };
}
