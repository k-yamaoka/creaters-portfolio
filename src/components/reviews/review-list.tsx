import { RATING_LEVELS } from "@/lib/constants";

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client: {
    profiles: { display_name: string };
  };
};

function getRatingDisplay(rating: number) {
  const level = RATING_LEVELS.find((l) => l.value === rating);
  if (level) return level;
  // Backward compatibility: map old 5-star to new 3-level
  if (rating >= 4) return RATING_LEVELS[0]; // 満足
  if (rating >= 2) return RATING_LEVELS[1]; // 普通
  return RATING_LEVELS[2]; // 不満
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[#828282]">まだレビューはありません</p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const clientName =
          (review.client as unknown as { profiles: { display_name: string } })
            ?.profiles?.display_name ?? "クライアント";
        const ratingDisplay = getRatingDisplay(review.rating);

        return (
          <div key={review.id} className="border-b border-[#F2F2F2] pb-4 last:border-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-xs font-bold text-[#828282]">
                  {clientName[0]}
                </div>
                <span className="text-sm font-medium text-[#222]">
                  {clientName}
                </span>
              </div>
              <span className="text-xs text-[#BDBDBD]">
                {new Date(review.created_at).toLocaleDateString("ja-JP")}
              </span>
            </div>
            {/* Emoji rating */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xl">{ratingDisplay.emoji}</span>
              <span className="text-sm font-medium text-[#4F4F4F]">
                {ratingDisplay.label}
              </span>
            </div>
            {review.comment && (
              <p className="mt-2 text-sm leading-relaxed text-[#4F4F4F]">
                {review.comment}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
