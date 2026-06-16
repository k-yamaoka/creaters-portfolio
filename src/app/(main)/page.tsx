import Link from "next/link";
import { getCreators } from "@/lib/supabase/queries";
import { RetroSun } from "@/components/ui/illustrations-retrowave";
import { HeroVideoGrid, type GridTile } from "@/components/home/hero-video-grid";
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
import {
  BrowserFrame,
  MockCreatorsList,
  MockPortfoliosGrid,
  MockCreatorDetail,
  MockEstimateChat,
  MockOrders,
} from "@/components/home/feature-mockups";
import { GENRES } from "@/lib/constants";

export const revalidate = 300;

/* =============================================================
 *  小さなプリミティブ — セクション見出し共通
 * ============================================================= */
function EyebrowLabel({
  text,
  tone = "pink",
}: {
  text: string;
  tone?: "pink" | "cyan" | "purple";
}) {
  const styles =
    tone === "cyan"
      ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
      : tone === "purple"
        ? "border-neon-purple/40 bg-neon-purple/10 text-neon-purple"
        : "border-neon-pink/40 bg-neon-pink/10 text-neon-pink-soft";
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-pill border px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] ${styles}`}
    >
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      {text}
    </p>
  );
}

// MP4 直リンクのみを対象に Hero グリッド用タイルを抽出。
// 各タイルは元動画の比率 (aspect_ratio: vertical / horizontal / square) を
// そのまま GridTile に持たせる (= グリッドで原寸表示できる)。
const MP4_RE = /\.mp4(\?|$)/i;
function extractHeroTiles(
  creators: Awaited<ReturnType<typeof getCreators>>
): GridTile[] {
  const out: GridTile[] = [];
  for (const c of creators) {
    for (const p of c.portfolio_items) {
      if (p.media_type !== "video") continue;
      if (!p.video_url || !MP4_RE.test(p.video_url)) continue;
      const a =
        p.aspect_ratio === "vertical"
          ? ("vertical" as const)
          : p.aspect_ratio === "square"
            ? ("square" as const)
            : ("video" as const);
      out.push({
        src: p.video_url,
        poster: p.thumbnail_url ?? null,
        href: `/creators/${c.id}`,
        alt: `${c.profiles.display_name} の作品「${p.title}」`,
        aspect: a,
      });
    }
  }
  return out;
}

// ★ 本番素材への差し替えポイント ★
// 本配列を編集するだけで仮素材 → AI 生成作品へ置換可能。
// aspect は "video" (16:9) / "vertical" (9:16) / "square" (1:1) / "tall" (4:5)
// を混在させると Masonry っぽい不揃いな並びになり、対応形式の幅広さを伝えやすい。
const FALLBACK_HERO_TILES: GridTile[] = [
  {
    src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 1 (仮素材)",
    aspect: "vertical",
  },
  {
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 2 (仮素材)",
    aspect: "video",
  },
  {
    src: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 3 (仮素材)",
    aspect: "video",
  },
  {
    src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 4 (仮素材)",
    aspect: "square",
  },
  {
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 5 (仮素材)",
    aspect: "vertical",
  },
  {
    src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/1080/Jellyfish_1080_10s_2MB.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 6 (仮素材)",
    aspect: "tall",
  },
  {
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 7 (仮素材)",
    aspect: "video",
  },
  {
    src: "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_2MB.mp4",
    poster: null,
    href: "/portfolios",
    alt: "作品サンプル 8 (仮素材)",
    aspect: "vertical",
  },
];

// Hero 直下に並べる対応 AI ツール (静的 1 段、自動スクロールなし)。
// NN/g: 自動マーキー禁止 / Midjourney は除外。
const AI_TOOL_LABELS = [
  "Sora",
  "Veo",
  "Runway",
  "Seedance",
  "Kling",
  "Hailuo",
] as const;

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

  const genreCount = GENRES.length;

  // Hero 動画タイル: DB から 8 件以上集まれば DB 素材、無ければ仮素材
  const dbTiles = extractHeroTiles(allCreators);
  const heroTiles = dbTiles.length >= 6 ? dbTiles : FALLBACK_HERO_TILES;

  return (
    <>
      {/* =================================================
          HERO — 2 カラム (NN/g 準拠リライト 2026-06-16)
            - 左 ~45%: 価値提案テキスト + 主従 CTA 2 つ
            - 右 ~55%: 縦 9:16 グリッド (静止デフォルト / hover で再生)
            - 自動マーキー・自動再生・装飾的なバウンスは禁止
            - ヒーロー直下に AI ツール ロゴ帯 (静的) + 4 つの定性価値
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(157,92,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div
          aria-hidden
          className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-neon-pink opacity-25 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute -right-20 top-24 h-[360px] w-[360px] rounded-full bg-neon-cyan opacity-20 blur-[100px]"
        />

        <div className="relative mx-auto max-w-container px-6 pb-16 pt-16 lg:px-10 lg:pb-20 lg:pt-20">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-14">
            {/* === 左カラム: テキスト + CTA === */}
            <div className="w-full motion-safe:animate-[fadeUp_.45s_ease-out_both] lg:w-[44%]">
              <EyebrowLabel text="AI CREATORS PLATFORM" />

              <h1 className="mt-6 text-[2.5rem] font-black leading-[1.08] tracking-tight sm:text-[3.6rem] lg:text-[3.75rem]">
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                  AIクリエイター
                </span>
                と、
                <br />
                <span className="text-white">企業をつなぐ。</span>
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-[1.9] text-white/75">
                Sora・Veo・Runway・Seedance を使いこなすクリエイターに、
                <span className="font-bold text-white">
                  SNS広告動画・商品紹介・採用動画
                </span>
                を依頼できる専門マッチングプラットフォーム。
                <br />
                撮影不要・完全リモート・低予算で、構成から完成までおまかせ。
              </p>

              {/* CTA: 主 1 + 副 1 (NN/g: filled は 1 つに絞る・具体的ラベル) */}
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-7 py-3.5 text-base font-bold text-white shadow-[0_0_28px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(255,77,157,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-pink"
                >
                  無料ではじめる
                  <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/creators"
                  className="inline-flex items-center justify-center gap-2 rounded-pill border-2 border-white/30 bg-white/[0.04] px-7 py-3.5 text-base font-bold text-white transition-colors hover:border-white/60 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
                >
                  クリエイターを探す
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>

            {/* === 右カラム: 縦自動マーキー × 原寸アスペクト Masonry (3 列) === */}
            <div className="w-full lg:w-[56%]">
              <HeroVideoGrid tiles={heroTiles} desktopColumns={3} />
            </div>
          </div>

          {/* Hero 直下の対応 AI ツール 1 段 (静的・自動スクロールなし) */}
          <div className="mt-14 border-t border-white/10 pt-8">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              Supports leading AI tools
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-12">
              {AI_TOOL_LABELS.map((t) => (
                <span
                  key={t}
                  className="text-sm font-bold tracking-tight text-white/55 transition-colors hover:text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          VALUE PROPS — 定性 4 カラム (旧 stats 4 数値の代替)
            NN/g: 「最短 2 日」「AB案 10 倍」など誇張数値や少なさが露呈する
            実数を避け、撮影不要/完全リモート/一貫/登録無料 で示す
          ================================================= */}
      <section className="relative bg-neon-midnight py-14 text-white">
        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neon-pink/15 to-neon-purple/15 text-neon-pink"
                  >
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{v.title}</p>
                    <p className="mt-1 text-xs leading-[1.7] text-white/65">
                      {v.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================
          PAIN POINTS — ＼こんな悩みありませんか？／
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight py-24 text-white">
        <div className="pointer-events-none absolute -left-32 top-12 h-[420px] w-[420px] rounded-full bg-neon-pink opacity-15 blur-[140px] animate-glow-pulse" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-neon-cyan opacity-10 blur-[120px] animate-glow-pulse-slow" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <EyebrowLabel text="FOR BUSINESS" tone="cyan" />
            <h2 className="mt-6 text-[2rem] font-black leading-[1.2] sm:text-[2.75rem]">
              <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                ＼こんなお悩み
              </span>
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-neon-purple to-neon-cyan bg-clip-text text-transparent">
                ありませんか？／
              </span>
            </h2>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:gap-6">
            {[
              {
                no: "CASE 1",
                title: "誰に頼めばいいか分からない",
                body: "「AI動画を作れるクリエイター」と検索しても、実績や品質がバラバラで判断できない。試しに発注して失敗するリスクが高い。",
              },
              {
                no: "CASE 2",
                title: "制作会社は高くて手が出ない",
                body: "1本数百万円が当たり前。AB案を回したくても予算が一瞬で消えてしまい、量で勝負できない。",
              },
              {
                no: "CASE 3",
                title: "AI動画の品質を見極められない",
                body: "Sora・Veo・Runway を使う人は増えたが、プロンプト力やブランド整合性まで担保できる人は少ない。",
              },
            ].map((p) => (
              <article
                key={p.no}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm transition-colors hover:border-neon-pink/30"
              >
                <span className="inline-block rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-neon-pink-soft">
                  {p.no}
                </span>
                <h3 className="mt-4 text-xl font-black sm:text-2xl">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-[2] text-white/65">
                  {p.body}
                </p>
              </article>
            ))}
          </div>

          {/* Solution headline (en-tech 風の太字遷移) */}
          <div className="mt-16 rounded-3xl border border-neon-pink/40 bg-gradient-to-br from-neon-pink/15 via-neon-purple/15 to-neon-cyan/15 p-8 text-center backdrop-blur-md sm:p-12">
            <p className="text-xs font-black tracking-[0.2em] text-neon-pink-soft">
              AILIER なら
            </p>
            <p className="mt-3 text-2xl font-black leading-[1.4] sm:text-3xl lg:text-4xl">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                AI クリエイターの作品・料金・実績
              </span>
              <br />
              を一覧で比較して、
              <span className="text-neon-pink">1 分で相談</span>
              できます！
            </p>
          </div>
        </div>
      </section>

      {/* =================================================
          FEATURES — 主な機能 (UI モック付き)
          ================================================= */}
      <section
        id="features"
        className="relative overflow-hidden bg-neon-midnight-deep py-28 text-white"
      >
        <div className="pointer-events-none absolute -right-32 top-24 h-[480px] w-[480px] rounded-full bg-neon-purple opacity-15 blur-[140px] animate-glow-pulse-slow" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-[400px] w-[400px] rounded-full bg-neon-cyan opacity-10 blur-[120px] animate-glow-pulse" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <EyebrowLabel text="FEATURES / 主な機能紹介" />
            <h2 className="mt-6 text-[2rem] font-black leading-[1.2] sm:text-[2.75rem]">
              実際の操作画面で見る
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                AILIER の機能
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-[2] text-white/65">
              発注前の比較から、見積もり相談、納品・決済まで、案件に必要な機能が
              ひとつのプラットフォームに揃っています。
            </p>
          </div>

          {/* Feature blocks — モック画像を左右交互配置 */}
          <div className="mt-20 space-y-24">
            {/* F1: クリエイター検索 */}
            <FeatureRow
              no="FEATURE 01"
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
                  <MockCreatorsList />
                </BrowserFrame>
              }
            />

            {/* F2: ポートフォリオ閲覧 */}
            <FeatureRow
              reverse
              no="FEATURE 02"
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
                  <MockPortfoliosGrid />
                </BrowserFrame>
              }
            />

            {/* F3: 詳細 + 最低対応プラン */}
            <FeatureRow
              no="FEATURE 03"
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

            {/* F4: AI 見積もりチャット */}
            <FeatureRow
              reverse
              no="FEATURE 04"
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

            {/* F5: 取引管理 (エスクロー) */}
            <FeatureRow
              no="FEATURE 05"
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
          HOW TO USE — 3 ステップ
          ================================================= */}
      <section
        id="how"
        className="relative overflow-hidden bg-neon-midnight py-28 text-white"
      >
        <div className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-neon-pink opacity-15 blur-[140px] animate-glow-pulse" />
        <div className="pointer-events-none absolute -right-32 bottom-12 h-[420px] w-[420px] rounded-full bg-neon-cyan opacity-10 blur-[120px] animate-glow-pulse-slow" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <EyebrowLabel text="HOW TO USE / 使い方" tone="cyan" />
            <h2 className="mt-6 text-[2rem] font-black leading-[1.2] sm:text-[2.75rem]">
              依頼開始まで
              <span className="bg-gradient-to-r from-neon-cyan to-neon-pink bg-clip-text text-transparent">
                最短 3 ステップ
              </span>
            </h2>
          </div>

          <div className="relative mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-neon-pink/40 to-transparent lg:block" />

            {[
              {
                step: "STEP 1",
                title: "クリエイターを探す",
                body: "ジャンル・料金・実績で絞り込み、ポートフォリオをホバー再生で比較。気になるクリエイターをブックマーク。",
                Icon: Search,
              },
              {
                step: "STEP 2",
                title: "依頼を相談する",
                body: "詳細ページから「依頼を相談」をクリック。AI 見積もりチャットや直接メッセージで、内容・本数・尺をすり合わせ。",
                Icon: MessageCircle,
              },
              {
                step: "STEP 3",
                title: "制作・納品 ＋ 検収",
                body: "エスクローで仮払い → 制作開始 → 納品確認後に自動送金。進行中はメッセージ画面で一気通貫。",
                Icon: Clapperboard,
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-7 pt-12 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-neon-pink/40 hover:shadow-[0_20px_50px_-15px_rgba(255,77,157,0.4)]"
              >
                <span
                  aria-hidden
                  className="absolute -top-6 left-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple text-white shadow-[0_0_20px_rgba(255,77,157,0.6)]"
                >
                  <s.Icon size={24} strokeWidth={2} />
                </span>
                <p className="text-[10px] font-bold tracking-[0.18em] text-neon-cyan">
                  {s.step}
                </p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-[2] text-white/65">
                  {s.body}
                </p>
                <span className="mt-5 inline-block text-3xl font-black text-white/15">
                  0{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2026-06-16 撤去: ACHIEVEMENTS 数値セクション
          (Baymard/NN/g: 「登録クリエイター 22 人」「公開作品 23 本」のような
          低い実数を大きく見せる演出は negative social proof になり逆効果。
          価値プロップ (撮影不要/完全リモート/一貫/登録無料) は Hero 直下に
          静的に配置済) */}
      <span aria-hidden className="hidden">{genreCount}</span>

      {/* =================================================
          USE CASES — 案件例 (対応ジャンル)
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight py-24 text-white">
        <div className="pointer-events-none absolute -right-20 top-12 h-[380px] w-[380px] rounded-full bg-neon-cyan opacity-15 blur-[140px] animate-glow-pulse" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <EyebrowLabel text="CASE / 案件例" tone="cyan" />
            <h2 className="mt-6 text-[1.75rem] font-black leading-[1.2] sm:text-[2.25rem]">
              <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                {genreCount} カテゴリ
              </span>
              に対応。Meta 広告から MV まで。
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-[2] text-white/65">
              SNS広告動画から商品紹介・採用動画・コーポレートVP・MV・ショートドラマまで、全10カテゴリに対応。
              <br />
              業界・尺・媒体を問わず、AIで実現できる映像クリエイティブを発注できます。
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-2.5">
            {GENRES.map((g, i) => (
              <span
                key={g}
                className={`rounded-pill border px-4 py-2 text-sm font-bold backdrop-blur-sm transition-colors hover:-translate-y-0.5 ${
                  i % 3 === 0
                    ? "border-neon-pink/40 bg-neon-pink/10 text-neon-pink-soft hover:border-neon-pink"
                    : i % 3 === 1
                      ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan hover:border-neon-cyan"
                      : "border-neon-purple/40 bg-neon-purple/10 text-neon-purple hover:border-neon-purple"
                }`}
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          FAQ
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-24 text-white">
        <div className="pointer-events-none absolute -left-16 bottom-0 h-[360px] w-[360px] rounded-full bg-neon-pink opacity-15 blur-[140px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <EyebrowLabel text="FAQ / よくある質問" />
            <h2 className="mt-6 text-[1.75rem] font-black leading-[1.2] sm:text-[2.25rem]">
              発注前に
              <span className="bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                知っておきたいこと
              </span>
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {[
              {
                q: "動画 1 本の費用はどれくらいかかりますか？",
                a: "クリエイターと内容によりますが、SNS 広告 15 秒なら ¥30,000 〜 が目安です。詳細ページで最低対応プランの内訳が公開されているので、相談前に概算が把握できます。AI 見積もりチャットも併用ください。",
              },
              {
                q: "制作期間はどれくらいですか？",
                a: "最短 2 日〜が目安です。1 本単発の SNS 広告であれば数日、シリーズ展開やコーポレートVPは 1〜3 週間ほど。納期は依頼時にクリエイターと合意できます。",
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
            ].map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-colors open:border-neon-pink/40 open:bg-white/[0.06]"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-left">
                  <span className="flex items-baseline gap-3">
                    <span className="text-xs font-black tracking-[0.18em] text-neon-pink-soft">
                      Q
                    </span>
                    <span className="text-base font-bold text-white sm:text-lg">
                      {f.q}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/70 transition-transform group-open:rotate-180"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
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
                <div className="mt-4 flex items-start gap-3 border-t border-white/10 pt-4">
                  <span className="text-xs font-black tracking-[0.18em] text-neon-cyan">
                    A
                  </span>
                  <p className="text-sm leading-[2] text-white/75">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          CLOSING CTA
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-28 text-white">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-neon-pink opacity-30 blur-[140px]" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-neon-cyan opacity-25 blur-[120px]" />

        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 text-neon-pink animate-float"
        >
          <RetroSun size={70} />
        </span>

        <div className="relative mx-auto max-w-container px-6 text-center lg:px-10">
          <EyebrowLabel text="START NOW" tone="cyan" />
          <h2 className="mt-8 text-balance text-[2.5rem] font-black leading-[1.1] sm:text-[3.5rem] lg:text-[5rem]">
            <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              AIで、広告動画を
            </span>
            <br />
            次のレベルへ。
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-sm leading-[2] text-white/70">
            まずはクリエイターを見てみる。
            プロフィール閲覧は無料、依頼前にチャット相談もできます。
          </p>

          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/creators"
              className="group inline-flex items-center justify-between gap-3 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-8 py-4 text-base font-black text-white shadow-[0_0_30px_rgba(255,77,157,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_rgba(255,77,157,0.7)]"
            >
              <span>AIクリエイターを探す</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/register"
              className="group inline-flex items-center justify-between gap-3 rounded-pill border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              <span>無料ではじめる</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
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
  // テキストとモックは「自分が最終的に居る側の外側」から滑り込む。
  // reverse=false : テキスト左 / モック右 → textDir=left, mockDir=right
  // reverse=true  : テキスト右 / モック左 → textDir=right, mockDir=left
  const textDir = reverse ? "right" : "left";
  const mockDir = reverse ? "left" : "right";

  // 内部 stagger: ラベル → 見出し → 説明 → 箇条書き → CTA を 80ms 刻みで
  // (合計 ≦ 0.5s)。bullets はインデックスごとに更に +80ms ずつ追加。
  return (
    <div
      className={`grid grid-cols-1 items-center gap-10 lg:gap-16 ${
        reverse ? "lg:grid-cols-[1fr,1.05fr]" : "lg:grid-cols-[1.05fr,1fr]"
      }`}
    >
      <div className={reverse ? "lg:order-2" : ""}>
        <SlideInWhenVisible direction={textDir} delay={0}>
          <span className="inline-block rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-neon-pink-soft">
            {no}
          </span>
        </SlideInWhenVisible>
        <SlideInWhenVisible direction={textDir} delay={80}>
          <h3 className="mt-4 text-[1.75rem] font-black leading-[1.2] sm:text-[2.25rem]">
            {title}
          </h3>
        </SlideInWhenVisible>
        <SlideInWhenVisible direction={textDir} delay={160}>
          <p className="mt-5 text-sm leading-[2] text-white/70">{body}</p>
        </SlideInWhenVisible>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b, i) => (
            <SlideInWhenVisible
              key={b}
              direction={textDir}
              delay={240 + i * 80}
            >
              <li className="flex items-start gap-2.5 text-sm text-white/80">
                <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-purple text-[10px] font-black text-white">
                  ✓
                </span>
                {b}
              </li>
            </SlideInWhenVisible>
          ))}
        </ul>
        <SlideInWhenVisible
          direction={textDir}
          delay={240 + bullets.length * 80}
        >
          <Link
            href={cta.href}
            className="group mt-7 inline-flex items-center gap-2 rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-5 py-2.5 text-sm font-bold text-neon-pink-soft transition-colors hover:bg-neon-pink/20"
          >
            {cta.label}
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </SlideInWhenVisible>
      </div>
      <SlideInWhenVisible
        direction={mockDir}
        delay={120}
        className={reverse ? "lg:order-1" : ""}
      >
        {mock}
      </SlideInWhenVisible>
    </div>
  );
}
