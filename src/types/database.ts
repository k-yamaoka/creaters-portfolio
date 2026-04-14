export type UserRole = "creator" | "client" | "admin";

export type Creator = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  skills: string[];
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
  package_id: string;
  status:
    | "pending"
    | "accepted"
    | "in_progress"
    | "delivered"
    | "revision"
    | "completed"
    | "cancelled";
  total_amount: number;
  platform_fee: number;
  escrow_status: "held" | "released" | "refunded";
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
  platforms?: string[];
  budgetMin?: number;
  budgetMax?: number;
  deliveryDays?: number;
  sortBy?: "recommended" | "rating" | "price_low" | "price_high";
};

export type JobSearchFilters = {
  keyword?: string;
  genres?: string[];
  platforms?: string[];
  statusFilter?: "all" | "open";
  sortBy?: "newest" | "popular" | "price_high" | "deadline";
};
