"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  Link as PdfLink,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ResumeData } from "../types";
import {
  RESUME_FONT_FAMILY,
  SITE,
  SOCIAL_ORDER,
  aspectLabel,
  formatJaDate,
} from "./common";

/**
 * Cinematic A
 * - 黒背景 / 白文字、シネスコ感のあるレターボックス
 * - 1 ページ目: 名前を巨大に / 自己紹介 / メタ + SNS
 * - 2 ページ目以降: 各作品の動画フレーム 5 枚をパノラマ横並び表示
 * - 全ページ右下に AILIER. ロゴ + URL
 */

const PALETTE = {
  bg: "#0a0d12",
  bgPanel: "#11161e",
  ink: "#f5f7fa",
  inkMuted: "#8b95a6",
  inkFaint: "#5a6271",
  accent: "#f5f7fa",
  line: "#252b36",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bg,
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: RESUME_FONT_FAMILY,
    fontSize: 9,
    color: PALETTE.ink,
    lineHeight: 1.6,
  },
  // === Hero ===
  heroBlock: { marginBottom: 36 },
  heroEyebrow: {
    fontSize: 8,
    color: PALETTE.inkFaint,
    letterSpacing: 4,
  },
  heroName: {
    fontSize: 48,
    color: PALETTE.ink,
    letterSpacing: 2,
    marginTop: 12,
    lineHeight: 1.1,
  },
  heroSubtitle: {
    fontSize: 9,
    color: PALETTE.inkMuted,
    letterSpacing: 1,
    marginTop: 16,
  },
  // === Letterbox separator ===
  letterbox: {
    backgroundColor: PALETTE.line,
    height: 1,
    marginVertical: 24,
  },
  // === Section ===
  sectionEyebrow: {
    fontSize: 7,
    color: PALETTE.inkFaint,
    letterSpacing: 3,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 10,
    color: PALETTE.ink,
    lineHeight: 1.8,
  },
  // === KV grid ===
  metaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 24, marginTop: 12 },
  metaCol: { width: 220 },
  metaLabel: {
    fontSize: 7,
    color: PALETTE.inkFaint,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  metaValue: { fontSize: 10, color: PALETTE.ink },
  // === Tag row ===
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag: {
    fontSize: 8,
    color: PALETTE.ink,
    backgroundColor: PALETTE.bgPanel,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 1,
  },
  // === Works (Page 2+) ===
  workBlock: { marginBottom: 36 },
  workIndex: {
    fontSize: 8,
    color: PALETTE.inkFaint,
    letterSpacing: 3,
    marginBottom: 4,
  },
  workTitle: {
    fontSize: 22,
    color: PALETTE.ink,
    letterSpacing: 1,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  workMeta: { fontSize: 8, color: PALETTE.inkMuted, marginBottom: 8 },
  workDesc: {
    fontSize: 9,
    color: PALETTE.ink,
    lineHeight: 1.8,
    marginTop: 8,
  },
  workLink: { fontSize: 8, color: PALETTE.ink, marginTop: 6 },
  // === Frame panorama (5 枚を横並びでシネマパノラマ風) ===
  panorama: {
    flexDirection: "row",
    gap: 2,
    height: 70,
    backgroundColor: PALETTE.bgPanel,
  },
  panoFrame: {
    flex: 1,
    objectFit: "cover",
    backgroundColor: PALETTE.bgPanel,
  },
  panoMissing: {
    flex: 1,
    backgroundColor: PALETTE.bgPanel,
  },
  // === Footer ===
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    color: PALETTE.inkFaint,
    fontSize: 7,
    letterSpacing: 2,
  },
  footerName: { fontSize: 10, color: PALETTE.ink, letterSpacing: 2 },
});

function Footer({ pageLabel }: { pageLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <View>
        <Text style={styles.footerName}>{SITE.name}.</Text>
      </View>
      <Text>{pageLabel}</Text>
    </View>
  );
}

function Panorama({
  frames,
  thumb,
}: {
  frames: string[]; // dataURL[]
  thumb?: string;
}) {
  // 5 枚揃ってなければ thumb で穴埋め、それも無ければ空ボックス
  const items = Array.from({ length: 5 }, (_, i) => frames[i] ?? thumb ?? null);
  return (
    <View style={styles.panorama}>
      {items.map((src, i) =>
        src ? (
          <PdfImage key={i} src={src} style={styles.panoFrame} />
        ) : (
          <View key={i} style={styles.panoMissing} />
        )
      )}
    </View>
  );
}

