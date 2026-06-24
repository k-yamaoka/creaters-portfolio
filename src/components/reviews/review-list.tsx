import { RATING_LEVELS } from "@/lib/constants";
import { formatDateJP } from "@/lib/utils";

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
    // 2026-06-24: 旧 🌱 (seedling) アイコン + 「初回依頼で次の顧客に役立つ評価を…」
    // の冗長文を撤去。ライトテーマに合わせて gray-* に切替。
    return (
      <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-center text-sm text-gray-600">
        まだレビューがありません。
      </p>
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
          <div
            key={review.id}
            className="border-b border-gray-100 pb-4 last:border-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                  {clientName[0]}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {clientName}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDateJP(review.created_at)}
              </span>
            </div>
            {/* Emoji rating */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xl">{ratingDisplay.emoji}</span>
              <span className="text-sm font-medium text-gray-700">
                {ratingDisplay.label}
              </span>
            </div>
            {review.comment && (
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {review.comment}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
