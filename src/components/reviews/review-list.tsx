type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client: {
    profiles: { display_name: string };
  };
};

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
            {/* Stars */}
            <div className="mt-2 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating ? "text-[#FFB74D]" : "text-[#E0E0E0]"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
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
