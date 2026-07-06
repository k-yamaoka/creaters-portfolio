import Link from "next/link";
import { getCreators, type CreatorWithRelations } from "@/lib/supabase/queries";
// 2026-06-19: Hero を axis-ov-films.co.jp 風の "100svh フルスクリーン動画 +
// テキストオーバーレイ" 構造に。Supabase 投入済 18 本をシャッフルで順次再生。
// 旧 2 カラム (HeroVideoGrid 縦自動マーキー) は撤去。
import { HeroFullscreen } from "@/components/home/hero-fullscreen";
import { extractHeroVideos, isStockUrl } from "@/lib/hero-videos";
import { HeroUnderBand, type BandWork } from "@/components/home/hero-under-band";
import { WorksDigest, type DigestWork } from "@/components/home/works-digest";
// 2026-07-03 撤去: MarqueeText / AccentVideoTile とも未使用に
// (Co-creation セクション削除、アクセント動画 3 本削除、Marquee 2 本削除)
import {
  Sparkles,
  Building2,
  Video,
  Wallet,
  Search,
  MessageCircle,
  Clapperboard,
} from "lucide-react";
import { SlideInWhenVisible } from "@/components/ui/slide-in-when-visible";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import { ParallaxImage } from "@/components/ui/parallax";
import {
  BrowserFrame,
  MockCreatorDetail,
  MockEstimateChat,
  MockOrders,
} from "@/components/home/feature-mockups";
import { LpCreatorPreview, type LpCreator } from "@/components/home/lp-creator-preview";
import {
  LpPortfolioPreview,
  type LpPortfolioTile,
} from "@/components/home/lp-portfolio-preview";
// 2026-07-03 撤去: GENRES は Ten genres セクション削除に伴い未使用に
import { AiNewsSection } from "@/components/home/ai-news-section";

export const revalidate = 300;

/* =============================================================
 *  2026-06-16 Step 3 で EyebrowLabel (ネオンピル + パルスドット) は撤去。
 *  すべてのセクション見出しは <p className="eyebrow-mono">(0X — Name)</p>
 *  で統一 (Axis 風)。
 * ============================================================= */

// ===== Hero フルスクリーン用 動画ソース抽出 =====
// 2026-06-19: 仮素材 (MDN flower.mp4 / Big Buck Bunny / Jellyfish) は完全撤去。
// Supabase 投入済 AILIER Showcase の portfolio_items から mp4 のみを集めて
// HeroFullscreen に渡す。クライアント側でシャッフル→順次再生する。

// extractHeroVideos / isStockUrl / STOCK_URL_BLACKLIST は 2026-06-24 から
// src/lib/hero-videos.ts に移管し、/creators・/portfolios と共有している。

// Hero 直下動画帯用 — is_featured=true の作品を 4 本まで
function extractBandWorks(creators: CreatorWithRelations[]): BandWork[] {
  const out: BandWork[] = [];
  for (const c of creators) {
    for (const p of c.portfolio_items) {
      if (p.media_type !== "video" || !p.video_url) continue;
      if (!/\.mp4(\?|$)/i.test(p.video_url)) continue;
      if (isStockUrl(p.video_url)) continue;
      if (!p.is_featured) continue;
      out.push({
        id: p.id,
        videoUrl: p.video_url,
        posterUrl: p.thumbnail_url ?? null,
        href: `/creators/${c.id}`,
        title: p.title,
        creatorName: c.profiles.display_name,
      });
    }
  }
  return out.slice(0, 4);
}

// 2026-07-03 撤去: extractAccentVideos / AccentSource type
// (Co-creation セクション + Value Props 上のアクセント動画帯 3 本の
//  両方が削除されたため未使用)

