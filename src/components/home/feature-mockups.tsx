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
  const isDark = variant === "dark";
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] ${
        isDark
          ? "border-white/15 bg-neon-midnight-deep"
          : "border-gray-200 bg-white"
      }`}
    >
      {/* Mac-style top bar */}
      <div
        className={`flex items-center gap-2 border-b px-4 py-2.5 ${
          isDark ? "border-white/10 bg-neon-midnight" : "border-gray-200 bg-gray-50"
        }`}
      >
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div
          className={`ml-3 flex-1 truncate rounded-md px-3 py-1 text-[11px] ${
            isDark
              ? "bg-white/5 text-white/55"
              : "bg-white text-gray-500"
          }`}
        >
          {url}
        </div>
      </div>
      {/* Content area */}
      <div className="relative">{children}</div>
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
  return (
    <div className="space-y-2.5 bg-neon-midnight-deep p-4">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl border p-3 ${
            r.tier === "gold"
              ? "border-neon-sunset/60 bg-neon-sunset/[0.07]"
              : r.tier === "silver"
                ? "border-neon-cyan/40 bg-neon-cyan/[0.05]"
                : "border-white/10 bg-white/[0.04]"
          }`}
        >
          {r.tier === "gold" && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-pill bg-gradient-to-r from-neon-sunset to-neon-pink px-2 py-0.5 text-[8px] font-black text-white">
              <Star size={10} fill="currentColor" strokeWidth={0} /> 人気
              <Heart size={10} fill="currentColor" strokeWidth={0} /> 128
            </span>
          )}
          <div className={`flex items-start gap-3 ${r.tier === "gold" ? "mt-4" : ""}`}>
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-[0_0_12px_rgba(255,77,157,0.4)] ${
                i === 0
                  ? "bg-gradient-to-br from-neon-pink to-neon-purple"
                  : i === 1
                    ? "bg-gradient-to-br from-neon-cyan to-neon-purple"
                    : "bg-gradient-to-br from-neon-sunset to-neon-pink"
              }`}
            >
              {r.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">{r.name}</span>
                <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/80">
                  <Heart
                    size={9}
                    fill="currentColor"
                    strokeWidth={0}
                    className="text-neon-pink"
                  />
                  {r.tier === "gold" ? 128 : r.tier === "silver" ? 64 : 12}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/65">
                {r.bio}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="rounded-pill bg-gradient-to-r from-neon-pink/25 to-neon-purple/25 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {r.tag}
                </span>
                <span className="rounded-pill border border-neon-purple/40 bg-neon-purple/10 px-1.5 py-0.5 text-[9px] font-bold text-neon-purple">
                  {r.genre}
                </span>
              </div>
            </div>
            <div className="shrink-0 rounded-lg border border-neon-pink/30 bg-neon-pink/5 px-2.5 py-1.5 text-right">
              <p className="text-[8px] font-bold text-white/55">最低対応金額</p>
              <p className="text-[13px] font-black text-neon-pink">{r.price}</p>
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
  const tiles = [
    { aspect: "aspect-video", g: "from-neon-pink to-neon-purple", n: 24 },
    { aspect: "aspect-square", g: "from-neon-cyan to-neon-purple", n: 87 },
    { aspect: "aspect-[9/16]", g: "from-neon-sunset to-neon-pink", n: 41 },
    { aspect: "aspect-video", g: "from-neon-purple to-neon-magenta", n: 12 },
    { aspect: "aspect-[9/16]", g: "from-neon-cyan to-neon-sunset", n: 56 },
    { aspect: "aspect-square", g: "from-neon-pink to-neon-cyan", n: 9 },
  ];
  return (
    <div className="bg-neon-midnight-deep p-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {tiles.map((t, i) => (
          <div
            key={i}
            className={`relative ${t.aspect} overflow-hidden rounded-md border border-white/10`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${t.g}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Like button overlay */}
            <span className="absolute right-1 top-1 z-10 inline-flex items-center gap-1 rounded-pill border border-white/30 bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              <Heart size={9} fill="currentColor" strokeWidth={0} className="text-neon-pink" />
              {t.n}
            </span>
            {/* play indicator */}
            <span className="absolute bottom-1 left-1 inline-flex items-center rounded-full bg-black/50 p-1 text-white backdrop-blur-sm">
              <Play size={8} fill="currentColor" strokeWidth={0} />
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
    <div className="space-y-3 bg-neon-midnight-deep p-4">
      {/* Hero row */}
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl border-2 border-neon-pink/60 bg-gradient-to-br from-neon-pink to-neon-purple shadow-[0_0_16px_rgba(255,77,157,0.4)]" />
        <div className="min-w-0 flex-1">
          <span className="rounded-pill bg-neon-cyan/15 px-1.5 py-0.5 text-[9px] font-black text-neon-cyan">
            認証済み
          </span>
          <p className="mt-1.5 text-base font-black text-white">山田 太郎</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] text-white/65">
            <Sparkles size={11} className="text-neon-pink" /> 作品 24 件 ·
            <Heart size={11} fill="currentColor" strokeWidth={0} className="text-neon-pink" />
            総いいね 128
          </p>
        </div>
        <div className="aspect-video w-32 shrink-0 rounded-lg border border-white/15 bg-gradient-to-br from-neon-pink to-neon-purple shadow-[0_8px_20px_-8px_rgba(255,77,157,0.5)]">
          <span className="float-left m-1 inline-flex items-center gap-0.5 rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-1.5 py-0.5 text-[8px] font-black text-white">
            <Star size={9} fill="currentColor" strokeWidth={0} /> 代表作
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2.5 text-center text-xs font-bold text-white shadow-[0_0_18px_rgba(255,77,157,0.45)]">
        <Briefcase size={13} strokeWidth={2.4} />
        このクリエイターに依頼を相談
      </div>

      {/* Minimum plan panel */}
      <div className="rounded-xl border border-neon-pink/30 bg-neon-pink/[0.08] p-3">
        <div className="flex items-baseline gap-2">
          <span className="rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-2 py-0.5 text-[9px] font-black text-white">
            最低対応プラン
          </span>
          <span className="text-base font-black text-neon-pink">¥30,000</span>
          <span className="text-[10px] font-bold text-white/55">〜 から相談可</span>
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-white/75">
          縦型 SNS 広告 15 秒 ×1 本。修正 2 回まで含む。Sora 2 + Runway で AB 案 3 種同時提案。
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 rounded-pill border border-white/15 bg-white/5 px-1.5 py-0.5 text-[8px] font-bold text-white/85">
            <Check size={9} strokeWidth={3} />
            AB案 3 種
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill border border-white/15 bg-white/5 px-1.5 py-0.5 text-[8px] font-bold text-white/85">
            <Check size={9} strokeWidth={3} />
            縦型 9:16 対応
          </span>
          <span className="inline-flex items-center gap-1 rounded-pill bg-white/10 px-1.5 py-0.5 text-[8px] font-bold text-white/75">
            <Clock size={9} strokeWidth={2.4} />
            納期 3 日
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
    <div className="space-y-2 bg-neon-midnight-deep p-4">
      <p className="inline-flex items-center gap-1 text-[10px] font-bold text-neon-cyan">
        <Bot size={12} strokeWidth={2} />
        AI 見積もりアシスタント
      </p>
      <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] p-2.5 text-[11px] leading-relaxed text-white/85">
        ご依頼内容のイメージを教えてください。たとえば「30 秒の SNS 広告動画
        を 3 本」など。
      </div>
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-neon-pink to-neon-purple p-2.5 text-[11px] leading-relaxed text-white">
        コスメ D2C 向け縦型 SNS 広告、15 秒 × 5 本を 1 週間で。
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] p-2.5 text-[11px] leading-relaxed text-white/85">
        おすすめは「<b className="text-neon-pink">スピード AB 案 パック</b>」。
        概算 <b className="text-neon-pink">¥150,000 〜 ¥200,000</b>。
        AB 各 1 案 × 5 本、3 営業日納品。正確な見積もりはメッセージで直接ご相談ください。
      </div>
      <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[10px] text-white/45">
        メッセージを入力…
        <span className="ml-auto rounded-full bg-gradient-to-r from-neon-pink to-neon-purple px-2 py-0.5 text-[9px] font-black text-white">
          送信
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
      status: "制作中",
      color: "bg-neon-cyan/20 text-neon-cyan",
      amount: "¥150,000",
    },
    {
      title: "コーポレートサイト ヒーロー動画",
      client: "SaaS スタートアップ Y",
      status: "納品済",
      color: "bg-neon-sunset/20 text-neon-sunset",
      amount: "¥320,000",
    },
    {
      title: "プロダクト紹介 ループ動画",
      client: "EC モール Z",
      status: "支払完了",
      color: "bg-emerald-400/20 text-emerald-300",
      amount: "¥80,000",
    },
  ];
  return (
    <div className="space-y-2 bg-neon-midnight-deep p-4">
      <div className="mb-2 flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
        <p className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
          <ShieldCheck size={12} strokeWidth={2.2} />
          エスクロー預かり中
        </p>
        <p className="text-xs font-black text-emerald-300">¥230,000</p>
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-white">
                {r.title}
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">{r.client}</p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex rounded-pill px-1.5 py-0.5 text-[8px] font-bold ${r.color}`}
              >
                {r.status}
              </span>
              <p className="mt-0.5 text-[11px] font-black text-white">
                {r.amount}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
