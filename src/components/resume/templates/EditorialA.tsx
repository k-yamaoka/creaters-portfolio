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
 * Editorial A
 * - 2 段組の雑誌風レイアウト
 * - クリーム色の紙背景 + 黒文字 + 赤アクセント
 * - 各作品は大型タイトル + パノラマ + 縦の段組み解説
 */

const PALETTE = {
  bg: "#fbf8f1", // cream
  ink: "#16140d",
  inkMuted: "#5a5446",
  accent: "#c0392b", // editorial red
  line: "#d9d2c1",
  panel: "#f1ead8",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bg,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontFamily: RESUME_FONT_FAMILY,
    fontSize: 10,
    color: PALETTE.ink,
    lineHeight: 1.7,
  },
  // === Magazine masthead ===
  masthead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 8,
    borderBottom: `2pt solid ${PALETTE.ink}`,
  },
  mastTitle: {
    fontSize: 8,
    color: PALETTE.ink,
    letterSpacing: 4,
  },
  mastIssue: { fontSize: 8, color: PALETTE.inkMuted, letterSpacing: 2 },
  // === Title block ===
  titleBlock: { marginTop: 28, marginBottom: 24 },
  bigTitleSm: {
    fontSize: 7,
    color: PALETTE.accent,
    letterSpacing: 4,
  },
  bigTitle: {
    fontSize: 42,
    color: PALETTE.ink,
    letterSpacing: 1,
    lineHeight: 1.1,
    marginTop: 12,
  },
  lede: {
    fontSize: 11,
    color: PALETTE.ink,
    lineHeight: 1.7,
    marginTop: 18,
    paddingTop: 14,
    borderTop: `0.5pt solid ${PALETTE.line}`,
  },
  // === 2 col grid ===
  twoCol: {
    flexDirection: "row",
    gap: 28,
    marginTop: 24,
  },
  col: { flex: 1 },
  colHead: {
    fontSize: 7,
    color: PALETTE.accent,
    letterSpacing: 3,
    marginBottom: 8,
    borderBottom: `0.5pt solid ${PALETTE.line}`,
    paddingBottom: 6,
  },
  colBody: { fontSize: 9.5, color: PALETTE.ink, lineHeight: 1.8 },
  kvRow: { flexDirection: "row", marginBottom: 3 },
  kvLabel: {
    width: 60,
    fontSize: 8,
    color: PALETTE.inkMuted,
  },
  kvValue: { flex: 1, fontSize: 9.5, color: PALETTE.ink },
  // === Tag pills ===
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tag: {
    fontSize: 8.5,
    color: PALETTE.ink,
    backgroundColor: PALETTE.panel,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 0,
  },
  // === Work block ===
  workBlock: { marginBottom: 28 },
  workNumber: {
    fontSize: 32,
    color: PALETTE.accent,
    letterSpacing: -1,
    marginBottom: 2,
    lineHeight: 1,
  },
  workTitle: {
    fontSize: 18,
    color: PALETTE.ink,
    marginBottom: 4,
  },
  workMeta: { fontSize: 8, color: PALETTE.inkMuted, marginBottom: 10 },
  workDesc: { fontSize: 9.5, color: PALETTE.ink, marginTop: 8, lineHeight: 1.8 },
  workLink: { fontSize: 8.5, color: PALETTE.accent, marginTop: 6 },
  // === Panorama ===
  panorama: {
    flexDirection: "row",
    gap: 3,
    height: 78,
    backgroundColor: PALETTE.panel,
  },
  panoFrame: { flex: 1, objectFit: "cover", backgroundColor: PALETTE.panel },
  panoMissing: { flex: 1, backgroundColor: PALETTE.panel },
  // === Footer ===
  footer: {
    position: "absolute",
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTop: `1pt solid ${PALETTE.ink}`,
    color: PALETTE.inkMuted,
    fontSize: 7,
    letterSpacing: 2,
  },
  footerName: { fontSize: 9, color: PALETTE.ink, letterSpacing: 2 },
});

function Footer({ pageLabel }: { pageLabel: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerName}>{SITE.name}.</Text>
      <Text>{pageLabel}</Text>
    </View>
  );
}

