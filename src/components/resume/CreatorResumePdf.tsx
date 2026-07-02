"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  Link as PdfLink,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ResumeData, ResumeWork } from "./types";

export type { ResumeData, ResumeWork };

/**
 * クリエイター職務経歴書 PDF — 2 ページ構成。
 *
 * デザイン方向性 (参考: ミニマル系ポートフォリオサイト):
 *  - 白基調 + 黒タイポ大胆
 *  - 巨大英字見出し (Helvetica 内蔵フォント) + 小さめ和文 (Sawarabi Gothic)
 *  - 余白広めでミニマル
 *
 * ページ構成:
 *  - Page 1: PROFILE
 *      左 1/3: アバター縦長 + SNS
 *      右 2/3: ABOUT (名前/略歴/自己紹介) / TOOLS / SKILLS / INFO
 *  - Page 2: PORTFOLIO
 *      巨大英字タイトル "HELLO! / PORTFOLIO" + 短いリード
 *      大型ヒーロー: 最新作品の動画フレーム 2 枚 並び
 *      3 列グリッド: 残り作品のサムネ + meta
 *      フッター
 *
 * フォント:
 *  - Helvetica は @react-pdf 内蔵 (登録不要)。英字大型タイトル用
 *  - Sawarabi Gothic は public/fonts/ から登録、和文用
 */

// === フォント登録 ====================================================
const RESUME_FONT_TTF = "/fonts/SawarabiGothic.ttf";
const JP_FAMILY = "SawarabiGothic";

let _fontRegistered = false;

export function registerResumeFont(srcOverride?: string) {
  if (_fontRegistered) return;
  try {
    const src = srcOverride ?? RESUME_FONT_TTF;
    Font.register({
      family: JP_FAMILY,
      fonts: [{ src, fontWeight: "normal" }],
    });
    Font.registerHyphenationCallback((word) => Array.from(word));
    _fontRegistered = true;
  } catch {
    /* HMR 多重登録は無視 */
  }
}

// === Constants =======================================================
const SITE = {
  name: "AILIER",
  url: "https://creaters-portfolio.vercel.app",
};

const PALETTE = {
  bg: "#fafaf9",
  ink: "#0a0a0a",
  inkSoft: "#3a3a3a",
  inkMuted: "#6b6b6b",
  inkFaint: "#a0a0a0",
  line: "#e5e5e5",
  panel: "#f1f1f0",
  pillBg: "#ffffff",
  pillBorder: "#e0e0e0",
};

