import Link from "next/link";
import { getCreators } from "@/lib/supabase/queries";
import { SparkStar } from "@/components/ui/illustrations";
import { NeonStar, RetroSun } from "@/components/ui/illustrations-retrowave";
import { HeroVideoMarquee } from "@/components/home/hero-video-marquee";
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

export default async function HomePage() {
  const allCreators = await getCreators();

  // 実績数値 — 実データ + 安全な下限フォールバック
  const creatorCount = Math.max(allCreators.length, 22);
  const portfolioCount = Math.max(
    allCreators.reduce((sum, c) => sum + c.portfolio_items.length, 0),
    20
  );
  const genreCount = GENRES.length;

  return (
    <>
      {/* 2026-06-15 撤去: 旧 RandomGallery (5列縦スクロール) は Hero 内の
          HeroVideoMarquee (3 行横スクロール) に統合 */}

      {/* =================================================
          HERO
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(157,92,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(157,92,255,0.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
        <div className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-neon-pink opacity-30 blur-[120px]" />
        <div className="absolute -right-24 top-32 h-[400px] w-[400px] rounded-full bg-neon-cyan opacity-25 blur-[100px]" />
        <div className="absolute left-1/2 -bottom-32 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-neon-purple opacity-20 blur-[100px]" />

        <span
          aria-hidden
          className="pointer-events-none absolute right-12 top-16 text-neon-pink animate-float"
        >
          <NeonStar size={36} />
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-12 bottom-24 text-neon-cyan animate-sway"
        >
          <SparkStar size={28} />
        </span>

        <div className="relative mx-auto max-w-container px-6 pb-28 pt-20 lg:px-10 lg:pb-36 lg:pt-28">
          {/* 2026-06-15 再構成: Hero を左右 2 カラムに。左 45% テキスト / 右 55% 横3行マーキー。
              SP/タブレットでは縦積み (上テキスト / 下マーキー)、デスクトップは items-center で
              縦中心揃え */}
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-12">
            <div className="w-full lg:w-[45%]">
              <EyebrowLabel text="AILIER — AI CREATORS PLATFORM" />

              <h1 className="mt-8 text-[2.4rem] font-black leading-[1.1] tracking-tight sm:text-[3.6rem] lg:text-[4.8rem]">
                <span className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
                  AIクリエイター
                </span>
                と、
                <br />
                <span className="text-white">企業をつなぐ</span>
                <span className="text-neon-pink">。</span>
              </h1>

              <p className="mt-8 max-w-xl text-[15px] leading-[2] text-white/70">
                Sora・Veo・Runway・Seedance を使いこなすクリエイターに、
                <span className="font-bold text-white">
                  SNS広告動画・商品紹介・採用動画
                </span>
                を依頼できる専門マッチングプラットフォーム。
                <br />
                撮影不要・完全リモート・低予算で、構成から完成までAIクリエイターにおまかせ。
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/creators"
                  className="group inline-flex items-center justify-between gap-3 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-7 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(255,77,157,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(255,77,157,0.6)]"
                >
                  <span>AIクリエイターを探す</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="#features"
                  className="group inline-flex items-center justify-between gap-3 rounded-pill border-2 border-white/30 bg-white/5 px-7 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
                >
                  <span>機能を見る</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              {/* 2026-06-15 撤去: 最短納期/従来コスト/クリエイティブ量/撮影費 の 4 メトリクス */}
            </div>

            {/* 右カラム: 3 行横マーキー */}
            <div className="w-full lg:w-[55%]">
              <HeroVideoMarquee creators={allCreators} />
            </div>
          </div>
        </div>

        {/* 2026-06-15 撤去: AI ツール名称の横スライド Marquee */}
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
                "❤️ いいねでお気に入りクリエイターを発見",
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
                emoji: "🔍",
              },
              {
                step: "STEP 2",
                title: "依頼を相談する",
                body: "詳細ページから「依頼を相談」をクリック。AI 見積もりチャットや直接メッセージで、内容・本数・尺をすり合わせ。",
                emoji: "💬",
              },
              {
                step: "STEP 3",
                title: "制作・納品 ＋ 検収",
                body: "エスクローで仮払い → 制作開始 → 納品確認後に自動送金。進行中はメッセージ画面で一気通貫。",
                emoji: "🎬",
              },
            ].map((s, i) => (
              <div
                key={s.step}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-7 pt-12 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-neon-pink/40 hover:shadow-[0_20px_50px_-15px_rgba(255,77,157,0.4)]"
              >
                <span className="absolute -top-6 left-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-pink to-neon-purple text-2xl shadow-[0_0_20px_rgba(255,77,157,0.6)]">
                  {s.emoji}
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

      {/* =================================================
          ACHIEVEMENTS — 数値
          ================================================= */}
      <section className="relative overflow-hidden bg-neon-midnight-deep py-24 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-neon-purple opacity-15 blur-[160px]" />

        <div className="relative mx-auto max-w-container px-6 lg:px-10">
          <div className="text-center">
            <EyebrowLabel text="ACHIEVEMENTS / 実績" tone="purple" />
            <h2 className="mt-6 text-[1.75rem] font-black leading-[1.2] sm:text-[2.25rem]">
              AIクリエイターと案件のマッチングを
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-neon-pink to-neon-cyan bg-clip-text text-transparent">
                数字で見る
              </span>
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              {
                label: "Number of creators",
                jp: "登録クリエイター",
                num: creatorCount,
                unit: "人+",
                color: "from-neon-pink to-neon-purple",
              },
              {
                label: "Number of works",
                jp: "公開作品数",
                num: portfolioCount,
                unit: "本+",
                color: "from-neon-cyan to-neon-purple",
              },
              {
                label: "Genres covered",
                jp: "取扱ジャンル",
                num: genreCount,
                unit: "カテゴリ",
                color: "from-neon-sunset to-neon-pink",
              },
            ].map((s) => (
              <div
                key={s.jp}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${s.color} opacity-60`}
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  {s.label}
                </p>
                <p className="mt-2 text-sm font-bold text-white/85">{s.jp}</p>
                <p
                  className={`mt-4 bg-gradient-to-r ${s.color} bg-clip-text text-[3.25rem] font-black leading-none text-transparent`}
                >
                  {s.num.toLocaleString()}
                </p>
                <p className="mt-2 text-sm font-bold text-white/65">{s.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
  return (
    <div
      className={`grid grid-cols-1 items-center gap-10 lg:gap-16 ${
        reverse ? "lg:grid-cols-[1fr,1.05fr]" : "lg:grid-cols-[1.05fr,1fr]"
      }`}
    >
      <div className={reverse ? "lg:order-2" : ""}>
        <span className="inline-block rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-neon-pink-soft">
          {no}
        </span>
        <h3 className="mt-4 text-[1.75rem] font-black leading-[1.2] sm:text-[2.25rem]">
          {title}
        </h3>
        <p className="mt-5 text-sm leading-[2] text-white/70">{body}</p>
        <ul className="mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-sm text-white/80"
            >
              <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-purple text-[10px] font-black text-white">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <Link
          href={cta.href}
          className="group mt-7 inline-flex items-center gap-2 rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-5 py-2.5 text-sm font-bold text-neon-pink-soft transition-colors hover:bg-neon-pink/20"
        >
          {cta.label}
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>{mock}</div>
    </div>
  );
}
