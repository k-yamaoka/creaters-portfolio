/**
 * トップページの「主な機能」セクション用 UI モックアップ集。
 *
 * - 実機スクリーンショットの代替として、各機能ページ (creators / portfolios /
 *   creator detail / messages / orders) の見た目を CSS で再現したミニビュー。
 * - すべて Server Component (interactivity 不要)。
 * - en-tech.ai/for-talents のパターンを参考にブラウザフレームで包む。
 * - 2026-06-16: 内部の絵文字 (❤️ ⭐ ✦ 💼 🤖 🛡️ 🕐 ▶) を lucide-react に統一。
 */
import {
  Heart,
  Star,
  Sparkles,
  Briefcase,
  Bot,
  ShieldCheck,
  Clock,
  Play,
  Check,
} from "lucide-react";

type BrowserFrameProps = {
  url: string;
  children: React.ReactNode;
  /** "dark" = ネオン背景 / "light" = ダッシュボード白基調 */
  variant?: "dark" | "light";
};

export function BrowserFrame({
  url,
  children,
  variant = "dark",
}: BrowserFrameProps) {
  // 2026-06-16 Step 3: Axis 風の簡素な bezel に。
  // 大型 drop shadow / 信号機ドット / 色付き bg を全撤去。
  // 細い rounded-md と 1px の border-ink/10 だけで画面サンプルを括る。
  const isDark = variant === "dark";
  return (
    <div
      className={`overflow-hidden rounded-md border ${
        isDark ? "border-ink/10 bg-paper" : "border-ink/10 bg-paper"
      }`}
    >
      {/* Minimal address bar — URL を eyebrow-mono 風 mono にする */}
      <div
        className={`flex items-center gap-3 border-b px-4 py-2 ${
          isDark ? "border-ink/10" : "border-ink/10"
        }`}
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            isDark ? "bg-ink/30" : "bg-ink/30"
          }`}
        />
        <div
          className={`flex-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] ${
            isDark ? "text-ink/45" : "text-ink/45"
          }`}
        >
          {url}
        </div>
      </div>
      {/* SP で内部の固定幅 mock がはみ出す対策。
          overflow-x-hidden で物理的にトリミングし、横スクロールを阻止。 */}
      <div className="relative overflow-x-hidden">{children}</div>
    </div>
  );
}

/* ============================================================
 *  Mock: /creators 一覧
 * ============================================================ */
export function MockCreatorsList() {
  const rows = [
    {
      name: "山田 太郎",
      bio: "Meta/TikTok 広告に特化。Sora 2 + Runway Gen-4 で AB案を高速量産。",
      price: "¥30,000〜",
      tag: "スピード納品",
      genre: "SNS広告動画",
      tier: "gold" as const,
    },
    {
      name: "佐藤 美和",
      bio: "Veo 3 のシネマグレード表現が得意。コーポレートVP中心。",
      price: "¥120,000〜",
      tag: "こだわり高品質型",
      genre: "会社紹介・コーポレートVP",
      tier: "silver" as const,
    },
    {
      name: "鈴木 健",
      bio: "EC商品PR特化。商品写真1枚から AI 生成で 30 秒動画を作る。",
      price: "¥50,000〜",
      tag: "大手企業実績あり",
      genre: "プロダクト紹介動画",
      tier: "normal" as const,
    },
  ];
  // 2026-06-16 Step 4: Axis 風モノトーンに彩度下げ。
  // neon-pink/purple/cyan/sunset → paper/sand/ink の階調のみ。
  return (
    <div className="space-y-0 divide-y divide-ink/10 bg-paper p-4">
      {rows.map((r, i) => (
        <div key={i} className="relative py-3 first:pt-0 last:pb-0">
          {r.tier === "gold" && (
            <span className="absolute right-0 top-3 inline-flex items-center gap-1 font-mono text-[8px] font-medium uppercase tracking-[0.2em] text-sand">
              <Star size={9} fill="currentColor" strokeWidth={0} /> Top
            </span>
          )}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-ink/15 bg-ink/[0.04] font-display text-base font-medium text-ink">
              {r.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-medium text-ink">
                  {r.name}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[9px] text-ink/55">
                  <Heart
                    size={9}
                    fill="currentColor"
                    strokeWidth={0}
                    className="text-sand"
                  />
                  {r.tier === "gold" ? 128 : r.tier === "silver" ? 64 : 12}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ink/60">
                {r.bio}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-sand">
                  {r.tag}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
                  · {r.genre}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink/45">
                From
              </p>
              <p className="font-display text-[13px] font-medium text-ink">
                {r.price}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 *  Mock: /portfolios 作品グリッド
 * ============================================================ */
export function MockPortfoliosGrid() {
  // 2026-06-16 Step 4: Axis 風モノトーンに。グラデは paper の階調のみ。
  const tiles = [
    { aspect: "aspect-video", opacity: "from-paper/[0.18] to-paper/[0.04]", n: 24 },
    { aspect: "aspect-square", opacity: "from-paper/[0.12] to-paper/[0.02]", n: 87 },
    { aspect: "aspect-[9/16]", opacity: "from-paper/[0.22] to-paper/[0.06]", n: 41 },
    { aspect: "aspect-video", opacity: "from-paper/[0.10] to-paper/[0.02]", n: 12 },
    { aspect: "aspect-[9/16]", opacity: "from-paper/[0.16] to-paper/[0.03]", n: 56 },
    { aspect: "aspect-square", opacity: "from-paper/[0.20] to-paper/[0.05]", n: 9 },
  ];
  return (
    <div className="bg-paper p-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <div
            key={i}
            className={`relative ${t.aspect} overflow-hidden rounded-sm border border-ink/8`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${t.opacity}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute right-1 top-1 z-10 inline-flex items-center gap-1 font-mono text-[9px] text-ink/85">
              <Heart size={8} fill="currentColor" strokeWidth={0} className="text-sand" />
              {t.n}
            </span>
            <span className="absolute bottom-1 left-1 inline-flex items-center text-ink/65">
              <Play size={9} fill="currentColor" strokeWidth={0} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 *  Mock: /creators/[id] 詳細 ヒーロー + 料金パネル
 * ============================================================ */
export function MockCreatorDetail() {
  return (
    <div className="space-y-3 bg-paper p-4">
      {/* Hero row */}
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-ink/15 bg-ink/[0.04] font-display text-base font-medium text-ink">
          山
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-sand">
            Verified
          </span>
          <p className="mt-1.5 font-display text-base font-medium text-ink">
            山田 太郎
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-ink/55">
            <Sparkles size={10} className="text-sand" /> 24 works ·
            <Heart size={10} fill="currentColor" strokeWidth={0} className="text-sand" />
            128
          </p>
        </div>
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-sm border border-ink/15 bg-gradient-to-br from-paper/[0.18] to-paper/[0.04]">
          <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 font-mono text-[8px] uppercase tracking-[0.16em] text-sand">
            <Star size={8} fill="currentColor" strokeWidth={0} /> Featured
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-ink/20 px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink">
        <Briefcase size={12} strokeWidth={1.6} />
        Request a quote
      </div>

      {/* Minimum plan panel */}
      <div className="border-t border-ink/10 pt-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/45">
            From
          </span>
          <span className="font-display text-base font-medium text-sand">
            ¥30,000
          </span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink/65">
          縦型 SNS 広告 15 秒 ×1 本。修正 2 回まで含む。Sora 2 + Runway で AB 案 3 種同時提案。
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
            <Check size={9} strokeWidth={2} className="text-sand" /> AB×3
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
            <Check size={9} strokeWidth={2} className="text-sand" /> 9:16
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
            <Clock size={9} strokeWidth={1.6} /> 3 days
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  Mock: AI 見積もりチャット
 * ============================================================ */
export function MockEstimateChat() {
  return (
    <div className="space-y-2 bg-paper p-4">
      <p className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-sand">
        <Bot size={11} strokeWidth={1.8} />
        AI Estimate
      </p>
      <div className="rounded-sm border-l-2 border-ink/15 bg-ink/[0.04] p-2.5 text-[11px] leading-relaxed text-ink/80">
        ご依頼内容のイメージを教えてください。たとえば「30 秒の SNS 広告動画
        を 3 本」など。
      </div>
      <div className="ml-auto max-w-[80%] rounded-sm border-r-2 border-sand bg-paper/[0.06] p-2.5 text-[11px] leading-relaxed text-ink/85">
        コスメ D2C 向け縦型 SNS 広告、15 秒 × 5 本を 1 週間で。
      </div>
      <div className="rounded-sm border-l-2 border-ink/15 bg-ink/[0.04] p-2.5 text-[11px] leading-relaxed text-ink/80">
        おすすめは「<b className="font-medium text-sand">スピード AB 案 パック</b>」。
        概算 <b className="font-medium text-sand">¥150,000 〜 ¥200,000</b>。
        AB 各 1 案 × 5 本、3 営業日納品。
      </div>
      <div className="flex items-center gap-2 border-t border-ink/10 px-1 py-2 text-[10px] text-ink/40">
        メッセージを入力…
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.18em] text-ink/65">
          Send
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 *  Mock: 取引管理 (エスクロー)
 * ============================================================ */
export function MockOrders() {
  const rows = [
    {
      title: "縦型 SNS 広告 15 秒 ×5 本",
      client: "コスメ D2C ブランド X",
      status: "In progress",
      amount: "¥150,000",
    },
    {
      title: "コーポレートサイト ヒーロー動画",
      client: "SaaS スタートアップ Y",
      status: "Delivered",
      amount: "¥320,000",
    },
    {
      title: "プロダクト紹介 ループ動画",
      client: "EC モール Z",
      status: "Settled",
      amount: "¥80,000",
    },
  ];
  return (
    <div className="bg-paper p-4">
      <div className="mb-3 flex items-center justify-between border-y border-ink/10 py-3">
        <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-sand">
          <ShieldCheck size={11} strokeWidth={1.6} />
          Escrow held
        </p>
        <p className="font-display text-sm font-medium text-ink">¥230,000</p>
      </div>
      <div className="divide-y divide-ink/10">
        {rows.map((r, i) => (
          <div key={i} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-[12px] font-medium text-ink">
                  {r.title}
                </p>
                <p className="mt-0.5 text-[10px] text-ink/50">{r.client}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/60">
                  {r.status}
                </span>
                <p className="mt-0.5 font-display text-[12px] font-medium text-ink">
                  {r.amount}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
