import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCreatorById, getCreators } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

// プロフィール編集・いいね数などが即時反映されるよう動的レンダリング
export const dynamic = "force-dynamic";
// E-4 (2026-07-16): 星評価・レビュー は準備中扱いのため ReviewList import は解除。
//   フェーズ 2 で復活予定。fetch も削除して DB クエリを節約。
import { PortfolioFilterable } from "@/components/creators/portfolio-filterable";
import { ShareButton } from "@/components/creators/share-button";
import { Video, Briefcase, Sparkles, ArrowRight, BadgeCheck } from "lucide-react";
import { FoundingMemberBadge } from "@/components/creator/founding-member-badge";
import { EstimateChatBot } from "@/components/creators/estimate-chat-bot";
import { VideoPreviewCard } from "@/components/portfolio/video-preview-card";
import { LikeDeltaProvider } from "@/components/portfolio/like-delta-context";
import { TotalLikesBadge } from "@/components/creators/total-likes-badge";
import { CreatorQrCard } from "@/components/creators/creator-qr-card";
import { SocialLinkRow } from "@/components/creators/social-link-row";
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

  // プロフィール閲覧カウンタを +1 (自分自身による閲覧は RPC 側で除外される)
  // 失敗は非致命 (アナリティクスの数字なのでサイレントに無視)
  void supabase.rpc("increment_creator_profile_view", {
    p_creator_id: creator.id,
    p_viewer_user_id: viewer?.id ?? null,
  });

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

  // 2026-06-25: 「アクティブ」「過去90日問い合わせ」「返信率」表示は UI から
  // 撤去したため、関連の messages 集計クエリも撤去 (DB 負荷低減)。

  // E-4: reviews フェッチはフェーズ 2 まで一時停止 (準備中プレースホルダーを表示)

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

  // ===== 00054 で追加した拡張フィールド =====
  // 2026-06-24: cover_image_url は Hero 背景に使っていたが、ライトテーマ化で
  // 背景画像が透かしのように残る問題があったため不使用に。データ自体は保持。
  void creator.cover_image_url;
  const availabilityStatus = creator.availability_status ?? null;
  const typicalFirstDraftDays = creator.typical_first_draft_days ?? null;
  const socialLinks = creator.social_links ?? {};
  // 稼働状況のバッジ表記 (2026-06-25: ライトテーマ用に高コントラスト化)
  const AVAIL_BADGE: Record<string, { label: string; cls: string }> = {
    accepting: {
      label: "案件受付中",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    consultation_only: {
      label: "要相談",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    busy: {
      label: "繁忙",
      cls: "bg-orange-50 text-orange-700 border-orange-200",
    },
    paused: {
      label: "停止中",
      cls: "bg-gray-100 text-gray-700 border-gray-200",
    },
  };
  const availBadge = availabilityStatus
    ? AVAIL_BADGE[availabilityStatus]
    : undefined;

  // SNS リンクは <SocialLinkRow /> 側で順序 + ラベル + アイコンを管理する

  return (
    <LikeDeltaProvider>
      {/* 2026-06-24 Section A: ページ全体を bg-gray-50 + Card UI 構造に再設計。
          - 各カードは bg-white + rounded-2xl + shadow-sm + border-gray-100 で統一
          - 上部 (Hero) は「プロフィール概要カード」として 1 つの白カードに集約
          - メインコンテンツ全体に animate-fade-in (300ms ease-out)
          - 浮遊感のあるレイヤード構成で安価感を払拭 */}
      <div className="min-h-screen bg-gray-50 animate-fade-in">
        {/* === Breadcrumb + Share (薄いバー) === */}
        <div className="bg-gray-50 pt-6">
          <div className="mx-auto flex max-w-container items-center justify-between gap-3 px-6 lg:px-10">
            <nav className="text-xs text-gray-500">
              <Link href="/creators" className="hover:text-neon-pink">
                AIクリエイターを探す
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{displayName}</span>
            </nav>
            <ShareButton creatorName={displayName} />
          </div>
        </div>

        {/* =================================================
            プロフィール概要カード (Hero)
            avatar + 名前 + バッジ + SNS + 代表作 + CTA + 最低受注金額 を
            1 つの白いカードに集約
            ================================================= */}
        <section className="mx-auto max-w-container px-6 pt-6 lg:px-10">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            {/* 左: Avatar + 名前/ステータス、 右: 代表作。
                狭い画面では縦積み */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex flex-1 items-center gap-6">
              {/* Avatar */}
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
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
                <div className="flex flex-wrap items-center gap-2">
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                      <BadgeCheck
                        size={11}
                        strokeWidth={2}
                        fill="currentColor"
                        aria-hidden
                      />
                      認証済み
                    </span>
                  )}
                  {availBadge && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[11px] font-bold ${availBadge.cls}`}
                    >
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current"
                      />
                      {availBadge.label}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-medium tracking-tight text-gray-900 sm:text-[2.5rem]">
                    {displayName}
                  </h1>
                  {/* E-4: 創設メンバー バッジ (先着 50 名。is_early_member=true) */}
                  {creator.is_early_member && (
                    <FoundingMemberBadge variant="chip" />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Video size={16} strokeWidth={1.8} className="text-neon-pink" aria-hidden />
                    作品 {creator.portfolio_items.length} 件
                  </span>
                  <TotalLikesBadge initialTotal={totalLikes} />
                </div>

                {/* Activity signals — 2026-06-25:
                    「〇週間前にアクティブ」「過去90日 N件の問い合わせ」
                    「返信率」を撤去 (ユーザー要望: 不要表示)。
                    初稿目安バッジのみ残す。 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {typicalFirstDraftDays != null && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-pill border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-[11px] font-bold text-neon-purple-deep"
                      title="初稿提出までの目安日数 (クリエイター自己申告)"
                    >
                      <svg
                        aria-hidden
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                      初稿目安 {typicalFirstDraftDays}日
                    </span>
                  )}
                </div>

                {/* SNS / 外部リンク (アイコン化、未入力は表示しない) */}
                <div className="mt-4">
                  <SocialLinkRow links={socialLinks} />
                </div>
              </div>
            </div>

            {/* 右: メイン作品 — 名前ブロックに完全密着、横幅大きめ (最大 480px)。
                2026-06-24: ホバー待ちせず、ページ表示と同時に muted/autoplay/loop
                で再生する。リンクは保持 (クリックで詳細モーダル相当の動線を残す
                ため #portfolio へスクロール)。 */}
            {mainWork && (mainWork.video_url || mainWork.thumbnail_url) && (
              <Link
                href="#portfolio"
                className="group/main relative block aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md lg:w-[clamp(360px,38vw,460px)]"
                aria-label="代表作を見る"
              >
                <VideoPreviewCard
                  thumbnailUrl={mainWork.thumbnail_url}
                  videoUrl={mainWork.video_url ?? ""}
                  videoPlatform={mainWork.video_platform ?? "mp4"}
                  alt={mainWork.title}
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="absolute inset-0 h-full w-full"
                  autoPlay
                  showPlayIcon={false}
                />
                <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-pill bg-gray-900/85 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-sm">
                  ★ 代表作
                </span>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-2 pt-8">
                  <p className="line-clamp-1 text-xs font-bold text-white">
                    {mainWork.title}
                  </p>
                </div>
              </Link>
            )}
            </div>
            {/* 2026-06-24: 旧 Hero CTA + 最低受注金額 横長バーは撤去。
                右カラム sticky の「最低対応金額カード + 依頼ボタン」と
                完全に重複するため。 */}
          </div>
        </section>

        {/* 2 カラム本体 — gap-6 で密度高め */}
        <div className="mx-auto max-w-container px-6 pb-12 pt-6 lg:px-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Profile + Portfolio */}
          <div className="space-y-4 lg:col-span-2">
            {/* Profile */}
            <div
              id="profile"
              className="scroll-mt-32 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="border-l-4 border-indigo-500 pl-3 text-xl font-bold text-gray-900">プロフィール</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-[2] text-gray-700">
                {creator.bio}
              </p>

              {creator.genres.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    得意ジャンル
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {creator.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-pill border border-neon-purple/40 bg-neon-purple/10 px-3 py-1 text-xs font-bold text-neon-purple-deep"
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
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="border-l-4 border-indigo-500 pl-3 text-xl font-bold text-gray-900">強み</h2>
                <p className="mt-1 text-xs text-gray-500">
                  AIクリエイターの中で「この人を選ぶ理由」
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.strengths.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
                    >
                      <Sparkles size={14} strokeWidth={1.8} fill="currentColor" aria-hidden /> {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 得意映像尺 */}
            {creator.video_lengths.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="border-l-4 border-indigo-500 pl-3 text-xl font-bold text-gray-900">得意映像尺</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {creator.video_lengths.map((l) => (
                    <span
                      key={l}
                      className="rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-bold text-neon-cyan-soft"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 使用 AI ツール — マッチング指標 (00054 で UI 復活) */}
            {creator.ai_tools.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="border-l-4 border-indigo-500 pl-3 text-xl font-bold text-gray-900">使用 AI ツール</h2>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {creator.ai_tools.map((t) => (
                    <span
                      key={t}
                      className="rounded-pill border border-neon-pink/40 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 px-3 py-1 text-xs font-bold text-gray-900"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-gray-500">
                  クリエイター自己申告。マッチング検索の対象になります。
                </p>
              </div>
            )}

            {/* Portfolio */}
            {creator.portfolio_items.length > 0 && (
              <div
                id="portfolio"
                className="scroll-mt-32 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
              >
                <h2 className="mb-6 border-l-4 border-indigo-500 pl-3 text-xl font-bold text-gray-900">
                  ポートフォリオ
                  <span className="ml-2 text-xs font-medium text-gray-500">
                    (代表作は上部に表示中)
                  </span>
                </h2>
                {/* 代表作はヒーローに出しているため、ここでは除外 */}
                <PortfolioFilterable
                  items={otherWorks}
                  isAuthed={!!viewer}
                />
              </div>
            )}

            {/* E-4: 星評価・レビュー システムはフェーズ 2 で導入予定。
                現時点では「準備中」プレースホルダーを表示し、既存の
                評価数字は本ページから隠す。ReviewList 側の render は
                管理画面等での過去データ確認用に残置。 */}
            <div
              id="reviews"
              className="scroll-mt-32 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="mb-3 border-l-4 border-indigo-500 pl-3 text-xl font-bold text-gray-900">
                評価・レビュー
              </h2>
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                <p className="text-sm font-bold text-gray-700">準備中</p>
                <p className="mt-1 text-xs text-gray-500">
                  クライアントによる評価・レビュー機能は現在準備中です。
                  正式ローンチ後に開始予定です。
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: 最低対応金額 + AI 見積もり + QR
              2026-06-24: 各カードを border-gray-100 + shadow-sm に統一、
              sticky top-24 で常時画面内に追従。CTA は hover:-translate-y-1。 */}
          <div id="pricing" className="scroll-mt-32 space-y-4">
            <div className="sticky top-24 space-y-4">
              {/* Minimum price card */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="bg-gray-900 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                  最低対応金額
                </div>
                <div className="p-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-gray-600">¥</span>
                    <span className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
                      {minPackagePrice !== null
                        ? minPackagePrice.toLocaleString()
                        : "応相談"}
                    </span>
                    {minPackagePrice !== null && (
                      <span className="text-xs text-gray-500">〜</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-[1.85] text-gray-700">
                    上記は最安パッケージ価格です。実際の金額は依頼内容によって変動します。詳細は下の AI に聞くか、メッセージでご相談ください。
                  </p>

                  <Link
                    href={orderHref}
                    className="mt-5 inline-flex w-full items-center justify-between gap-2 rounded-pill bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Briefcase size={16} strokeWidth={1.8} aria-hidden />
                      このクリエイターに依頼を相談
                    </span>
                    <ArrowRight size={16} strokeWidth={1.8} aria-hidden />
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

      {/* Similar Creators — 2026-06-23 白基調化 / 2026-06-24 余白圧縮 */}
      {similarCreators.length > 0 && (
        <section className="relative border-t border-gray-100 py-12">
          <div className="relative mx-auto max-w-container px-6 lg:px-10">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="inline-flex items-center gap-2 rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.16em] text-neon-cyan-soft">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
                  SIMILAR CREATORS
                </p>
                <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                  似た領域の{" "}
                  <span className="bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
                    AIクリエイター
                  </span>
                </h2>
              </div>
              <Link
                href="/creators"
                className="group inline-flex items-center gap-2 rounded-pill border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-900 transition-all hover:-translate-y-0.5 hover:border-gray-500"
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
                    className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md"
                  >
                    <div
                      className="relative aspect-[4/3] w-full overflow-hidden"
                      style={{
                        background: c.profiles?.avatar_url
                          ? undefined
                          : gradients[idx % gradients.length],
                      }}
                    >
                      {c.profiles?.avatar_url && (
                        // 静的 background-image だと hover scale が効かないため
                        // <Image> + group-hover:scale-105 で滑らかな拡大を実現
                        <Image
                          src={c.profiles.avatar_url}
                          alt={c.profiles.display_name ?? "クリエイター"}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-base font-bold text-white drop-shadow">
                          {c.profiles?.display_name ?? "クリエイター"}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 text-xs text-gray-600">
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

      {/* Mobile sticky bottom CTA (lg 未満) — 白基調化 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-paper/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-container items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              最安料金
            </p>
            <p className="text-base font-black text-gray-900">
              {minPackagePrice !== null
                ? `¥${minPackagePrice.toLocaleString()}〜`
                : "応相談"}
            </p>
          </div>
          <Link
            href={orderHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-pill bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-lg"
          >
            依頼を相談
            <span>→</span>
          </Link>
        </div>
      </div>
      </div>
    </LikeDeltaProvider>
  );
}
