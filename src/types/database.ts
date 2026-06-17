export type UserRole = "creator" | "client" | "admin";

export type Creator = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  video_lengths: string[];
  strengths: string[];
  genres: string[];
  location: string | null;
  years_of_experience: number;
  rating: number;
  review_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type PortfolioItem = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  video_url: string;
  video_platform: "youtube" | "vimeo" | "other";
  thumbnail_url: string;
  genre: string;
  tags: string[];
  created_at: string;
};

export type ServicePackage = {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[];
  is_active: boolean;
};

export type Order = {
  id: string;
  client_id: string;
  creator_id: string;
  status:
    | "consultation"
    | "quoting"
    | "contract"
    | "data_sharing"
    | "production"
    | "revision"
    | "delivered"
    | "cancelled";
  total_amount: number;
  platform_fee: number;
  escrow_status: "pending" | "held" | "released" | "refunded";
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  order_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type CreatorSearchFilters = {
  keyword?: string;
  genres?: string[];
  budgetMin?: number;
  budgetMax?: number;
  deliveryDays?: number;
  sortBy?: "recommended" | "rating" | "price_low" | "price_high";
};

// /portfolios (作品単位) の Adobe Stock 型検索フィルター。
// CreatorSearchFilters と異なり、絞り込みは portfolio_items 単位で行う。
// すべての値は URL クエリパラメータと同期する (?orientation=vertical&tool=veo&...)
export type Orientation = "horizontal" | "vertical" | "square";
export type DurationBucket = "u15" | "u60" | "u180" | "o180";
export type Resolution = "1080p" | "2k" | "4k";

export type PortfolioSearchFilters = {
  keyword?: string;
  genres?: string[];
  orientations?: Orientation[];
  aiTools?: string[];
  visualStyles?: string[];
  durations?: DurationBucket[];
  resolutions?: Resolution[];
  sortBy?: "recommended" | "newest" | "rating" | "price_low" | "price_high";
};

export type JobSearchFilters = {
  keyword?: string;
  genres?: string[];
  // "all" すべて / "open" 募集中 / "urgent" 締切間近 (3日以内) / "closed" 終了
  statusFilter?: "all" | "open" | "urgent" | "closed";
  sortBy?: "recommended" | "newest" | "popular" | "price_high" | "deadline";
  // 予算スライダー (min/max は円単位)
  budgetMin?: number;
  budgetMax?: number;
};