// FEATURE 01 (AIクリエイター検索) の実クリエイター 3 名。
// - 総いいね数の高い順 (人気ティア表示の代わりの並び)
// - 各クリエイターの代表作 (portfolio_items[0]) からサムネを取得
function extractLpCreators(creators: CreatorWithRelations[]): LpCreator[] {
  return creators
    .map((c) => {
      const totalLikes = c.portfolio_items.reduce(
        (sum, p) => sum + (p.like_count ?? 0),
        0
      );
      const firstThumb = c.portfolio_items.find((p) => !!p.thumbnail_url);
      return {
        id: c.id,
        displayName: c.profiles.display_name,
        avatarUrl: c.profiles.avatar_url,
        isVerified: !!c.profiles.is_verified,
        bio: c.bio ?? "",
        minimumOrderAmount: c.minimum_order_amount ?? null,
        strengths: c.strengths ?? [],
        genres: c.genres ?? [],
        thumbnailUrl: firstThumb?.thumbnail_url ?? null,
        totalLikes,
      };
    })
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 3);
}

// FEATURE 02 (ポートフォリオ閲覧) の実サムネギャラリー 8 件。
// 縦型 / 横型 / 正方形 が混ざるようにアスペクト比バランスで抽出。
function extractLpPortfolioTiles(
  creators: CreatorWithRelations[]
): LpPortfolioTile[] {
  const pool: LpPortfolioTile[] = [];
  for (const c of creators) {
    for (const p of c.portfolio_items) {
      if (!p.thumbnail_url) continue;
      pool.push({
        id: p.id,
        href: `/creators/${c.id}`,
        thumbnailUrl: p.thumbnail_url,
        title: p.title,
        aspect:
          p.aspect_ratio === "vertical"
            ? "vertical"
            : p.aspect_ratio === "square"
              ? "square"
              : "horizontal",
        likeCount: p.like_count ?? 0,
      });
    }
  }
  // 縦横バランス調整: 横型 4 + 縦型 2 + 正方形 2 目安、いいね順で取得
  pool.sort((a, b) => b.likeCount - a.likeCount);
  const h = pool.filter((t) => t.aspect === "horizontal").slice(0, 4);
  const v = pool.filter((t) => t.aspect === "vertical").slice(0, 2);
  const s = pool.filter((t) => t.aspect === "square").slice(0, 2);
  // 見た目のバランスを取るため horizontal と vertical を交互に配置
  const mixed: LpPortfolioTile[] = [];
  const maxLen = Math.max(h.length, v.length, s.length);
  for (let i = 0; i < maxLen; i++) {
    if (h[i]) mixed.push(h[i]);
    if (v[i]) mixed.push(v[i]);
    if (s[i]) mixed.push(s[i]);
  }
  return mixed.slice(0, 8);
}

// Works ダイジェスト用 — 全 mp4 作品をフラット化、アスペクト比は数値に換算
function extractDigestWorks(creators: CreatorWithRelations[]): DigestWork[] {
  const out: DigestWork[] = [];
  for (const c of creators) {
    for (const p of c.portfolio_items) {
      if (p.media_type !== "video" || !p.video_url) continue;
      if (!/\.mp4(\?|$)/i.test(p.video_url)) continue;
      if (isStockUrl(p.video_url)) continue;
      const aspectRatio =
        p.aspect_ratio === "vertical"
          ? 9 / 16
          : p.aspect_ratio === "square"
            ? 1
            : 16 / 9;
      out.push({
        id: p.id,
        videoUrl: p.video_url,
        posterUrl: p.thumbnail_url ?? null,
        href: `/creators/${c.id}`,
        title: p.title,
        creatorName: c.profiles.display_name,
        genre: p.genre,
        aspectRatio,
      });
    }
  }
  return out;
}

// 2026-07-02 撤去: AI_TOOL_LABELS は Compatible models 帯で使用していたが、
// セクションごと削除したため未使用に。

