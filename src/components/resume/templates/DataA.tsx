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
 * Data A
 * - 数字 / スキル / タグ を視覚的に強調するロジカル系
 * - サイドバー (アイコン記号 + 数値) + メイン (作品)
 * - ネイビー + シアン アクセント
 */

const PALETTE = {
  bg: "#ffffff",
  ink: "#0a0d12",
  inkMuted: "#5e636b",
  inkFaint: "#9298a1",
  navy: "#0a2540",
  cyan: "#00b3a6",
  line: "#e5e7eb",
  panel: "#f3f7fb",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bg,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 0,
    fontFamily: RESUME_FONT_FAMILY,
    fontSize: 10,
    color: PALETTE.ink,
    lineHeight: 1.6,
    flexDirection: "row",
  },
  // === Sidebar ===
  sidebar: {
    width: 200,
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: PALETTE.navy,
    color: "#ffffff",
  },
  sbName: {
    fontSize: 22,
    color: "#ffffff",
    lineHeight: 1.2,
    marginTop: 4,
    marginBottom: 4,
  },
  sbRole: { fontSize: 8, color: "#bcd4e6", letterSpacing: 2 },
  sbBlock: { marginTop: 24 },
  sbLabel: {
    fontSize: 7,
    color: PALETTE.cyan,
    letterSpacing: 3,
    marginBottom: 6,
  },
  sbBody: { fontSize: 9, color: "#e6edf3", lineHeight: 1.7 },
  sbKvRow: { flexDirection: "row", marginBottom: 4 },
  sbKvLabel: { width: 56, fontSize: 8, color: "#bcd4e6" },
  sbKvValue: { flex: 1, fontSize: 9, color: "#ffffff" },
  // === Stat ===
  statGrid: { flexDirection: "row", gap: 12, marginTop: 6 },
  statBox: { flex: 1 },
  statNum: {
    fontSize: 28,
    color: PALETTE.cyan,
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 7,
    color: "#bcd4e6",
    letterSpacing: 2,
    marginTop: 2,
  },
  // === Tag (white on navy) ===
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  tag: {
    fontSize: 8,
    color: "#ffffff",
    backgroundColor: "#1a3a5c",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 2,
  },
  // === Main col ===
  main: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 8,
  },
  mainHead: {
    fontSize: 7,
    color: PALETTE.inkFaint,
    letterSpacing: 4,
    marginBottom: 6,
  },
  mainTitle: {
    fontSize: 16,
    color: PALETTE.ink,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: `1pt solid ${PALETTE.navy}`,
  },
  bioBox: {
    fontSize: 10,
    color: PALETTE.ink,
    backgroundColor: PALETTE.panel,
    padding: 12,
    lineHeight: 1.8,
    marginBottom: 18,
  },
  // === Work block ===
  workBlock: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: `0.5pt solid ${PALETTE.line}`,
  },
  workHead: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  workIdx: { fontSize: 18, color: PALETTE.cyan },
  workTitle: { fontSize: 12, color: PALETTE.ink },
  workMeta: { fontSize: 8, color: PALETTE.inkMuted, marginTop: 2, marginBottom: 8 },
  panorama: {
    flexDirection: "row",
    gap: 2,
    height: 50,
    backgroundColor: PALETTE.panel,
  },
  panoFrame: { flex: 1, objectFit: "cover", backgroundColor: PALETTE.panel },
  panoMissing: { flex: 1, backgroundColor: PALETTE.panel },
  workDesc: { fontSize: 9, color: PALETTE.ink, marginTop: 8, lineHeight: 1.7 },
  workLink: { fontSize: 8, color: PALETTE.cyan, marginTop: 4 },
  // === Footer ===
  footer: {
    position: "absolute",
    bottom: 20,
    left: 200 + 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTop: `0.5pt solid ${PALETTE.line}`,
    color: PALETTE.inkFaint,
    fontSize: 7,
    letterSpacing: 2,
  },
  footerName: { fontSize: 9, color: PALETTE.navy, letterSpacing: 1.5 },
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

