import Link from "next/link";
import { getCreators } from "@/lib/supabase/queries";
// 2026-06-16 Step 3: RetroSun (旧 CLOSING の浮遊装飾) は撤去のため import 削除
// 2026-06-17: 旧 HeroVideoGrid (縦自動マーキー) は HeroCinematic に置き換え。
// (HeroVideoGrid 自体は /portfolios 用に残置)
import { HeroCinematic, type CinematicTile } from "@/components/home/hero-cinematic";
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
 *  2026-06-16 Step 3 で EyebrowLabel (ネオンピル + パルスドット) は撤去。
 *  すべてのセクション見出しは <p className="eyebrow-mono">(0X — Name)</p>
 *  で統一 (Axis 風)。
 * ============================================================= */

// ===== HeroCinematic 用の動画ソース =====
// 2026-06-17: フルスクリーン背景動画 + 右下に重なる小映像 2 枚 の構造に刷新。
// 旧 HeroVideoGrid 用の Masonry 配列 (extractHeroTiles / FALLBACK_HERO_TILES)
// は撤去。素材差し替えは下の HERO_BG_VIDEO / HERO_OVERLAYS を編集する。

// ★ 背景フル動画 (差し替えポイント) ★
const HERO_BG_VIDEO: { src: string; poster?: string | null } = {
  // MDN CC0 — 抽象的な花の動画。Axis 風アンビエント感に合うため仮採用
  src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  poster: null,
};

