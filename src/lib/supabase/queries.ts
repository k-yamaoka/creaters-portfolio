import { createClient } from "./server";

export type CreatorWithRelations = {
  id: string;
  user_id: string;
  bio: string;
  skills: string[];
  genres: string[];
  location: string | null;
  years_of_experience: number;
  rating: number;
  review_count: number;
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
    video_url: string;
    video_platform: string;
    thumbnail_url: string | null;
    genre: string | null;
    tags: string[];
  }[];
  service_packages: {
    id: string;
    name: string;
    description: string;
    price: number;
    delivery_days: number;
    revisions: number;
    features: string[];
    is_active: boolean;
  }[];
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
        id, title, description, video_url, video_platform, thumbnail_url, genre, tags
      ),
      service_packages (
        id, name, description, price, delivery_days, revisions, features, is_active
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
        id, title, description, video_url, video_platform, thumbnail_url, genre, tags
      ),
      service_packages (
        id, name, description, price, delivery_days, revisions, features, is_active
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
    skills: string[];
    genres: string[];
    location: string | null;
    years_of_experience: number;
    rating: number;
    review_count: number;
  };
  client_profile?: {
    id: string;
    company_name: string | null;
    company_url: string | null;
    industry: string | null;
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
      .select("id, bio, skills, genres, location, years_of_experience, rating, review_count")
      .eq("user_id", user.id)
      .single();
    creator_profile = data ?? undefined;
  } else if (profile.role === "client") {
    const { data } = await supabase
      .from("client_profiles")
      .select("id, company_name, company_url, industry")
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