function Sidebar({ data }: { data: ResumeData }) {
  const socials = SOCIAL_ORDER.map((o) => ({
    ...o,
    url: data.socialLinks[o.key],
  })).filter((o) => !!o.url);

  return (
    <View style={styles.sidebar}>
      <Text style={styles.sbRole}>CREATOR</Text>
      <Text style={styles.sbName}>{data.displayName}</Text>

      {/* 数字スタッツ */}
      <View style={styles.sbBlock}>
        <Text style={styles.sbLabel}>STATS</Text>
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{data.yearsOfExperience}</Text>
            <Text style={styles.statLabel}>YEARS EXP</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{data.works.length}</Text>
            <Text style={styles.statLabel}>WORKS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{data.aiTools.length}</Text>
            <Text style={styles.statLabel}>AI TOOLS</Text>
          </View>
        </View>
      </View>

      <View style={styles.sbBlock}>
        <Text style={styles.sbLabel}>CONTACT</Text>
        <View style={styles.sbKvRow}>
          <Text style={styles.sbKvLabel}>Email</Text>
          <Text style={styles.sbKvValue}>{data.email || "非公開"}</Text>
        </View>
        <View style={styles.sbKvRow}>
          <Text style={styles.sbKvLabel}>Site</Text>
          <Text style={styles.sbKvValue}>{SITE.url}</Text>
        </View>
        <View style={styles.sbKvRow}>
          <Text style={styles.sbKvLabel}>Location</Text>
          <Text style={styles.sbKvValue}>{data.location || "—"}</Text>
        </View>
      </View>

      <View style={styles.sbBlock}>
        <Text style={styles.sbLabel}>SNS</Text>
        {socials.length > 0 ? (
          socials.map((s) => (
            <View key={s.key} style={styles.sbKvRow}>
              <Text style={styles.sbKvLabel}>{s.label}</Text>
              <PdfLink src={s.url!} style={styles.sbKvValue}>
                {s.url}
              </PdfLink>
            </View>
          ))
        ) : (
          <Text style={styles.sbBody}>(未設定)</Text>
        )}
      </View>

      <View style={styles.sbBlock}>
        <Text style={styles.sbLabel}>STRENGTHS</Text>
        <View style={styles.tagRow}>
          {data.strengths.length > 0 ? (
            data.strengths.map((s) => (
              <Text key={s} style={styles.tag}>
                {s}
              </Text>
            ))
          ) : (
            <Text style={styles.sbBody}>(未設定)</Text>
          )}
        </View>
      </View>

      <View style={styles.sbBlock}>
        <Text style={styles.sbLabel}>GENRES</Text>
        <View style={styles.tagRow}>
          {data.genres.length > 0 ? (
            data.genres.map((g) => (
              <Text key={g} style={styles.tag}>
                {g}
              </Text>
            ))
          ) : (
            <Text style={styles.sbBody}>(未設定)</Text>
          )}
        </View>
      </View>

      <View style={styles.sbBlock}>
        <Text style={styles.sbLabel}>AI TOOLS</Text>
        <View style={styles.tagRow}>
          {data.aiTools.length > 0 ? (
            data.aiTools.map((t) => (
              <Text key={t} style={styles.tag}>
                {t}
              </Text>
            ))
          ) : (
            <Text style={styles.sbBody}>(未設定)</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export function DataA({
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

  return (
    <Document title={`${safeName} - Data Resume`} author={safeName} creator={SITE.name}>
      <Page size="A4" style={styles.page}>
        <Sidebar data={data} />

        <View style={styles.main}>
          <Text style={styles.mainHead}>CREATOR RESUME — DATA SHEET — {today}</Text>
          <Text style={styles.mainTitle}>STATEMENT</Text>
          <View style={styles.bioBox}>
            <Text>{data.bio || "(自己紹介が未設定です)"}</Text>
          </View>

          <Text style={styles.mainTitle}>WORKS — {data.works.length}</Text>
          {data.works.map((w, i) => (
            <View key={w.id} style={styles.workBlock} wrap={false}>
              <View style={styles.workHead}>
                <Text style={styles.workIdx}>#{i + 1}</Text>
                <Text style={styles.workTitle}>{w.title}</Text>
              </View>
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

        <Footer pageLabel="DATA SHEET" />
      </Page>
    </Document>
  );
}
