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

export async function getCreators(): Promise<CreatorWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      `
      *,
      profiles!creator_profiles_user_id_fkey (
        display_name,
        avatar_url,
        is_verified
      ),
      portfolio_items (
        id, title, description, media_type, video_url, video_platform, image_url, thumbnail_url, aspect_ratio, like_count, genre, tags, used_ai_tools, role_scope, external_url, display_tag, duration_seconds, visual_style, resolution, usage_role
      )
      `
    )
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

  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      `
      *,
      profiles!creator_profiles_user_id_fkey (
        display_name,
        avatar_url,
        is_verified
      ),
      portfolio_items (
        id, title, description, media_type, video_url, video_platform, image_url, thumbnail_url, aspect_ratio, like_count, genre, tags, used_ai_tools, role_scope, external_url, display_tag, duration_seconds, visual_style, resolution, usage_role
      )
      `
    )
    .eq("id", id)
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

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
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

  let creator_profile = undefined;
  let client_profile = undefined;

  if (profile.role === "creator") {
    const { data } = await supabase
      .from("creator_profiles")
      .select(
        "id, bio, video_lengths, strengths, ai_tools, genres, location, years_of_experience, rating, review_count, minimum_order_amount, profile_views, cover_image_url, availability_status, typical_first_draft_days, social_links"
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
    email: profile.email,
    role: profile.role,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    is_verified: profile.is_verified,
    creator_profile,
    client_profile,
  };
}
