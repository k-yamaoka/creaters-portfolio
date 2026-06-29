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
 * Minimal A
 * - 白背景 + 細罫線中心、余白を多めに取った静謐なデザイン
 * - フレーム 5 枚を 2:1 のワイドな細長帯として表示
 */

const PALETTE = {
  bg: "#ffffff",
  ink: "#0a0d12",
  inkMuted: "#5e636b",
  inkFaint: "#9298a1",
  line: "#e5e7eb",
  panel: "#f9fafb",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bg,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 64,
    fontFamily: RESUME_FONT_FAMILY,
    fontSize: 10,
    color: PALETTE.ink,
    lineHeight: 1.7,
  },
  // === Hero ===
  hero: { marginBottom: 28 },
  heroEyebrow: {
    fontSize: 7,
    color: PALETTE.inkFaint,
    letterSpacing: 4,
  },
  heroName: {
    fontSize: 32,
    lineHeight: 1.25,
    marginTop: 10,
  },
  heroMeta: {
    fontSize: 9,
    color: PALETTE.inkMuted,
    marginTop: 8,
  },
  hr: { borderBottom: `0.5pt solid ${PALETTE.line}`, marginVertical: 20 },
  // === Section ===
  section: { marginBottom: 22 },
  sectionLabel: {
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
  // === KV ===
  kvRow: { flexDirection: "row", marginBottom: 4 },
  kvLabel: { width: 100, fontSize: 8, color: PALETTE.inkFaint },
  kvValue: { flex: 1, fontSize: 10, color: PALETTE.ink },
  // === Tag row ===
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    fontSize: 8.5,
    color: PALETTE.ink,
    borderBottom: `0.5pt solid ${PALETTE.line}`,
    paddingHorizontal: 0,
    paddingBottom: 1,
    paddingRight: 4,
  },
  // === Work block ===
  workBlock: {
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: `0.5pt solid ${PALETTE.line}`,
  },
  workIndex: {
    fontSize: 7,
    color: PALETTE.inkFaint,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  workTitle: {
    fontSize: 14,
    color: PALETTE.ink,
    marginBottom: 2,
  },
  workMeta: { fontSize: 8, color: PALETTE.inkMuted, marginBottom: 10 },
  workDesc: { fontSize: 9, color: PALETTE.ink, marginTop: 8, lineHeight: 1.7 },
  workLink: { fontSize: 8, color: PALETTE.ink, marginTop: 6 },
  // === Panorama (5 細長フレーム + 罫線) ===
  panorama: {
    flexDirection: "row",
    gap: 4,
    height: 56,
  },
  panoFrame: { flex: 1, objectFit: "cover", backgroundColor: PALETTE.panel },
  panoMissing: { flex: 1, backgroundColor: PALETTE.panel },
  // === Footer ===
  footer: {
    position: "absolute",
    bottom: 28,
    left: 64,
    right: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTop: `0.5pt solid ${PALETTE.line}`,
    color: PALETTE.inkFaint,
    fontSize: 7,
    letterSpacing: 2,
  },
  footerName: { fontSize: 9, color: PALETTE.ink, letterSpacing: 1.5 },
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

export function MinimalA({
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
    <Document title={`${safeName} - Minimal Resume`} author={safeName} creator={SITE.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>CREATOR RESUME — MINIMAL</Text>
          <Text style={styles.heroName}>{safeName}</Text>
          <Text style={styles.heroMeta}>
            {data.location ? `${data.location} ／ ` : ""}
            経験 {data.yearsOfExperience} 年 ／ 発行 {today}
          </Text>
        </View>

        <View style={styles.hr} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STATEMENT</Text>
          <Text style={styles.sectionBody}>
            {data.bio || "(自己紹介が未設定です)"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTACT</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Email</Text>
            <Text style={styles.kvValue}>{data.email || "非公開"}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Portfolio</Text>
            <Text style={styles.kvValue}>{SITE.url}</Text>
          </View>
          {socials.map((s) => (
            <View key={s.key} style={styles.kvRow}>
              <Text style={styles.kvLabel}>{s.label}</Text>
              <PdfLink src={s.url!} style={styles.kvValue}>
                {s.url}
              </PdfLink>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STRENGTHS</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GENRES</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AI TOOLS</Text>
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

        <Footer pageLabel="01" />
      </Page>

      {data.works.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>WORKS</Text>
            <Text style={[styles.heroName, { fontSize: 22 }]}>
              {data.works.length} 件のセレクト作品
            </Text>
          </View>

          {data.works.map((w, i) => (
            <View key={w.id} style={styles.workBlock} wrap={false}>
              <Text style={styles.workIndex}>
                {String(i + 1).padStart(2, "0")} ／ {String(data.works.length).padStart(2, "0")}
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

          <Footer pageLabel="02" />
        </Page>
      )}
    </Document>
  );
}
