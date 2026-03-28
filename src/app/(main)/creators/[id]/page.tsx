import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCreatorById } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await getCreatorById(id);

  if (!creator) {
    notFound();
  }

  const displayName = creator.profiles.display_name;
  const avatarUrl = creator.profiles.avatar_url;
  const isVerified = creator.profiles.is_verified;
  const activePackages = creator.service_packages.filter((p) => p.is_active);

  return (
    <div className="mx-auto max-w-container px-6 py-10 lg:px-[6.25rem]">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-[#828282]">
        <Link href="/creators" className="hover:text-primary-500">
          クリエイターを探す
        </Link>
        <span className="mx-2">/</span>
        <span className="text-[#222]">{displayName}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Left Column: Profile + Portfolio */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Header */}
          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#F2F2F2]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#828282]">
                    {displayName[0]}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#222] sm:text-3xl">
                    {displayName}
                  </h1>
                  {isVerified && (
                    <span className="flex items-center gap-1 rounded-pill bg-primary-500 px-3 py-1 text-xs font-bold text-white">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      認証済み
                    </span>
                  )}
                </div>

                {/* Meta info */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#828282]">
                  {creator.location && (
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                        />
                      </svg>
                      {creator.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                    経験{creator.years_of_experience}年
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-[#FFB74D]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-[#222]">
                      {creator.rating}
                    </span>
                    <span className="text-[#BDBDBD]">
                      ({creator.review_count}件のレビュー)
                    </span>
                  </span>
                </div>

                {/* Bio */}
                <p className="mt-4 text-sm leading-relaxed text-[#4F4F4F]">
                  {creator.bio}
                </p>

                {/* Genre tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-500"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <h2 className="mb-4 text-lg font-bold text-[#222]">スキル</h2>
            <div className="flex flex-wrap gap-2">
              {creator.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-pill border border-[#E0E0E0] px-4 py-1.5 text-sm text-[#4F4F4F]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          {creator.portfolio_items.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
              <h2 className="mb-6 text-lg font-bold text-[#222]">
                ポートフォリオ
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {creator.portfolio_items.map((item) => (
                  <div
                    key={item.id}
                    className="group overflow-hidden rounded-xl"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden rounded-xl bg-[#F2F2F2]">
                      {item.thumbnail_url ? (
                        <Image
                          src={item.thumbnail_url}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#BDBDBD]">
                          <svg
                            className="h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
                        <div className="scale-0 rounded-full bg-white/90 p-3 shadow-lg transition-transform duration-300 group-hover:scale-100">
                          <svg
                            className="h-5 w-5 text-primary-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-[#222]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#828282]">
                        {item.description}
                      </p>
                      {item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Packages */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <h2 className="mb-4 text-lg font-bold text-[#222]">料金プラン</h2>
            <div className="space-y-4">
              {activePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl bg-white p-6 shadow-card"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-base font-bold text-[#222]">
                      {pkg.name}
                    </h3>
                    <p className="text-xl font-bold text-primary-500">
                      {formatPrice(pkg.price)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-[#828282]">
                    {pkg.description}
                  </p>

                  {/* Delivery & Revisions */}
                  <div className="mt-4 flex gap-4 text-xs text-[#828282]">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                      納期 {pkg.delivery_days}日
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                        />
                      </svg>
                      修正 {pkg.revisions}回
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="mt-4 space-y-2">
                    {pkg.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[#4F4F4F]"
                      >
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/dashboard/messages/${creator.user_id}`}
                    className="btn-primary mt-6 w-full text-sm"
                  >
                    このプランで相談する
                  </Link>
                </div>
              ))}
            </div>

            {/* Contact button */}
            <div className="mt-6">
              <Link
                href={`/dashboard/messages/${creator.user_id}`}
                className="btn-secondary w-full text-sm"
              >
                メッセージを送る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