// ★ 右下に重なる小映像 2 枚 (差し替えポイント) ★
const HERO_OVERLAYS: CinematicTile[] = [
  {
    // タイル A (メイン、横長): Big Buck Bunny アニメサンプル
    src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4",
    poster: null,
    aspect: "video",
  },
  {
    // タイル B (サブ、縦長): Jellyfish 海中動画
    src: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_2MB.mp4",
    poster: null,
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
  // allCreators は他セクション (今後の "Featured creators" 等) で使用想定。
  // Hero は HeroCinematic に固定動画を渡す構造に刷新したため tiles 計算は撤去。
  void allCreators;

  return (
    <>
      {/* =================================================
          HERO — Cinematic フルスクリーン (axis-ov-films.co.jp オマージュ / 2026-06-17)
            ・100svh 背景動画 + 右下に重なる小映像 2 枚
            ・テキストは左上 Axis スタイル (mono ラベル + Fraunces 大型)
            ・全 video は autoPlay muted loop playsInline + reduced-motion 制御
          ================================================= */}
      <HeroCinematic bg={HERO_BG_VIDEO} overlays={HERO_OVERLAYS} />

      {/* Hero 直下: Compatible models 罫線帯 — Hero の続きの暗帯として独立 */}
      <section className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-wide px-gutter pt-16 lg:pt-24">
          <RevealOnScroll delay={0} className="border-t border-paper/10 pt-12">
            <p className="eyebrow-mono text-center">Compatible models</p>
            {/* 2026-06-16 Step 4: ブランド名 (Sora/Veo/...) はサンセリフが自然。
                Fraunces (font-display) を装飾セリフに使うのは違和感のため Inter に。 */}
            <div className="mt-6 flex flex-wrap items-center justify-center divide-x divide-paper/10">
              {AI_TOOL_LABELS.map((t) => (
                <span
                  key={t}
                  className="px-6 font-sans text-sm font-medium tracking-tight text-paper/55 transition-colors hover:text-paper sm:px-8 sm:text-base"
                >
                  {t}
                </span>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* =================================================
          VALUE PROPS — 罫線で 4 等分された単一の帯 (Axis 風)
          ================================================= */}
      <section className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-wide px-6 lg:px-10">
          <div className="grid grid-cols-1 divide-y divide-paper/10 border-y border-paper/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
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
                  <p className="mt-8 font-display text-lg font-medium text-paper">
                    {v.title}
                  </p>
                  <p className="body-jp mt-3 text-sm text-paper/60">
                    {v.body}
                  </p>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================
          02 — Co-creation (旧 PAIN POINTS を完全撤去 / Axis "We" オマージュ)
            ・「お悩み 3 つ → 解決」のセールス構造を捨て、沈黙の余白で物語る
            ・Axis 直系の "Create together. Nurture together." を主見出しに
          ================================================= */}
      <section className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-narrow px-gutter py-section-y-sm lg:py-section-y">
          <RevealOnScroll delay={0}>
            <p className="eyebrow-mono">(02 — Co-creation)</p>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <h2 className="headline-display mt-12 text-[clamp(2.5rem,6vw,5rem)] text-paper">
              Create together.
              <br />
              <span className="italic text-sand">Nurture together.</span>
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <p className="body-jp mt-12 max-w-prose-jp">
              目の前のひとつが、大切にしていること。
              <br />
              いま、誰に何を届けたいのか。
              <br />
              どんな未来を描こうとしているのか。
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={320}>
            <p className="body-jp mt-10 max-w-prose-jp text-sm text-paper/55">
              私たちは、企業の物語をクリエイターと共に編む場所をつくります。
              映像が、誰かの一日を変えるかもしれない。その可能性に、最も近い人と、
              最も静かな手触りで向き合うために。
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* =================================================
          03 — Service (旧 FEATURES) — 5 機能をアシンメトリーに展開
          ================================================= */}
      <section id="features" className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-wide px-gutter py-section-y-sm lg:py-section-y">
          <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
            <RevealOnScroll delay={0}>
              <p className="eyebrow-mono">(03 — Service)</p>
            </RevealOnScroll>
            <div>
              <RevealOnScroll delay={80}>
                <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-paper">
                  Movie commerce,
                  <br />
                  <span className="italic text-sand">end-to-end.</span>
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="body-jp mt-8 max-w-prose-jp text-paper/70">
                  発注前の比較から、見積もり相談、納品・決済まで。
                  案件に必要なすべてが、ひとつのプラットフォームに。
                </p>
              </RevealOnScroll>
            </div>
          </div>

          {/* Feature blocks — アシンメトリー (奇数: テキスト 36% / モック 64%
              偶数: 反転)、上下に大きな余白 */}
          <div className="mt-section-y-sm space-y-section-y-sm lg:mt-section-y lg:space-y-section-y">
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
          04 — Process (旧 HOW TO USE) — 3 ステップを罫線縦割りに
          ================================================= */}
      <section id="how" className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-wide px-gutter py-section-y-sm lg:py-section-y">
          <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
            <RevealOnScroll delay={0}>
              <p className="eyebrow-mono">(04 — Process)</p>
            </RevealOnScroll>
            <div>
              <RevealOnScroll delay={80}>
                <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-paper">
                  How it{" "}
                  <span className="italic text-sand">works.</span>
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="body-jp mt-8 max-w-prose-jp text-paper/70">
                  発注の流れ、3 つのステップで。
                </p>
              </RevealOnScroll>
            </div>
          </div>

          <div className="mt-section-y-sm grid grid-cols-1 border-y border-paper/10 divide-y divide-paper/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
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
                <h3 className="font-display mt-3 text-2xl font-medium text-paper">
                  {s.title}
                </h3>
                <p className="body-jp mt-4 text-sm text-paper/65">{s.body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* 2026-06-16 撤去: ACHIEVEMENTS 数値セクション
          (negative social proof のため。代替は Hero 直下の 4 価値プロップ + 下記 05) */}

      {/* =================================================
          05 — Categories (旧 USE CASES) — 罫線で組まれた目次風タイポ
          ================================================= */}
      <section className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-wide px-gutter py-section-y-sm lg:py-section-y">
          <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
            <RevealOnScroll delay={0}>
              <p className="eyebrow-mono">(05 — Categories)</p>
            </RevealOnScroll>
            <div>
              <RevealOnScroll delay={80}>
                <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-paper">
                  Ten genres,
                  <br />
                  <span className="italic text-sand">one stage.</span>
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="body-jp mt-8 max-w-prose-jp text-paper/70">
                  全 {genreCount} カテゴリに対応。業界・尺・媒体を問わず、
                  AIで実現できる映像クリエイティブを発注できます。
                </p>
              </RevealOnScroll>
            </div>
          </div>

          {/* 「目次」風の縦リスト。各行に番号 + 大字ジャンル + 番号 */}
          <RevealOnScroll
            delay={120}
            className="mt-section-y-sm border-y border-paper/10"
          >
            <ul className="divide-y divide-paper/10">
              {GENRES.map((g, i) => {
                const num = String(i + 1).padStart(2, "0");
                const total = String(GENRES.length).padStart(2, "0");
                return (
                  <li
                    key={g}
                    className="group py-6 transition-colors hover:bg-paper/[0.02] sm:py-8"
                  >
                    {/* SP: 番号 + ジャンル名を縦並び (横並びだと長文ジャンル名が被る) */}
                    <div className="flex items-baseline justify-between gap-4 sm:gap-6">
                      <span className="eyebrow-mono shrink-0">{num}</span>
                      <h3 className="font-display flex-1 text-right text-xl font-medium tracking-tight text-paper transition-colors group-hover:text-sand sm:text-center sm:text-3xl lg:text-4xl">
                        {g}
                      </h3>
                      <span className="eyebrow-mono hidden shrink-0 sm:inline">
                        / {total}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </RevealOnScroll>
        </div>
      </section>

      {/* =================================================
          06 — FAQ — 罫線で区切ったアコーディオン (カード型廃止)
          ================================================= */}
      <section className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-narrow px-gutter py-section-y-sm lg:py-section-y">
          <div className="grid gap-8 lg:grid-cols-[1fr,2fr] lg:items-end">
            <RevealOnScroll delay={0}>
              <p className="eyebrow-mono">(06 — FAQ)</p>
            </RevealOnScroll>
            <div>
              <RevealOnScroll delay={80}>
                <h2 className="headline-display text-[clamp(2.5rem,5.5vw,4.5rem)] text-paper">
                  <span className="italic text-sand">Questions.</span>
                </h2>
              </RevealOnScroll>
              <RevealOnScroll delay={200}>
                <p className="body-jp mt-8 max-w-prose-jp text-paper/70">
                  発注前に、よくある質問。
                </p>
              </RevealOnScroll>
            </div>
          </div>

          <RevealOnScroll
            delay={120}
            className="mt-section-y-sm border-y border-paper/10"
          >
            <ul className="divide-y divide-paper/10">
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
                          <span className="font-display min-w-0 text-base font-medium text-paper sm:text-xl">
                            {f.q}
                          </span>
                        </span>
                        <span
                          aria-hidden
                          className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-paper/30 text-paper/60 transition-transform duration-300 group-open:rotate-180"
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
                        <p className="body-jp text-sm text-paper/70 sm:text-base">
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
      <section className="relative bg-ink-deep text-paper">
        <div className="relative mx-auto max-w-narrow px-gutter py-section-y-lg text-center">
          <RevealOnScroll delay={0}>
            <p className="eyebrow-mono">(07 — Start)</p>
          </RevealOnScroll>

          <RevealOnScroll delay={80}>
            <h2 className="headline-display mt-12 text-[clamp(2.75rem,7vw,6rem)] text-paper">
              Every story
              <br />
              starts with{" "}
              <span className="italic text-sand">us.</span>
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={240}>
            <p className="body-jp mx-auto mt-12 max-w-prose-jp text-paper/60">
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
  // Step 3 (2026-06-16): Axis アシンメトリーへ。
  // モック側を 62% / テキスト 38% にし、モックを主役に。
  // 内側の SlideInWhenVisible (横方向 stagger) は 引き続き使用 (高級感の質感)。
  const textDir = reverse ? "right" : "left";
  const mockDir = reverse ? "left" : "right";

  // 番号タグ "FEATURE 01 / 060" を Axis "060" 風に組む。
  const axisNo = no.replace("FEATURE ", "Feature ");

  return (
    <div
      className={`grid grid-cols-1 items-start gap-8 sm:gap-12 lg:gap-24 ${
        reverse ? "lg:grid-cols-[1.62fr,1fr]" : "lg:grid-cols-[1fr,1.62fr]"
      }`}
    >
      {/* テキスト側 — 上揃え、明朝、罫線リスト */}
      <div className={reverse ? "lg:order-2" : ""}>
        <SlideInWhenVisible direction={textDir} delay={0}>
          <p className="eyebrow-mono">{axisNo}</p>
        </SlideInWhenVisible>
        <SlideInWhenVisible direction={textDir} delay={80}>
          <h3 className="font-display mt-8 text-[clamp(1.75rem,3.5vw,2.75rem)] font-medium leading-[1.15] tracking-tight text-paper">
            {title}
          </h3>
        </SlideInWhenVisible>
        <SlideInWhenVisible direction={textDir} delay={160}>
          <p className="body-jp mt-6 text-paper/70">{body}</p>
        </SlideInWhenVisible>
        <ul className="mt-10 border-t border-paper/10">
          {bullets.map((b, i) => (
            <SlideInWhenVisible
              key={b}
              direction={textDir}
              delay={240 + i * 80}
            >
              <li className="flex items-start gap-4 border-b border-paper/10 py-4">
                <span className="eyebrow-mono shrink-0 pt-[3px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="body-jp flex-1 text-sm text-paper/80">
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
            <Link href={cta.href} className="btn-axis-ghost">
              {cta.label}
            </Link>
          </div>
        </SlideInWhenVisible>
      </div>

      {/* モック側 — 主役に */}
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