const SOCIAL_ORDER: Array<{ key: string; label: string }> = [
  { key: "website", label: "Website" },
  { key: "x", label: "X" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
];

const aspectLabel = (
  a: "vertical" | "horizontal" | "square"
): string => (a === "vertical" ? "縦型" : a === "square" ? "正方形" : "横型");

// === Styles ==========================================================
const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bg,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontFamily: JP_FAMILY,
    fontSize: 9,
    color: PALETTE.ink,
    lineHeight: 1.7,
  },

  // === Top nav-style pill ===
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  navPill: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: PALETTE.pillBorder,
    backgroundColor: PALETTE.pillBg,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  navItem: {
    fontSize: 7.5,
    color: PALETTE.inkFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    letterSpacing: 1.5,
  },
  navItemActive: {
    fontSize: 7.5,
    color: PALETTE.ink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    letterSpacing: 1.5,
    backgroundColor: PALETTE.bg,
    borderRadius: 999,
  },
  topRight: {
    fontSize: 7.5,
    color: PALETTE.inkMuted,
    letterSpacing: 1.5,
  },

  // === Hero title (大型英字) ===
  // 2026-07-02: 24 → 18 で下方向の余白を詰め、Page 2 での grid 展開に
  // 余裕を持たせる
  heroBlock: { marginBottom: 18 },
  heroEn: {
    fontFamily: "Helvetica-Bold",
    fontSize: 56,
    color: PALETTE.ink,
    letterSpacing: -1,
    lineHeight: 1.0,
  },
  heroEnSecond: {
    fontFamily: "Helvetica-Bold",
    fontSize: 56,
    color: PALETTE.ink,
    letterSpacing: -1,
    lineHeight: 1.0,
    marginTop: 4,
  },
  heroJpSub: {
    fontSize: 9,
    color: PALETTE.inkMuted,
    marginTop: 8,
    letterSpacing: 2,
  },
  heroLead: {
    fontSize: 9,
    color: PALETTE.inkSoft,
    lineHeight: 1.7,
  },

  // === Section heading (中型英字) ===
  // 2026-07-02: 18 → 15 に縮小 + marginBottom 14 → 10 で縦間を詰めて
  // 2 ページに収める余裕を確保
  sectionHead: {
    fontFamily: "Helvetica-Bold",
    fontSize: 15,
    color: PALETTE.ink,
    letterSpacing: 1,
    marginBottom: 10,
  },

  // === 2-col grid for profile ===
  profileGrid: { flexDirection: "row", gap: 32 },
  avatarCol: { width: 180 },
  rightCol: { flex: 1 },

  // === Avatar ===
  avatarBox: {
    width: 180,
    height: 240,
    backgroundColor: PALETTE.panel,
    objectFit: "cover",
  },
  avatarPlaceholder: {
    width: 180,
    height: 240,
    backgroundColor: PALETTE.panel,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholderText: { fontSize: 8, color: PALETTE.inkFaint },

  // === ABOUT ===
  aboutNameRow: { flexDirection: "row", alignItems: "baseline", gap: 12 },
  aboutNameEn: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: PALETTE.ink,
    letterSpacing: 0.5,
  },
  aboutNameJp: { fontSize: 9, color: PALETTE.inkMuted },
  aboutMeta: { fontSize: 9, color: PALETTE.inkMuted, marginTop: 6 },
  aboutBio: {
    fontSize: 9.5,
    color: PALETTE.ink,
    lineHeight: 1.85,
    marginTop: 10,
  },

  // === Pill (TOOLS) ===
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: {
    fontSize: 8,
    color: PALETTE.ink,
    backgroundColor: PALETTE.pillBg,
    borderWidth: 0.5,
    borderColor: PALETTE.pillBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  // === Tag (SKILLS — # prefix on bg) ===
  // 2026-07-02: 高スキル数ユーザーで縦に伸びて Page 2 に溢れる問題があった
  // ため、fontSize と padding を詰めてコンパクト化。SKILLS の総数上限も併用。
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tag: {
    fontSize: 7.5,
    color: PALETTE.inkSoft,
    backgroundColor: PALETTE.panel,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tagMore: {
    fontSize: 7.5,
    color: PALETTE.inkMuted,
    backgroundColor: "transparent",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  // === INFO list ===
  infoRow: {
    flexDirection: "row",
    backgroundColor: PALETTE.pillBg,
    borderWidth: 0.5,
    borderColor: PALETTE.pillBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
    borderRadius: 4,
    alignItems: "center",
  },
  infoLabel: { width: 64, fontSize: 8, color: PALETTE.inkMuted },
  infoValue: { flex: 1, fontSize: 9, color: PALETTE.ink },
  infoLink: { flex: 1, fontSize: 9, color: PALETTE.ink },

  // === Section gap === (2026-07-02: 22 → 14 で縦間を詰めて 2 ページに収める)
  sectionGap: { height: 14 },

  // === Hero gallery (page 2 large two-up) ===
  heroGallery: {
    flexDirection: "row",
    gap: 12,
    height: 150,
    marginBottom: 18,
  },
  heroImgLeft: {
    width: 160,
    height: 150,
    backgroundColor: PALETTE.panel,
    objectFit: "cover",
  },
  heroImgRight: {
    flex: 1,
    height: 150,
    backgroundColor: PALETTE.panel,
    objectFit: "cover",
  },
  heroImgPlaceholder: {
    backgroundColor: PALETTE.panel,
    alignItems: "center",
    justifyContent: "center",
  },

  // === Work grid (3 cols × 2 rows = 6 件まで) ===
  workGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  workCard: {
    width: 152, // (page width 595 - 56*2 padding - 12*2 gap) / 3 = 153
  },
  // 2 ページ完結を保証するため、aspect ratio に関わらず全 thumb を
  // 統一サイズ 152×114 (4:3) でセンタークロップ。縦型/正方形は cover で詰める。
  workThumb: {
    width: 152,
    height: 114,
    backgroundColor: PALETTE.panel,
    objectFit: "cover",
  },
  workThumbVertical: {
    width: 152,
    height: 114,
    backgroundColor: PALETTE.panel,
    objectFit: "cover",
  },
  overflowNote: {
    fontSize: 9,
    color: PALETTE.inkMuted,
    textAlign: "center",
    marginTop: 16,
    letterSpacing: 1,
  },
  workMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  workDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PALETTE.ink,
  },
  workClient: {
    fontSize: 8,
    color: PALETTE.ink,
    letterSpacing: 0.5,
  },
  workTitle: {
    fontSize: 8,
    color: PALETTE.inkMuted,
    marginTop: 2,
    marginLeft: 10, // dot 分インデント
  },
  workDesc: {
    fontSize: 8,
    color: PALETTE.inkFaint,
    marginTop: 2,
    marginLeft: 10,
  },

  // === Footer ===
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    color: PALETTE.inkMuted,
    fontSize: 7,
    letterSpacing: 1.5,
  },
});