// NN/g: 「22 人」「23 本」などの低い実数は negative social proof になるため、
// 定性的な価値プロップに置換する。
const VALUE_PROPS = [
  {
    icon: Video,
    title: "撮影不要",
    body: "ロケ・スタジオ手配ゼロ。AI 生成 + 編集で完結します。",
  },
  {
    icon: Building2,
    title: "完全リモート",
    body: "オンラインのみで構成から納品まで進行できます。",
  },
  {
    icon: Sparkles,
    title: "構成から納品まで一貫",
    body: "プロンプト設計・編集・テロップ・BGM をワンストップで。",
  },
  {
    icon: Wallet,
    title: "登録無料",
    body: "案件成立時のみ手数料。掲載・閲覧は無料です。",
  },
] as const;

export default async function HomePage() {
  const allCreators = await getCreators();

  // 2026-07-03: genreCount / accent は各セクション削除に伴い不要
  const heroVideos = extractHeroVideos(allCreators);
  const bandWorks = extractBandWorks(allCreators);
  const digestWorks = extractDigestWorks(allCreators);
  const lpCreators = extractLpCreators(allCreators);
  const lpTiles = extractLpPortfolioTiles(allCreators);

  return (
    <>
      {/* =================================================
          HERO — axis-ov-films.co.jp 風 フルスクリーン (2026-06-19 改修)
            ・100svh 背景動画 を 18 本シャッフルで連続再生
            ・テキスト/CTA は左下にオーバーレイ (動画の上に動画を重ねない原則)
            ・暗背景 + 白文字。Header は透過モードのまま (home top で発火)
          ================================================= */}
      <HeroFullscreen videos={heroVideos}>
        {/* === 左サイド: 縦書き mono ラベル === */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 md:block"
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.32em] text-paper/45"
            style={{ writingMode: "vertical-rl" }}
          >
            (AILIER — REEL 2026)
          </p>
        </div>

        {/* === 下端: テキスト + CTA (Axis 風 左寄せ) === */}
        <div className="mt-auto pb-20 pt-32 sm:pb-28 lg:pb-32">
          <div className="max-w-xl lg:max-w-2xl">
            <RevealOnScroll delay={0}>
              <p className="inline-flex items-center gap-2 rounded-pill border border-paper/20 bg-paper/[0.04] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-paper/75 backdrop-blur-sm">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-neon-pink to-neon-cyan"
                />
                AI Creators Platform
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={120}>
              <h1 className="headline-display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] text-paper">
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                  AIクリエイター
                </span>
                と、
                <br />
                企業をつなぐ。
              </h1>
            </RevealOnScroll>

            <RevealOnScroll delay={240}>
              <p className="body-jp mt-6 max-w-prose-jp text-sm text-paper/85 sm:text-base">
                Sora・Veo・Runway・Seedance を使いこなすクリエイターに、
                SNS広告動画・商品紹介・採用動画を依頼できる専門マッチング
                プラットフォーム。撮影不要・完全リモート・低予算で、構成から
                完成までおまかせ。
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={360}>
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,77,157,0.55)] transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-10px_rgba(255,77,157,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-pink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-deep"
                >
                  無料ではじめる
                </Link>
                <Link href="/creators" className="btn-axis-ghost">
                  クリエイターを探す
                </Link>
              </div>
            </RevealOnScroll>

            {/* スクロールヒント */}
            <RevealOnScroll delay={520} className="mt-12">
              <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/55">
                <span aria-hidden>▾</span>
                <span>(Scroll to explore)</span>
              </span>
            </RevealOnScroll>
          </div>
        </div>
      </HeroFullscreen>

      {/* Section 5: Hero 直下動画帯 — 注目 4 本を横一列に並べ常時微再生 */}
      <HeroUnderBand works={bandWorks} />

      {/* 2026-07-03 撤去:
          - MarqueeText "AI Video Creators — For Business" (装飾横スクロール)
          - アクセント動画帯 3 本 (accent.horizontals)
          - Compatible models 帯 (前 commit で撤去済)
          いずれも視線の流れを重くし、Value Props への遷移を鈍らせていたため。 */}

      {/* =================================================
          VALUE PROPS — 罫線で 4 等分された単一の帯 (Axis 風)
          ================================================= */}
      <section className="relative bg-paper text-ink">
        <div className="relative mx-auto max-w-wide px-6 lg:px-10">
          <div className="grid grid-cols-1 divide-y divide-ink/10 border-y border-ink/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {VALUE_PROPS.map((v, i) => {
              const Icon = v.icon;
              return (
                <RevealOnScroll
                  key={v.title}
                  delay={i * 80}
                  className="p-10 sm:p-12"
                >
                  <Icon
                    size={20}
                    strokeWidth={1.2}
                    className="text-sand"
                    aria-hidden
                  />
                  <p className="mt-8 font-display text-lg font-medium text-ink">
                    {v.title}
                  </p>
                  <p className="body-jp mt-3 text-sm text-ink/60">
                    {v.body}
                  </p>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2026-07-03 撤去: 02 — Co-creation ("Create together. Nurture together.")
          セクション全体。AccentVideoTile 縦型 1 枚も同時撤去。
          撤去理由: 詩的コピーが LP のスクロール量を膨らませていた。
          共創メッセージは Value Props と FEATURE で機能ベースに置換済。 */}

      {/* Section 5: Works ダイジェスト — タブ切替で 18 本フィルタリング */}
      <WorksDigest works={digestWorks} />

      {/* 2026-07-03 撤去:
          MarqueeText "View More Works — Made With AI" (装飾横スクロール)。
          Works ダイジェスト → FEATURE 03 の遷移を短く。 */}

      {/* =================================================
          03 — Service (旧 FEATURES) — 5 機能をアシンメトリーに展開
          2026-07-02 改修:
            ・各 FeatureRow を独立ストライプ化 (奇数 bg-gray-50 / 偶数 bg-white)
              → セクション区切りを明確に、視線移動をリズミカルに
            ・FEATURE 01: 実クリエイター上位 3 名を LpCreatorPreview で表示
              (fade-in-up + stagger 演出)
            ・FEATURE 02: 実ポートフォリオサムネ 8 件を LpPortfolioPreview
              で表示 (縦横混在グリッド + fade-in-up stagger)
          2026-06-19 起点:
            ・各 FeatureRow に特大背景タイポ (アウトライン文字) をパララックス
              で敷く (映像を重ねない原則: 動画は前面 1 層のみ、背景は文字)
            ・親 section に overflow-x: hidden で横スクロールバー防止
          ================================================= */}
      <section
        id="features"
        className="relative overflow-x-hidden text-ink"
      >
        {/* 2026-07-03 撤去: FEATURE セクションの見出し帯
            ("Movie commerce, end-to-end." + 説明文)。
            LP スクロール量削減。5 つの FeatureRow が各機能を語るため
            冒頭見出しは冗長と判断。 */}

        {/* F1: クリエイター検索 (奇数 → 薄グレー) */}
        <div className="relative overflow-hidden bg-gray-50">
          <div className="relative mx-auto max-w-wide px-gutter py-10 lg:py-14">
            <FeatureRow
              no="FEATURE 01 ／ できること 01"
              title="AIクリエイター検索"
              body="ジャンル・料金・強み・対応尺で絞り込み、人気度ティアでハイライトされたクリエイターを一覧で比較。ホバーで作品サムネが自動再生されます。"
              bullets={[
                "ジャンル × 強み × 価格レンジで絞り込み",
                "総いいね数で人気クリエイターを可視化 (Gold/Silver)",
                "サムネをホバーすると作品動画が即プレビュー",
              ]}
              cta={{ href: "/creators", label: "クリエイターを探す" }}
              mock={
                <BrowserFrame url="ailier.app/creators">
                  <LpCreatorPreview creators={lpCreators} />
                </BrowserFrame>
              }
            />
          </div>
        </div>

        {/* F2: ポートフォリオ閲覧 (偶数 → 白) */}
        <div className="relative overflow-hidden bg-white">
          <div className="relative mx-auto max-w-wide px-gutter py-10 lg:py-14">
            <FeatureRow
              reverse
              no="FEATURE 02 ／ できること 02"
              title="ポートフォリオ閲覧"
              body="クリエイター横断で作品をまとめて見られる作品ギャラリー。横型・縦型・正方形が混在した自然な並び。気に入った作品にはいいね（即時集計）も。"
              bullets={[
                "縦型 / 横型 / 正方形 が混在する自然なグリッド",
                "ホバーで動画再生、クリックで詳細モーダル",
                "いいねでお気に入りクリエイターを発見",
              ]}
              cta={{ href: "/portfolios", label: "作品を見る" }}
              mock={
                <BrowserFrame url="ailier.app/portfolios">
                  <LpPortfolioPreview tiles={lpTiles} />
                </BrowserFrame>
              }
            />
          </div>
        </div>

        {/* F3: 詳細 + 最低対応プラン (奇数 → 薄グレー) */}
        <div className="relative overflow-hidden bg-gray-50">
          <div className="relative mx-auto max-w-wide px-gutter py-10 lg:py-14">
            <FeatureRow
              no="FEATURE 03 ／ できること 03"
              title="クリエイター詳細 ＋ 最低対応プラン公開"
              body="代表作 / 強み / 対応尺 / 使用ソフトをまとめて把握。最低対応プランは内容・納期・修正回数まで開示されているので、相談前にイメージが固まります。"
              bullets={[
                "代表作はヒーロー右側に大きく配置",
                "最低対応プラン (¥30,000〜 等) を内訳まで公開",
                "ワンクリックで「依頼を相談」フローへ",
              ]}
              cta={{ href: "/creators", label: "詳細ページを見る" }}
              mock={
                <BrowserFrame url="ailier.app/creators/[id]">
                  <MockCreatorDetail />
                </BrowserFrame>
              }
            />
          </div>
        </div>

        {/* F4: AI 見積もりチャット (偶数 → 白) */}
        <div className="relative overflow-hidden bg-white">
          <div className="relative mx-auto max-w-wide px-gutter py-10 lg:py-14">
            <FeatureRow
              reverse
              no="FEATURE 04 ／ できること 04"
              title="AI 見積もりチャット"
              body="クリエイターの公開料金を元に、AI が概算見積もりと推奨プランを即時返答。「気軽に相談」のハードルを最小化します。"
              bullets={[
                "Claude ベースの AI が概算金額を即時提案",
                "公開パッケージから最適プランを自動レコメンド",
                "深い相談はそのままメッセージで継続",
              ]}
              cta={{ href: "/creators", label: "AI と相談してみる" }}
              mock={
                <BrowserFrame url="ailier.app/creators/[id] (estimate)">
                  <MockEstimateChat />
                </BrowserFrame>
              }
            />
          </div>
        </div>

        {/* F5: 取引管理 (奇数 → 薄グレー) */}
        <div className="relative overflow-hidden bg-gray-50">
          <div className="relative mx-auto max-w-wide px-gutter py-10 lg:py-14">
            <FeatureRow
              no="FEATURE 05 ／ できること 05"
              title="エスクロー決済 ＋ 取引管理"
              body="発注金額はプラットフォームが預かり、納品確認後にクリエイターへ送金。両者にとって安全な取引フローと、進行中の案件を一覧で管理できるダッシュボード。"
              bullets={[
                "Stripe 連携で仮払い → 検収後に自動送金",
                "案件のステータス (制作中 / 納品済 / 支払完了) を一覧化",
                "メッセージ・ファイル・契約条件を 1 取引でひとまとめ",
              ]}
              cta={{ href: "/dashboard/orders", label: "取引管理を見る" }}
              mock={
                <BrowserFrame url="ailier.app/dashboard/orders">
                  <MockOrders />
                </BrowserFrame>
              }
            />
          </div>
        </div>
      </section>

      {/* =================================================
          04 — Process (旧 HOW TO USE) — 3 ステップを罫線縦割りに
          ================================================= */}
      <section id="how" className="relative bg-paper text-ink">
        <div className="relative mx-auto max-w-wide px-gutter py-10 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
            <RevealOnScroll delay={0}>
              <p className="eyebrow-mono">(04 — Process)<span className="ml-2 text-ink/35">／ ご利用の流れ</span></p>
            </RevealOnScroll>
            <div>
              <RevealOnScroll delay={80}>
                <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-ink">
                  How it{" "}
                  <span className="italic text-sand">works.</span>
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="body-jp mt-8 max-w-prose-jp text-ink/70">
                  発注の流れ、3 つのステップで。
                </p>
              </RevealOnScroll>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 border-y border-ink/10 divide-y divide-ink/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {[
              {
                step: "Step 01",
                title: "クリエイターを探す",
                body: "ジャンル・料金・実績で絞り込み、ポートフォリオをホバー再生で比較。気になるクリエイターをブックマーク。",
                Icon: Search,
              },
              {
                step: "Step 02",
                title: "依頼を相談する",
                body: "詳細ページから「依頼を相談」をクリック。AI 見積もりチャットや直接メッセージで、内容・本数・尺をすり合わせ。",
                Icon: MessageCircle,
              },
              {
                step: "Step 03",
                title: "制作・納品 ＋ 検収",
                body: "エスクローで仮払い → 制作開始 → 納品確認後に自動送金。進行中はメッセージ画面で一気通貫。",
                Icon: Clapperboard,
              },
            ].map((s, i) => (
              <RevealOnScroll
                key={s.step}
                delay={i * 100}
                className="p-8 sm:p-10 lg:p-12"
              >
                <s.Icon
                  size={28}
                  strokeWidth={1.2}
                  className="text-sand"
                  aria-hidden
                />
                <p className="eyebrow-mono mt-10">{s.step}</p>
                <h3 className="font-display mt-3 text-2xl font-medium text-ink">
                  {s.title}
                </h3>
                <p className="body-jp mt-4 text-sm text-ink/65">{s.body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 2026-07-03 撤去: 05 — Categories (Ten genres, one stage.)
          セクション全体。ジャンル情報は各クリエイターページの絞込フィルタや
          カード内タグに散在しているため、TOP 独立枠は冗長。 */}

      {/* =================================================
          05.5 — News: 生成 AI 動画 最新ニュース (Vercel Cron 日次更新)
          サーバコンポーネントで getCachedAiNews() を await、
          og:title と og:image URL のみ表示 (本文/リード文は取得しない)
          ================================================= */}
      <AiNewsSection />

      {/* =================================================
          06 — FAQ — 罫線で区切ったアコーディオン (カード型廃止)
          ================================================= */}
      <section className="relative bg-paper text-ink">
        <div className="relative mx-auto max-w-narrow px-gutter py-10 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
            <RevealOnScroll delay={0}>
              <p className="eyebrow-mono">(06 — FAQ)<span className="ml-2 text-ink/35">／ よくある質問</span></p>
            </RevealOnScroll>
            <div>
              <RevealOnScroll delay={80}>
                <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-ink">
                  <span className="italic text-sand">Questions.</span>
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="body-jp mt-8 max-w-prose-jp text-ink/70">
                  発注前に、よくある質問。
                </p>
              </RevealOnScroll>
            </div>
          </div>

          <RevealOnScroll
            delay={120}
            className="mt-12 border-y border-ink/10"
          >
            <ul className="divide-y divide-ink/10">
              {[
                {
                  q: "動画 1 本の費用はどれくらいかかりますか？",
                  a: "クリエイターと内容によりますが、SNS 広告 15 秒なら ¥30,000 〜 が目安です。詳細ページで最低対応プランの内訳が公開されているので、相談前に概算が把握できます。AI 見積もりチャットも併用ください。",
                },
                {
                  q: "制作期間はどれくらいですか？",
                  a: "クリエイターと作品の規模によって異なります。1 本単発の SNS 広告であれば数日、シリーズ展開やコーポレートVPは 1〜3 週間が目安です。納期は依頼時にクリエイターと合意できます。",
                },
                {
                  q: "修正は何回まで対応してもらえますか？",
                  a: "プランごとに修正回数が明示されています (例: 2 回まで)。追加修正が必要な場合は別途見積もりで対応します。",
                },
                {
                  q: "著作権は誰に帰属しますか？",
                  a: "完成物の利用権は発注者に譲渡されます (詳細はクリエイターと取り交わす契約内容に従います)。AI 生成素材のライセンスもプラン明細で確認できます。",
                },
                {
                  q: "支払いはいつ発生しますか？",
                  a: "案件成立時にエスクロー (仮払い) します。納品確認後にプラットフォームからクリエイターへ送金され、検収完了までは万一のトラブルでも全額返金可能です。",
                },
                {
                  q: "AILIER の手数料はどれくらいですか？",
                  a: "取引金額に対するシステム手数料が発生します。手数料はクリエイター側の報酬から差し引かれる形のため、発注者側の追加負担はありません。",
                },
              ].map((f, i) => {
                const num = String(i + 1).padStart(2, "0");
                return (
                  <li key={i}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-6 sm:gap-6 sm:py-8">
                        <span className="flex min-w-0 flex-1 items-baseline gap-3 sm:gap-6">
                          <span className="eyebrow-mono shrink-0">
                            Q.{num}
                          </span>
                          <span className="font-display min-w-0 text-base font-medium text-ink sm:text-xl">
                            {f.q}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/30 text-ink/60 transition-transform duration-300 group-open:rotate-180"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                        </span>
                      </summary>
                      <div className="flex items-start gap-3 pb-8 sm:gap-6 sm:pb-10">
                        <span className="eyebrow-mono shrink-0">A.{num}</span>
                        <p className="body-jp text-sm text-ink/70 sm:text-base">
                          {f.a}
                        </p>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </RevealOnScroll>
        </div>
      </section>

      {/* =================================================
          07 — Start — 締めの一行ステートメント (Axis "Every story…" オマージュ)
          ================================================= */}
      <section className="relative bg-paper text-ink">
        <div className="relative mx-auto max-w-narrow px-gutter py-16 text-center">
          <RevealOnScroll delay={0}>
            <p className="eyebrow-mono">(07 — Start)<span className="ml-2 text-ink/35">／ はじめる</span></p>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <h2 className="headline-display mt-12 text-[clamp(2.75rem,7vw,6rem)] text-ink">
              Every story
              <br />
              starts with{" "}
              <span className="italic text-sand">us.</span>
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={240}>
            <p className="body-jp mx-auto mt-12 max-w-prose-jp text-ink/60">
              プロフィール閲覧は無料、依頼前にチャット相談も。
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={360}>
            <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/creators" className="btn-axis">
                Browse creators
              </Link>
              <Link href="/register" className="btn-axis-ghost">
                クリエイター登録
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}

/* =============================================================
 *  FeatureRow — 機能セクションの 1 行
 *  左にコピー (no/title/body/bullets/cta)、右にモック (またはその逆)
 * ============================================================= */
function FeatureRow({
  no,
  title,
  body,
  bullets,
  cta,
  mock,
  reverse = false,
}: {
  no: string;
  title: string;
  body: string;
  bullets: string[];
  cta: { href: string; label: string };
  mock: React.ReactNode;
  reverse?: boolean;
}) {
  // Step 3 (2026-06-16): Axis アシンメトリーへ。モック側 62% / テキスト 38%。
  // 内側の SlideInWhenVisible (横方向 stagger) は 引き続き使用。
  // 2026-06-19 Section 3 改修: 背面に特大アウトライン番号タイポを敷き、
  // パララックスで前景テキスト/モックと異なる速度で漂わせる。
  const textDir = reverse ? "right" : "left";
  const mockDir = reverse ? "left" : "right";

  // 番号タグ "FEATURE 01 / 060" を Axis "060" 風に組む。
  const axisNo = no.replace("FEATURE ", "Feature ");
  // 特大タイポ表示用に "FEATURE 01 ／ できること 01" から "01" だけ抽出
  const bigNumber = no.match(/(\d+)/)?.[1] ?? "00";

  return (
    <div className="relative">
      {/* === 背景 特大タイポ (アウトライン) — 映像でなく文字 ===
          2026-07-03 3 回目調整: F01/F02 だけ数字が隠れる件を修正。
          原因: FeatureRow の mock 列は BrowserFrame + bg-paper が
          完全 opaque。数字は mock 側に配置していたため、mock の
          裏に完全に埋もれて視認不能だった (F03-F05 は mock 高さが
          低くたまたま漏れて見えていた)。
          対策: 数字位置を TEXT 列側 (背景透過) に反転。
          テキスト要素との重なりは stroke opacity 0.30 で控えめに。 */}
      <ParallaxImage
        intensity={0.08}
        className={`pointer-events-none absolute top-[50%] -translate-y-1/2 z-0 ${
          reverse ? "-right-4 lg:right-[-2vw]" : "-left-4 lg:left-[-2vw]"
        }`}
      >
        <span
          aria-hidden
          className="block font-display font-semibold leading-none tracking-[-0.04em] text-[clamp(6rem,15vw,14rem)]"
          style={{
            color: "transparent",
            WebkitTextStroke: "2px rgba(10,13,18,0.30)",
          }}
        >
          {bigNumber}
        </span>
      </ParallaxImage>

      <div
        className={`relative z-10 grid grid-cols-1 items-start gap-8 sm:gap-12 lg:gap-24 ${
          reverse ? "lg:grid-cols-[1.62fr,1fr]" : "lg:grid-cols-[1fr,1.62fr]"
        }`}
      >
        {/* テキスト側 — 上揃え、明朝、罫線リスト */}
        <div className={reverse ? "lg:order-2" : ""}>
          <SlideInWhenVisible direction={textDir} delay={0}>
            <p className="eyebrow-mono">{axisNo}</p>
          </SlideInWhenVisible>
          <SlideInWhenVisible direction={textDir} delay={80}>
            <h3 className="font-display mt-8 text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.15] tracking-tight text-ink">
              {title}
            </h3>
          </SlideInWhenVisible>
          <SlideInWhenVisible direction={textDir} delay={160}>
            <p className="body-jp mt-6 text-ink/70">{body}</p>
          </SlideInWhenVisible>
          <ul className="mt-10 border-t border-ink/10">
            {bullets.map((b, i) => (
              <SlideInWhenVisible
                key={b}
                direction={textDir}
                delay={240 + i * 80}
              >
                <li className="flex items-start gap-4 border-b border-ink/10 py-4">
                  <span className="eyebrow-mono shrink-0 pt-[3px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="body-jp flex-1 text-sm text-ink/80">
                    {b}
                  </span>
                </li>
              </SlideInWhenVisible>
            ))}
          </ul>
          <SlideInWhenVisible
            direction={textDir}
            delay={240 + bullets.length * 80}
          >
            <div className="mt-10">
              {/* 白基調なので light 版 ghost を使用 */}
              <Link href={cta.href} className="btn-axis-ghost-light">
                {cta.label}
              </Link>
            </div>
          </SlideInWhenVisible>
        </div>

        {/* モック側 — 操作画面の動画 / モックを 1 層だけ重ねる
            (映像を重ねない原則: 背景は特大タイポのみ、動画は前面 1 層) */}
        <SlideInWhenVisible
          direction={mockDir}
          delay={120}
          className={reverse ? "lg:order-1" : ""}
        >
          {/* parallax で背景タイポと前面モックの速度差を作り奥行きを出す */}
          <ParallaxImage intensity={0.05}>{mock}</ParallaxImage>
        </SlideInWhenVisible>
      </div>
    </div>
  );
}
