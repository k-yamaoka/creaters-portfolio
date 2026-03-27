import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { Creator, ServicePackage, PortfolioItem } from "@/types/database";

type CreatorCardProps = {
  creator: Creator & {
    portfolios: PortfolioItem[];
    packages: ServicePackage[];
  };
};

export function CreatorCard({ creator }: CreatorCardProps) {
  const lowestPrice = Math.min(...creator.packages.map((p) => p.price));
  const thumbnail = creator.portfolios[0]?.thumbnail_url;

  return (
    <Link
      href={`/creators/${creator.id}`}
      className="group overflow-hidden rounded-[15px] bg-white shadow-card transition-all duration-300 hover:shadow-card-hover"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-[#F2F2F2]">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={creator.portfolios[0]?.title || "ポートフォリオ"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#BDBDBD]">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
        )}
        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
          <div className="scale-0 rounded-full bg-white/90 p-3.5 shadow-lg transition-transform duration-300 group-hover:scale-100">
            <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Verified badge */}
        {creator.is_verified && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-pill bg-primary-500 px-2.5 py-1 text-[11px] font-bold text-white">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            認証済み
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Creator info */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F2F2F2]">
            {creator.avatar_url ? (
              <Image
                src={creator.avatar_url}
                alt={creator.display_name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#828282]">
                {creator.display_name[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-[#222]">
              {creator.display_name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#828282]">
              {creator.location && <span>{creator.location}</span>}
              <span className="text-[#E0E0E0]">|</span>
              <span>経験{creator.years_of_experience}年</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-3 line-clamp-2 text-[13px] leading-[170%] text-[#828282]">
          {creator.bio}
        </p>

        {/* Genre tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {creator.genres.slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="rounded-pill bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-500"
            >
              {genre}
            </span>
          ))}
        </div>

        {/* Rating & Price */}
        <div className="mt-4 flex items-center justify-between border-t border-[#F2F2F2] pt-4">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[#FFB74D]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-bold text-[#222]">
              {creator.rating}
            </span>
            <span className="text-xs text-[#BDBDBD]">
              ({creator.review_count})
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#222]">
              {formatPrice(lowestPrice)}
              <span className="text-xs font-normal text-[#828282]">〜</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