// === Components ======================================================
function NavBar({ active }: { active: "WORKS" | "PROFILE" }) {
  return (
    <View style={styles.topRow}>
      <View style={styles.navPill}>
        <Text style={active === "WORKS" ? styles.navItemActive : styles.navItem}>
          WORKS
        </Text>
        <Text style={active === "PROFILE" ? styles.navItemActive : styles.navItem}>
          PROFILE
        </Text>
      </View>
      <Text style={styles.topRight}>{SITE.url.replace(/^https?:\/\//, "")}</Text>
    </View>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <View style={styles.footer} fixed>
      <Text>© {year} {SITE.name}</Text>
      <Text>·</Text>
      <Text>{SITE.url}</Text>
    </View>
  );
}

function Avatar({ src }: { src?: string | null }) {
  if (!src) {
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarPlaceholderText}>No Photo</Text>
      </View>
    );
  }
  return <PdfImage src={src} style={styles.avatarBox} />;
}

function Info({
  label,
  children,
  href,
}: {
  label: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {href ? (
        <PdfLink src={href} style={styles.infoLink}>
          {children}
        </PdfLink>
      ) : (
        <Text style={styles.infoValue}>{children}</Text>
      )}
    </View>
  );
}

function WorkGridCard({
  work,
  thumbDataUrl,
}: {
  work: ResumeWork;
  thumbDataUrl?: string;
}) {
  const thumbStyle =
    work.aspect_ratio === "vertical"
      ? styles.workThumbVertical
      : styles.workThumb;
  return (
    <View style={styles.workCard} wrap={false}>
      {thumbDataUrl ? (
        <PdfImage src={thumbDataUrl} style={thumbStyle} />
      ) : (
        <View style={[thumbStyle, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ fontSize: 7, color: PALETTE.inkFaint }}>
            No Image
          </Text>
        </View>
      )}
      <View style={styles.workMetaRow}>
        <View style={styles.workDot} />
        <Text style={styles.workClient}>
          {work.genre || "WORK"}
        </Text>
      </View>
      <Text style={styles.workTitle}>{work.title}</Text>
      {work.aspect_ratio && (
        <Text style={styles.workDesc}>{aspectLabel(work.aspect_ratio)}</Text>
      )}
    </View>
  );
}

