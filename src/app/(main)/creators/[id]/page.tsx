import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCreatorById, getCreators } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

// プロフィール編集・いいね数などが即時反映されるよう動的レンダリング
export const dynamic = "force-dynamic";
import { ReviewList } from "@/components/reviews/review-list";
import { PortfolioFilterable } from "@/components/creators/portfolio-filterable";
import { ShareButton } from "@/components/creators/share-button";
import { EstimateChatBot } from "@/components/creators/estimate-chat-bot";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { LikeDeltaProvider } from "@/components/portfolio/like-delta-context";
import { TotalLikesBadge } from "@/components/creators/total-likes-badge";
import { CreatorQrCard } from "@/components/creators/creator-qr-card";
// SectionTabs はクリエイター詳細の上部からは撤去 (ユーザー判断: タブナビ不要)

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

  const supabase = await createClient();

  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  let viewerRole: string | null = null;
  if (viewer) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", viewer.id)
      .maybeSingle();
    viewerRole = (viewerProfile?.role as string | undefined) ?? null;
  }
  void viewerRole; // role 情報は今後の権限分岐用に保持

  // ===== アクティビティ シグナル(過去90日分) =====
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  // クリエイターが受信した DM 数 (過去90日)
  const { count: receivedCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", creator.user_id)
    .gte("created_at", ninetyDaysAgo);

  // クリエイターが送信した DM 数 (過去90日)
  const { count: sentCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", creator.user_id)
    .gte("created_at", ninetyDaysAgo);

  // 最終アクティビティ(最新の送信メッセージ)
  const { data: lastMessage } = await supabase
    .from("messages")
    .select("created_at")
    .eq("sender_id", creator.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 受信に対する返信率 (粗い指標)
  const replyRate =
    receivedCount && receivedCount > 0
      ? Math.min(100, Math.round(((sentCount ?? 0) / receivedCount) * 100))
      : null;

  const lastActiveAt = lastMessage?.created_at ?? creator.updated_at;
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(lastActiveAt).getTime()) / (24 * 60 * 60 * 1000)
  );
  const activityLabel =
    daysSinceActive === 0
      ? "今日アクティブ"
      : daysSinceActive < 7
        ? `${daysSinceActive}日前にアクティブ`
        : daysSinceActive < 30
          ? `${Math.floor(daysSinceActive / 7)}週間前にアクティブ`
          : `${Math.floor(daysSinceActive / 30)}ヶ月前にアクティブ`;
  const isFresh = daysSinceActive < 7;

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, comment, created_at,
      client:client_profiles!reviews_client_id_fkey (
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  const displayName = creator.profiles.display_name;
  const avatarUrl = creator.profiles.avatar_url;
  // QR コード用の絶対 URL。NEXT_PUBLIC_SITE_URL を本番ホストに合わせて設定する想定。
  // 未設定時は Vercel デフォルトをフォールバック。
  const siteOrigin = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://creaters-portfolio.vercel.app"
  )
    .trim()
    .replace(/\/$/, "");
  const pageUrl = `${siteOrigin}/creators/${creator.id}`;
  const isVerified = creator.profiles.is_verified;

  // ===== 類似クリエイター (同ジャンル or 強み重複の他クリエイター) =====
  const allCreators = await getCreators();
  const otherCreators = allCreators.filter((c) => c.id !== creator.id);
  const similarCreators = otherCreators
    .map((c) => {
      const genreOverlap = c.genres.filter((g) =>
        creator.genres.includes(g)
      ).length;
      const strengthOverlap = c.strengths.filter((s) =>
        creator.strengths.includes(s)
      ).length;
      const toolOverlap = c.ai_tools.filter((t) =>
        creator.ai_tools.includes(t)
      ).length;
      const score = genreOverlap * 3 + strengthOverlap * 2 + toolOverlap;
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .filter((x) => x.score > 0)
    .map((x) => x.c);

  // 総いいね数 (このクリエイターの全 portfolio_items の合計)
  const totalLikes = creator.portfolio_items.reduce(
    (sum, p) => sum + (p.like_count ?? 0),
    0
  );

  // メイン作品 = 名前の右隣に大きく出す代表作。
  // 1) is_featured かつ video_url or thumbnail_url がある先頭、
  // 2) なければ video_url/thumbnail_url がある先頭、
  // 3) どちらもなければ null。
  const hasVisual = (p: (typeof creator.portfolio_items)[number]) =>
    !!p.video_url || !!p.thumbnail_url;
  const mainWork =
    creator.portfolio_items.find((p) => p.is_featured && hasVisual(p)) ??
    creator.portfolio_items.find(hasVisual) ??
    null;
  const otherWorks = mainWork
    ? creator.portfolio_items.filter((p) => p.id !== mainWork.id)
    : creator.portfolio_items;

  // 最低受注金額 — 旧 service_packages から minimum_order_amount へ集約
  const minPackagePrice = creator.minimum_order_amount ?? null;
  const orderHref = `/dashboard/orders/new?creator_id=${creator.id}`;

  return (
    <LikeDeltaProvider>
      {/* =================================================
          HERO BAND
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-16 text-white">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(157,92,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <div className="absolute -left-32 top-0 h-[360px] w-[360px] rounded-full bg-neon-pink opacity-25 blur-[100px]" />
        <div className="absolute -right-20 bottom-0 h-[300px] w-[300px] rounded-full bg-neon-cyan opacity-20 blur-[100px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          {/* Breadcrumb + Share */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <nav className="text-xs text-white/60">
              <Link href="/creators" className="hover:text-neon-pink">
                AIクリエイターを探す
              </Link>
              <span className="mx-2">/</span>
              <span className="text-white">{displayName}</span>
            </nav>
            <ShareButton creatorName={displayName} />
          </div>

          {/* 左: Avatar + 名前/ステータス、 右: 代表作。
              名前ブロックと代表作の間は gap を 0 にしてサムネを目一杯大きく見せる。
              (狭い画面では縦積み) */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-0">
            {/* 左ブロック: Avatar + 名前/ステータス (内部 gap-6 で密結合) */}
            <div className="flex flex-1 items-center gap-6">
              {/* Avatar */}
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-neon-pink/60 bg-neon-midnight shadow-[0_0_24px_rgba(255,77,157,0.4)]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-pink to-neon-purple text-3xl font-black text-white">
                    {displayName[0]}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {isVerified && (
                  <div>
                    <span className="rounded-pill bg-neon-cyan/15 px-2 py-0.5 text-[10px] font-black text-neon-cyan">
                      認証済み
                    </span>
                  </div>
                )}
                <h1 className="mt-3 text-3xl font-black sm:text-[2.5rem]">
                  {displayName}
                </h1>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/70">
                  {creator.years_of_experience > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-neon-purple">◆</span>
                      経験 {creator.years_of_experience} 年
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-neon-pink">✦</span>
                    作品 {creator.portfolio_items.length} 件
                  </span>
                  <TotalLikesBadge initialTotal={totalLikes} />
                </div>

                {/* Activity signals */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-[11px] font-bold ${
                      isFresh
                        ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                        : "border-white/15 bg-white/5 text-white/70"
                    }`}
                  >
                    {isFresh && (
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
                    )}
                    {activityLabel}
                  </span>
                  {replyRate !== null && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/80">
                      💬 返信率 {replyRate}%
                    </span>
                  )}
                  {receivedCount !== null && receivedCount !== undefined && (
                    <span className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-white/70">
                      過去90日 {receivedCount}件の問い合わせ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 右: メイン作品 — 名前ブロックに完全密着、横幅大きめ (最大 520px / 名前ブロック幅相応)。
                ホバーで再生、クリックでポートフォリオセクションへスクロール。 */}
            {mainWork && (mainWork.video_url || mainWork.thumbnail_url) && (
              <Link
                href="#portfolio"
                className="group/main relative block aspect-video w-full shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-neon-midnight-deep shadow-[0_18px_40px_-15px_rgba(255,77,157,0.45)] transition-transform hover:-translate-y-0.5 lg:w-[clamp(380px,40vw,480px)]"
                aria-label="代表作を見る"
              >
                <VideoPreviewCard
                  thumbnailUrl={mainWork.thumbnail_url}
                  videoUrl={mainWork.video_url ?? ""}
                  videoPlatform={mainWork.video_platform ?? "mp4"}
                  alt={mainWork.title}
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className="absolute inset-0 h-full w-full"
                  showPlayIcon
                />
                <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-2.5 py-0.5 text-[10px] font-black text-white shadow-[0_0_10px_rgba(255,77,157,0.5)]">
                  ★ 代表作
                </span>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-neon-midnight-deep via-neon-midnight-deep/60 to-transparent px-3 pb-2 pt-8">
                  <p className="line-clamp-1 text-xs font-bold text-white">
                    {mainWork.title}
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={orderHref}
              className="group inline-flex items-center justify-between gap-3 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(255,77,157,0.6)]"
            >
              <span>
                💼 このクリエイターに依頼を相談
                {minPackagePrice !== null && (
                  <span className="ml-2 text-xs font-bold text-white/80">
                    ¥{minPackagePrice.toLocaleString()}〜
                  </span>
                )}
              </span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          {/* 最低受注金額 — Hero 直下に大きく表示 */}
          {minPackagePrice !== null && (
            <div className="mt-6 rounded-2xl border border-neon-pink/30 bg-neon-pink/[0.08] p-5 backdrop-blur-md shadow-[0_18px_40px_-15px_rgba(255,77,157,0.35)]">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-3 py-0.5 text-[10px] font-black tracking-wider text-white">
                  最低受注金額
                </span>
                <span className="text-xl font-black text-neon-pink sm:text-2xl">
                  ¥{minPackagePrice.toLocaleString()}〜
                  <span className="ml-1 text-xs font-bold text-white/60">
                    から相談可
                  </span>
                </span>
              </div>
              <p className="mt-3 text-[11px] text-white/55">
                ※ 仕様/尺/本数で見積もりは変動します。「依頼を相談」から具体条件をすり合わせできます。
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="relative mx-auto max-w-container px-6 py-12 lg:px-10">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -left-32 top-32 h-[500px] w-[500px] rounded-full bg-neon-pink opacity-10 blur-[140px] animate-glow-pulse-slow" />
        <div className="pointer-events-none absolute -right-24 top-[800px] h-[420px] w-[420px] rounded-full bg-neon-cyan opacity-10 blur-[120px] animate-glow-pulse" />

        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Left Column: Profile + Portfolio */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile */}
            <div
              id="profile"
              className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(255,77,157,0.15)] sm:p-8"
            >
              <h2 className="text-lg font-black text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-neon-pink mr-2 align-middle shadow-[0_0_8px_rgba(255,77,157,0.7)]" />
                プロフィール
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-[2] text-white/70">
                {creator.bio}
              </p>

              {creator.genres.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                    得意ジャンル
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {creator.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-pill border border-neon-purple/40 bg-neon-purple/15 px-3 py-1 text-xs font-bold text-neon-purple"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 強み */}
            {creator.strengths.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(255,77,157,0.15)] sm:p-8">
                <h2 className="text-lg font-black text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-pink mr-2 align-middle shadow-[0_0_8px_rgba(255,77,157,0.7)]" />
                  強み
                </h2>
                <p className="mt-1 text-xs text-white/55">
                  AIクリエイターの中で「この人を選ぶ理由」
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.strengths.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2 text-xs font-bold text-white shadow-[0_0_14px_rgba(255,77,157,0.45)]"
                    >
                      ✦ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 得意映像尺 */}
            {creator.video_lengths.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(77,213,247,0.15)] sm:p-8">
                <h2 className="text-lg font-black text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-cyan mr-2 align-middle shadow-[0_0_8px_rgba(77,213,247,0.7)]" />
                  得意映像尺
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.video_lengths.map((l) => (
                    <span
                      key={l}
                      className="rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {creator.portfolio_items.length > 0 && (
              <div
                id="portfolio"
                className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(157,92,255,0.15)] sm:p-8"
              >
                <h2 className="mb-6 text-lg font-black text-white">
                  <span className="inline-block h-2 w-2 rounded-full bg-neon-purple mr-2 align-middle shadow-[0_0_8px_rgba(157,92,255,0.7)]" />
                  ポートフォリオ
                  <span className="ml-2 text-xs font-bold text-white/50">
                    (代表作は上部に表示中)
                  </span>
                </h2>
                {/* 代表作はヒーローに出しているため、ここでは除外 */}
                <PortfolioFilterable items={otherWorks} />
              </div>
            )}

            {/* Reviews */}
            <div
              id="reviews"
              className="scroll-mt-32 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(255,174,59,0.15)] sm:p-8"
            >
              <h2 className="mb-6 text-lg font-black text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-neon-sunset mr-2 align-middle shadow-[0_0_8px_rgba(255,174,59,0.7)]" />
                レビュー({reviews?.length ?? 0}件)
              </h2>
              <ReviewList
                reviews={(reviews ?? []) as unknown as {
                  id: string;
                  rating: number;
                  comment: string;
                  created_at: string;
                  client: { profiles: { display_name: string } };
                }[]}
              />
            </div>
          </div>

          {/* Right Column: 最低対応金額 + AI 見積もり + CTA */}
          <div id="pricing" className="scroll-mt-32 space-y-5">
            <div className="sticky top-40 space-y-5">
              {/* Minimum price card */}
              <div className="overflow-hidden rounded-2xl border border-neon-pink/40 bg-gradient-to-br from-neon-pink/15 to-neon-purple/15 backdrop-blur-sm shadow-[0_20px_50px_-10px_rgba(255,77,157,0.4)]">
                <div className="bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.16em] text-white">
                  最低対応金額
                </div>
                <div className="p-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-white/70">¥</span>
                    <span className="text-4xl font-black tracking-tight text-neon-pink sm:text-5xl">
                      {minPackagePrice !== null
                        ? minPackagePrice.toLocaleString()
                        : "応相談"}
                    </span>
                    {minPackagePrice !== null && (
                      <span className="text-xs text-white/60">〜</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-[1.85] text-white/65">
                    上記は最安パッケージ価格です。実際の金額は依頼内容によって変動します。詳細は下の AI に聞くか、メッセージでご相談ください。
                  </p>

                  <Link
                    href={orderHref}
                    className="mt-5 inline-flex w-full items-center justify-between gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,157,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(255,77,157,0.7)]"
                  >
                    <span>💼 このクリエイターに依頼を相談</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* AI 見積もりチャット */}
              <EstimateChatBot creatorId={creator.id} />

              {/* このページの QR コード — 名刺・紹介資料に貼り付け可能 */}
              <CreatorQrCard
                url={pageUrl}
                creatorName={displayName}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Similar Creators */}
      {similarCreators.length > 0 && (
        <section className="relative overflow-hidden border-t border-white/10 bg-neon-midnight py-20">
          <div className="pointer-events-none absolute -right-32 top-12 h-[400px] w-[400px] rounded-full bg-neon-purple opacity-15 blur-[120px] animate-glow-pulse-slow" />

          <div className="relative mx-auto max-w-container px-6 lg:px-10">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-cyan">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
                  SIMILAR CREATORS
                </p>
                <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                  似た領域の{" "}
                  <span className="bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
                    AIクリエイター
                  </span>
                </h2>
              </div>
              <Link
                href="/creators"
                className="group inline-flex items-center gap-2 rounded-pill border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
              >
                すべて見る
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarCreators.map((c, idx) => {
                const gradients = [
                  "linear-gradient(135deg, #ff4d9d 0%, #9d5cff 100%)",
                  "linear-gradient(135deg, #4dd5f7 0%, #2e6ca0 100%)",
                  "linear-gradient(135deg, #9d5cff 0%, #5b2dd1 100%)",
                  "linear-gradient(135deg, #ffae3b 0%, #ff4d9d 100%)",
                ];
                return (
                  <Link
                    key={c.id}
                    href={`/creators/${c.id}`}
                    className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-neon-pink/40 hover:shadow-[0_25px_60px_-15px_rgba(255,77,157,0.4)]"
                  >
                    <div
                      className="relative aspect-[4/3] w-full"
                      style={{
                        background: c.profiles?.avatar_url
                          ? `url(${c.profiles.avatar_url}) center/cover`
                          : gradients[idx % gradients.length],
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-neon-midnight-deep via-neon-midnight-deep/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-base font-black text-white">
                          {c.profiles?.display_name ?? "クリエイター"}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 text-xs text-white/65">
                        {c.bio || "クリエイター"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mobile sticky bottom CTA (lg 未満) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neon-midnight-deep/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-container items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              最安料金
            </p>
            <p className="text-base font-black text-neon-pink">
              {minPackagePrice !== null
                ? `¥${minPackagePrice.toLocaleString()}〜`
                : "応相談"}
            </p>
          </div>
          <Link
            href={orderHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-5 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,77,157,0.45)]"
          >
            依頼を相談
            <span>→</span>
          </Link>
        </div>
      </div>
    </LikeDeltaProvider>
  );
}