function Panorama({
  frames,
  thumb,
}: {
  frames: string[];
  thumb?: string;
}) {
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

export function EditorialA({
  data,
  thumbDataUrls,
  frameDataUrls,
}: {
  data: ResumeData;
  thumbDataUrls: Record<string, string>;
  frameDataUrls: Record<string, string[]>;
}) {
  const today = formatJaDate(new Date());
  const safeName = data.displayName || "クリエイター";
  const socials = SOCIAL_ORDER.map((o) => ({
    ...o,
    url: data.socialLinks[o.key],
  })).filter((o) => !!o.url);

  return (
    <Document title={`${safeName} - Editorial Resume`} author={safeName} creator={SITE.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.masthead}>
          <Text style={styles.mastTitle}>AILIER MAGAZINE — CREATOR ISSUE</Text>
          <Text style={styles.mastIssue}>{today}</Text>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.bigTitleSm}>FEATURED CREATOR</Text>
          <Text style={styles.bigTitle}>{safeName}</Text>
          <Text style={styles.lede}>
            {data.bio || "(自己紹介が未設定です)"}
          </Text>
        </View>

        <View style={styles.twoCol}>
          {/* Left col: contact + social */}
          <View style={styles.col}>
            <Text style={styles.colHead}>CONTACT</Text>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Email</Text>
              <Text style={styles.kvValue}>{data.email || "非公開"}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Portfolio</Text>
              <Text style={styles.kvValue}>{SITE.url}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Location</Text>
              <Text style={styles.kvValue}>{data.location || "—"}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Experience</Text>
              <Text style={styles.kvValue}>{data.yearsOfExperience} 年</Text>
            </View>

            <Text style={[styles.colHead, { marginTop: 16 }]}>SNS</Text>
            {socials.length > 0 ? (
              socials.map((s) => (
                <View key={s.key} style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{s.label}</Text>
                  <PdfLink src={s.url!} style={styles.kvValue}>
                    {s.url}
                  </PdfLink>
                </View>
              ))
            ) : (
              <Text style={styles.colBody}>(未設定)</Text>
            )}
          </View>

          {/* Right col: skills */}
          <View style={styles.col}>
            <Text style={styles.colHead}>STRENGTHS</Text>
            <View style={styles.tagRow}>
              {data.strengths.length > 0 ? (
                data.strengths.map((s) => (
                  <Text key={s} style={styles.tag}>
                    {s}
                  </Text>
                ))
              ) : (
                <Text style={styles.colBody}>(未設定)</Text>
              )}
            </View>

            <Text style={[styles.colHead, { marginTop: 16 }]}>GENRES</Text>
            <View style={styles.tagRow}>
              {data.genres.length > 0 ? (
                data.genres.map((g) => (
                  <Text key={g} style={styles.tag}>
                    {g}
                  </Text>
                ))
              ) : (
                <Text style={styles.colBody}>(未設定)</Text>
              )}
            </View>

            <Text style={[styles.colHead, { marginTop: 16 }]}>AI TOOLS</Text>
            <View style={styles.tagRow}>
              {data.aiTools.length > 0 ? (
                data.aiTools.map((t) => (
                  <Text key={t} style={styles.tag}>
                    {t}
                  </Text>
                ))
              ) : (
                <Text style={styles.colBody}>(未設定)</Text>
              )}
            </View>

            <Text style={[styles.colHead, { marginTop: 16 }]}>VIDEO LENGTHS</Text>
            <View style={styles.tagRow}>
              {data.videoLengths.length > 0 ? (
                data.videoLengths.map((l) => (
                  <Text key={l} style={styles.tag}>
                    {l}
                  </Text>
                ))
              ) : (
                <Text style={styles.colBody}>(未設定)</Text>
              )}
            </View>
          </View>
        </View>

        <Footer pageLabel="P. 01" />
      </Page>

      {data.works.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.masthead}>
            <Text style={styles.mastTitle}>WORKS — SELECTED</Text>
            <Text style={styles.mastIssue}>{data.works.length} ITEMS</Text>
          </View>

          <View style={{ marginTop: 22 }}>
            {data.works.map((w, i) => (
              <View key={w.id} style={styles.workBlock} wrap={false}>
                <Text style={styles.workNumber}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
                <Text style={styles.workTitle}>{w.title}</Text>
                <Text style={styles.workMeta}>
                  {[w.genre, aspectLabel(w.aspect_ratio)]
                    .filter(Boolean)
                    .join("  ／  ")}
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
          </View>

          <Footer pageLabel="P. 02" />
        </Page>
      )}
    </Document>
  );
}