// === Main Document ===================================================
export function CreatorResumePdf({
  data,
  thumbDataUrls,
  frameDataUrls,
  avatarDataUrl,
}: {
  data: ResumeData;
  thumbDataUrls: Record<string, string>;
  frameDataUrls: Record<string, string[]>;
  /** プロフィール画像 dataURL (Button 側で事前 fetch) */
  avatarDataUrl?: string;
}) {
  const safeName = data.displayName || "クリエイター";
  const socials = SOCIAL_ORDER.map((o) => ({
    ...o,
    url: data.socialLinks[o.key],
  })).filter((o) => !!o.url);

  // ===== Hero gallery 用素材選定 =====
  // 1 件目の作品のフレーム 0 と 2 を 2 枚並びにする (動画パノラマ感)
  const heroWork = data.works[0];
  const heroFrames = heroWork ? frameDataUrls[heroWork.id] ?? [] : [];
  const heroThumb = heroWork ? thumbDataUrls[heroWork.id] : undefined;
  const heroLeft = heroFrames[0] ?? heroThumb;
  const heroRight = heroFrames[2] ?? heroFrames[1] ?? heroThumb;

  // ===== 2 ページ完結を保証 =====
  // Page 2 は Hero (1 件) + Grid (3 列 × 2 行 = 6 件) で計 7 件まで。
  // それを超える作品は overflow note でサイト URL に誘導 (PDF 増ページしない)。
  const MAX_GRID = 6;
  const allRest = heroWork ? data.works.slice(1) : data.works;
  const restWorks = allRest.slice(0, MAX_GRID);
  const overflowCount = allRest.length - restWorks.length;

  return (
    <Document
      title={`${safeName} - Portfolio`}
      author={safeName}
      creator={SITE.name}
    >
      {/* ============ Page 1: PROFILE ============ */}
      <Page size="A4" style={styles.page}>
        <NavBar active="PROFILE" />

        <View style={styles.heroBlock}>
          <Text style={styles.heroEn}>PROFILE</Text>
          <Text style={styles.heroJpSub}>プロフィール</Text>
        </View>

        <View style={styles.profileGrid}>
          {/* Left: Avatar */}
          <View style={styles.avatarCol}>
            <Avatar src={avatarDataUrl} />
          </View>

          {/* Right: ABOUT / TOOLS / SKILLS / INFO */}
          <View style={styles.rightCol}>
            {/* ABOUT */}
            <Text style={styles.sectionHead}>ABOUT</Text>
            <View style={styles.aboutNameRow}>
              <Text style={styles.aboutNameEn}>{safeName}</Text>
              {data.location && (
                <Text style={styles.aboutNameJp}>／ {data.location}</Text>
              )}
            </View>
            <Text style={styles.aboutMeta}>
              経験年数 {data.yearsOfExperience} 年
              {data.works.length > 0 && `  ／  公開作品 ${data.works.length} 件`}
            </Text>
            <Text style={styles.aboutBio}>
              {data.bio || "(自己紹介が未設定です)"}
            </Text>

            <View style={styles.sectionGap} />

            {/* TOOLS (AI ツール) */}
            <Text style={styles.sectionHead}>TOOLS</Text>
            {data.aiTools.length > 0 ? (
              <View style={styles.pillRow}>
                {data.aiTools.map((t) => (
                  <Text key={t} style={styles.pill}>
                    {t}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.aboutBio}>(未設定)</Text>
            )}

            <View style={styles.sectionGap} />

            {/* SKILLS (strengths + genres + video lengths)
                2026-07-02: 全部展開すると 20+ 個で縦に伸び Page 2 に溢れる
                問題があった。上限を SKILL_LIMIT に絞り、超過分は "+N more"
                で 1 タグ相当に集約 → Page 1 に確実に収まる。 */}
            <Text style={styles.sectionHead}>SKILLS</Text>
            {(() => {
              const SKILL_LIMIT = 14;
              const all = [
                ...data.strengths,
                ...data.genres,
                ...data.videoLengths,
              ];
              const shown = all.slice(0, SKILL_LIMIT);
              const rest = all.length - shown.length;
              return (
                <View style={styles.tagRow}>
                  {shown.map((s, i) => (
                    <Text key={`${s}-${i}`} style={styles.tag}>
                      #{s}
                    </Text>
                  ))}
                  {rest > 0 && (
                    <Text style={styles.tagMore}>+ {rest} more</Text>
                  )}
                </View>
              );
            })()}

            <View style={styles.sectionGap} />

            {/* INFO (Contact + SNS) */}
            <Text style={styles.sectionHead}>INFO</Text>
            <Info label="Email">{data.email || "非公開"}</Info>
            <Info label="Portfolio" href={SITE.url}>
              {SITE.url}
            </Info>
            {socials.map((s) => (
              <Info key={s.key} label={s.label} href={s.url}>
                {s.url}
              </Info>
            ))}
          </View>
        </View>

        <Footer />
      </Page>

      {/* ============ Page 2: PORTFOLIO ============ */}
      <Page size="A4" style={styles.page} wrap>
        <NavBar active="WORKS" />

        {/* 2026-07-02: 旧 gap 32 + 右 200 だと左カラム幅が不足し
            "PORTFOLIO" が "PORTFO-LIO" に改行されて 3 ページ化を招いた。
            gap 32 → 16, 右カラム 200 → 150 に詰めて左を広げ、改行を回避。 */}
        <View style={[styles.heroBlock, { flexDirection: "row", alignItems: "flex-end", gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEn}>HELLO!</Text>
            <Text style={styles.heroEnSecond}>PORTFOLIO</Text>
            <Text style={styles.heroJpSub}>{safeName} ／ Works {data.works.length}</Text>
          </View>
          <View style={{ width: 150 }}>
            <Text style={styles.heroLead}>
              {data.bio
                ? data.bio.slice(0, 110) + (data.bio.length > 110 ? "…" : "")
                : "公開中の AI 映像作品をまとめています。各作品の代表シーンを 1 枚目に大きく、続いてグリッドで一覧表示。"}
            </Text>
          </View>
        </View>

        {/* Hero gallery (2 枚並び) — 動画フレームを大型表示 */}
        {heroWork && (heroLeft || heroRight) && (
          <View style={styles.heroGallery}>
            {heroLeft ? (
              <PdfImage src={heroLeft} style={styles.heroImgLeft} />
            ) : (
              <View style={[styles.heroImgLeft, styles.heroImgPlaceholder]} />
            )}
            {heroRight ? (
              <PdfImage src={heroRight} style={styles.heroImgRight} />
            ) : (
              <View style={[styles.heroImgRight, styles.heroImgPlaceholder]} />
            )}
          </View>
        )}

        {/* 3 列グリッド (最大 6 件) */}
        <View style={styles.workGrid}>
          {restWorks.map((w) => (
            <WorkGridCard
              key={w.id}
              work={w}
              thumbDataUrl={
                thumbDataUrls[w.id] ?? (frameDataUrls[w.id] ?? [])[0]
              }
            />
          ))}
        </View>

        {overflowCount > 0 && (
          <Text style={styles.overflowNote}>
            他 {overflowCount} 件の作品を {SITE.url} で公開中
          </Text>
        )}

        <Footer />
      </Page>
    </Document>
  );
}