export function CinematicA({
  data,
  thumbDataUrls,
  frameDataUrls,
}: {
  data: ResumeData;
  thumbDataUrls: Record<string, string>;
  /** workId -> dataUrl[5] (順序付き、欠損あり得る) */
  frameDataUrls: Record<string, string[]>;
}) {
  const today = formatJaDate(new Date());
  const safeName = data.displayName || "クリエイター";
  const socials = SOCIAL_ORDER.map((o) => ({
    ...o,
    url: data.socialLinks[o.key],
  })).filter((o) => !!o.url);

  return (
    <Document
      title={`${safeName} - Cinematic Resume`}
      author={safeName}
      creator={SITE.name}
    >
      {/* ===== Page 1: Hero + プロフィール ===== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.heroBlock}>
          <Text style={styles.heroEyebrow}>CREATOR RESUME — CINEMATIC</Text>
          <Text style={styles.heroName}>{safeName}</Text>
          <Text style={styles.heroSubtitle}>
            {data.location ? `${data.location}  ·  ` : ""}
            EXPERIENCE {data.yearsOfExperience} YR  ·  ISSUED {today}
          </Text>
        </View>

        <View style={styles.letterbox} />

        <View>
          <Text style={styles.sectionEyebrow}>STATEMENT</Text>
          <Text style={styles.sectionBody}>
            {data.bio || "(自己紹介が未設定です)"}
          </Text>
        </View>

        <View style={styles.letterbox} />

        {/* メタ情報グリッド */}
        <View>
          <Text style={styles.sectionEyebrow}>PROFILE</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>EMAIL</Text>
              <Text style={styles.metaValue}>{data.email || "非公開"}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>PORTFOLIO</Text>
              <Text style={styles.metaValue}>{SITE.url}</Text>
            </View>
            {socials.slice(0, 4).map((s) => (
              <View key={s.key} style={styles.metaCol}>
                <Text style={styles.metaLabel}>{s.label.toUpperCase()}</Text>
                <PdfLink src={s.url!} style={styles.metaValue}>
                  {s.url}
                </PdfLink>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.letterbox} />

        {/* タグ系 */}
        <View>
          <Text style={styles.sectionEyebrow}>STRENGTHS</Text>
          <View style={styles.tagRow}>
            {data.strengths.length > 0 ? (
              data.strengths.map((s) => (
                <Text key={s} style={styles.tag}>
                  {s}
                </Text>
              ))
            ) : (
              <Text style={styles.sectionBody}>(未設定)</Text>
            )}
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionEyebrow}>GENRES</Text>
          <View style={styles.tagRow}>
            {data.genres.length > 0 ? (
              data.genres.map((g) => (
                <Text key={g} style={styles.tag}>
                  {g}
                </Text>
              ))
            ) : (
              <Text style={styles.sectionBody}>(未設定)</Text>
            )}
          </View>
        </View>
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionEyebrow}>AI TOOLS</Text>
          <View style={styles.tagRow}>
            {data.aiTools.length > 0 ? (
              data.aiTools.map((t) => (
                <Text key={t} style={styles.tag}>
                  {t}
                </Text>
              ))
            ) : (
              <Text style={styles.sectionBody}>(未設定)</Text>
            )}
          </View>
        </View>

        <Footer pageLabel="01 — PROFILE" />
      </Page>

      {/* ===== Page 2+: Works panorama ===== */}
      {data.works.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.heroBlock}>
            <Text style={styles.heroEyebrow}>WORKS</Text>
            <Text style={[styles.heroName, { fontSize: 32 }]}>
              {data.works.length} Selected
            </Text>
          </View>

          {data.works.map((w, i) => (
            <View key={w.id} style={styles.workBlock} wrap={false}>
              <Text style={styles.workIndex}>
                {String(i + 1).padStart(2, "0")} / {String(data.works.length).padStart(2, "0")}
              </Text>
              <Text style={styles.workTitle}>{w.title}</Text>
              <Text style={styles.workMeta}>
                {[w.genre, aspectLabel(w.aspect_ratio)]
                  .filter(Boolean)
                  .join("  ·  ")}
              </Text>
              <Panorama
                frames={frameDataUrls[w.id] ?? []}
                thumb={thumbDataUrls[w.id]}
              />
              {w.description && (
                <Text style={styles.workDesc}>{w.description}</Text>
              )}
              {(w.external_url || w.video_url) && (
                <PdfLink
                  src={w.external_url || w.video_url || "#"}
                  style={styles.workLink}
                >
                  → {w.external_url || w.video_url}
                </PdfLink>
              )}
            </View>
          ))}

          <Footer pageLabel="02 — WORKS" />
        </Page>
      )}
    </Document>
  );
}
