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
