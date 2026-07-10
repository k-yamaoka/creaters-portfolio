"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

/**
 * TOP ページ Works ダイジェスト (Section 5 / axis Works 型)。
 *
 * 仕様:
 * - AI 動画作品を高密度に敷き詰める Justified 風レイアウト
 * - 隙間 1px、原寸比率を尊重 (flex-grow + flex-basis をアスペクト比に揃える
 *   CSS のみ Justified 近似。Flickr/JS 実装の重ライブラリは使わない)
 * - カテゴリタブ (All/SNS広告/商品紹介/コーポレートVP/MV/ショートドラマ/
 *   AIアバター) で切替。切替時は opacity 300ms で fade in/out
 * - 各タイルはホバーで動画プレビュー、通常は poster 静止
 * - 各動画 muted、IO で画面内のみ video を mount + 再生
 * - prefers-reduced-motion: reduce 時はホバー再生せずクリックで詳細
 * - 末尾に "View more works" CTA (ホバーで ArrowRight 連続フロー)
 */

export type DigestWork = {
  id: string;
  videoUrl: string;
  posterUrl: string | null;
  href: string;
  title: string;
  creatorName: string;
  genre: string | null;
  /** 幅 / 高さ。flex Justified 計算用 */
  aspectRatio: number;
};

const TABS = [
  { key: "all", label: "All ／ すべて", genre: null as string | null },
  { key: "sns", label: "SNS広告", genre: "SNS広告動画" },
  { key: "product", label: "商品紹介", genre: "商品紹介動画" },
  { key: "corp", label: "コーポレートVP", genre: "会社紹介・コーポレートVP" },
  { key: "mv", label: "MV", genre: "ミュージックビデオ" },
  { key: "drama", label: "ショートドラマ", genre: "ショートドラマ" },
  { key: "ai", label: "AIアバター", genre: "AIアバター・キャラクター動画" },
] as const;

type Props = {
  works: DigestWork[];
};

export function WorksDigest({ works }: Props) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("all");

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab?.genre) return works;
    return works.filter((w) => w.genre === tab.genre);
  }, [activeTab, works]);

  // タブ切替時に opacity フェードを掛けるためのキー。
  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    setRenderKey((k) => k + 1);
  }, [activeTab]);

  return (
    <section className="relative bg-paper text-ink">
      <div className="relative mx-auto max-w-wide px-gutter py-section-y-sm lg:py-section-y">
        {/* ヘッダ — 英字主役 + JP 併記 */}
        <div className="mb-10">
          <p className="eyebrow-mono">
            (Works){" "}
            <span className="ml-2 text-ink/35">／ 制作実績ダイジェスト</span>
          </p>
          <h2 className="headline-display mt-6 text-[clamp(2.5rem,5.5vw,4.5rem)] text-ink">
            Selected{" "}
            <span className="italic text-sand">works.</span>
          </h2>
          <p className="mt-3 text-sm font-medium tracking-wide text-ink/60">
            えらばれた作品
          </p>
          <p className="body-jp mt-4 max-w-prose-jp text-sm text-ink/65">
            AILIER に所属する AI クリエイターによる作品の一部です。
          </p>
        </div>

        {/* カテゴリタブ — 横スクロール許容 */}
        <div className="-mx-gutter mb-6 overflow-x-auto px-gutter">
          <div role="tablist" className="flex w-max gap-1">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              const count =
                t.genre == null
                  ? works.length
                  : works.filter((w) => w.genre === t.genre).length;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-pill border px-4 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/15 bg-paper text-ink/70 hover:border-ink/40 hover:text-ink"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`font-mono text-[10px] ${
                      active ? "text-paper/65" : "text-ink/40"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Justified 近似グリッド */}
        <div
          key={renderKey}
          className="flex flex-wrap gap-px transition-opacity duration-300 ease-out"
        >
          {filtered.map((w) => (
            <DigestTile key={w.id} work={w} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-ink/55">
            該当カテゴリの作品はまだありません
          </p>
        )}

        {/* View more works CTA — ホバーで矢印フロー */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/portfolios"
            className="group inline-flex items-center gap-3 rounded-pill border border-ink/20 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink/60"
          >
            <span>View more works</span>
            <span className="block text-ink/40 group-hover:hidden">
              <span className="ml-1 font-sans normal-case tracking-normal text-[11px] text-ink/45">
                すべての制作実績
              </span>
            </span>
            {/* 矢印が連続して流れる装飾 */}
            <span
              aria-hidden
              className="relative inline-flex h-3 w-12 items-center overflow-hidden"
            >
              <ArrowRight
                size={14}
                strokeWidth={1.6}
                className="absolute -left-1 transition-transform duration-300 group-hover:translate-x-3"
              />
              <ArrowRight
                size={14}
                strokeWidth={1.6}
                className="absolute -left-1 -translate-x-3 opacity-0 transition-all duration-300 group-hover:translate-x-3 group-hover:opacity-100"
              />
              <ArrowRight
                size={14}
                strokeWidth={1.6}
                className="absolute -left-1 -translate-x-6 opacity-0 transition-all delay-75 duration-300 group-hover:translate-x-3 group-hover:opacity-100"
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ===== タイル ===== */

function DigestTile({ work }: { work: DigestWork }) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [inView, setInView] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const apply = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setInView(true);
      },
      { rootMargin: "200px 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovering && !reducedMotion) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  }, [hovering, reducedMotion]);

  return (
    <Link
      ref={ref}
      href={work.href}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      className="group relative block overflow-hidden bg-ink/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
      style={{
        // Justified 近似: 行高さは height でも flex-basis でも管理可能。
        // flex-basis に "高さ x aspect" を入れ、flex-grow にも aspect を入れて
        // 行内で広い作品ほど多く伸ばす。height は固定し原寸感を保つ。
        flexGrow: work.aspectRatio,
        flexBasis: `${work.aspectRatio * 200}px`,
        height: "clamp(150px, 22vw, 240px)",
      }}
      aria-label={`${work.creatorName} ${work.title}`}
    >
      {/* poster */}
      {work.posterUrl && (
        <Image
          src={work.posterUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-[filter] duration-300 group-hover:brightness-90"
        />
      )}

      {/* video (IO 経由で mount) */}
      {inView && (
        <video
          ref={videoRef}
          src={work.videoUrl}
          poster={work.posterUrl ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            hovering && !reducedMotion ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* ホバー時 明度変化のオーバーレイ (レイアウトを動かさない = 隙間維持) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15"
      />

      {/* タイトル / クリエイター名 — 下端 hover で reveal */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="pointer-events-none absolute inset-x-3 bottom-2 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="line-clamp-1 text-[11px] font-medium text-white">
          {work.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-white/75">
          {work.creatorName}
        </p>
      </div>
    </Link>
  );
}
