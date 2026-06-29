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
import type { ResumeData, ResumeWork } from "../types";
import {
  RESUME_FONT_FAMILY,
  SITE,
  SOCIAL_ORDER,
  aspectLabel,
  formatJaDate,
} from "./common";

/**
 * Proposal A
 * - クライアント向け企画書/プレゼン形式
 * - A4 横ではなく縦のままだが、1 作品 = 1 ページの大型ビジュアル
 * - シック (チャコール + ゴールドアクセント)、パノラマを巨大に表示
 * - 表紙 + プロフィール + 作品スライド (1 件 1 ページ)
 */

const PALETTE = {
  bg: "#fafaf7",
  ink: "#1c1a14",
  inkMuted: "#5a5447",
  inkFaint: "#9a9485",
  gold: "#a07a3c",
  panel: "#efece4",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: PALETTE.bg,
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: RESUME_FONT_FAMILY,
    fontSize: 10,
    color: PALETTE.ink,
    lineHeight: 1.7,
  },
  // === Cover ===
  cover: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverEyebrow: {
    fontSize: 8,
    color: PALETTE.gold,
    letterSpacing: 6,
  },
  coverTitle: {
    fontSize: 48,
    color: PALETTE.ink,
    letterSpacing: 3,
    marginTop: 24,
    textAlign: "center",
    lineHeight: 1.15,
  },
  coverDivider: {
    width: 60,
    height: 1,
    backgroundColor: PALETTE.gold,
    marginVertical: 28,
  },
  coverSub: {
    fontSize: 9,
    color: PALETTE.inkMuted,
    letterSpacing: 2,
    textAlign: "center",
  },
  // === Profile page ===
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottom: `0.5pt solid ${PALETTE.inkFaint}`,
  },
  phEyebrow: {
    fontSize: 7,
    color: PALETTE.gold,
    letterSpacing: 3,
  },
  phName: { fontSize: 9, color: PALETTE.inkMuted, letterSpacing: 1.5 },
  bigSectionTitle: {
    fontSize: 26,
    color: PALETTE.ink,
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 16,
    lineHeight: 1.2,
  },
  twoCol: { flexDirection: "row", gap: 32 },
  colLeft: { flex: 1 },
  colRight: { width: 220 },
  sectionLabel: {
    fontSize: 7,
    color: PALETTE.gold,
    letterSpacing: 3,
    marginBottom: 8,
  },
  bioBody: { fontSize: 10, color: PALETTE.ink, lineHeight: 1.85 },
  kvRow: { flexDirection: "row", marginBottom: 4 },
  kvLabel: { width: 80, fontSize: 8, color: PALETTE.inkMuted },
  kvValue: { flex: 1, fontSize: 10, color: PALETTE.ink },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    fontSize: 8.5,
    color: PALETTE.ink,
    borderBottom: `1pt solid ${PALETTE.gold}`,
    paddingHorizontal: 0,
    paddingBottom: 1,
    paddingRight: 4,
  },
  // === Work slide (1 作品 1 ページ) ===
  workSlide: { flex: 1 },
  workSlideHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 8,
    borderBottom: `0.5pt solid ${PALETTE.inkFaint}`,
  },
  slideEyebrow: {
    fontSize: 7,
    color: PALETTE.gold,
    letterSpacing: 3,
  },
  slideIdx: { fontSize: 7, color: PALETTE.inkFaint, letterSpacing: 2 },
  slideTitle: {
    fontSize: 28,
    color: PALETTE.ink,
    marginTop: 16,
    lineHeight: 1.2,
  },
  slideMeta: {
    fontSize: 9,
    color: PALETTE.inkMuted,
    marginTop: 6,
    marginBottom: 18,
  },
  panorama: {
    flexDirection: "row",
    gap: 4,
    height: 140,
    backgroundColor: PALETTE.panel,
  },
  panoFrame: { flex: 1, objectFit: "cover", backgroundColor: PALETTE.panel },
  panoMissing: { flex: 1, backgroundColor: PALETTE.panel },
  slideDesc: {
    fontSize: 10.5,
    color: PALETTE.ink,
    lineHeight: 1.9,
    marginTop: 20,
  },
  slideLink: { fontSize: 9, color: PALETTE.gold, marginTop: 12 },
  // === Footer ===
  footer: {
    position: "absolute",
    bottom: 28,
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

function WorkSlide({
  work,
  index,
  total,
  thumbDataUrls,
  frameDataUrls,
  creatorName,
}: {
  work: ResumeWork;
  index: number;
  total: number;
  thumbDataUrls: Record<string, string>;
  frameDataUrls: Record<string, string[]>;
  creatorName: string;
}) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.workSlideHead}>
        <Text style={styles.slideEyebrow}>WORK</Text>
        <Text style={styles.slideIdx}>
          {String(index).padStart(2, "0")} ／ {String(total).padStart(2, "0")}  ·  {creatorName}
        </Text>
      </View>
      <View style={styles.workSlide}>
        <Text style={styles.slideTitle}>{work.title}</Text>
        <Text style={styles.slideMeta}>
          {[work.genre, aspectLabel(work.aspect_ratio)]
            .filter(Boolean)
            .join("  ／  ")}
        </Text>
        <Panorama
          frames={frameDataUrls[work.id] ?? []}
          thumb={thumbDataUrls[work.id]}
        />
        {work.description && (
          <Text style={styles.slideDesc}>{work.description}</Text>
        )}
        {(work.external_url || work.video_url) && (
          <PdfLink
            src={work.external_url || work.video_url || "#"}
            style={styles.slideLink}
          >
            → {work.external_url || work.video_url}
          </PdfLink>
        )}
      </View>
      <Footer pageLabel={`WORK ${index} / ${total}`} />
    </Page>
  );
}

export function ProposalA({
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
    <Document title={`${safeName} - Proposal`} author={safeName} creator={SITE.name}>
      {/* === Cover === */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.coverEyebrow}>CREATOR PROPOSAL</Text>
          <Text style={styles.coverTitle}>{safeName}</Text>
          <View style={styles.coverDivider} />
          <Text style={styles.coverSub}>
            FOR CLIENTS  ·  {today}  ·  PRESENTED BY {SITE.name}
          </Text>
        </View>
        <Footer pageLabel="COVER" />
      </Page>

      {/* === Profile === */}
      <Page size="A4" style={styles.page}>
        <View style={styles.pageHeader}>
          <Text style={styles.phEyebrow}>ABOUT</Text>
          <Text style={styles.phName}>{safeName}</Text>
        </View>
        <Text style={styles.bigSectionTitle}>Profile</Text>

        <View style={styles.twoCol}>
          <View style={styles.colLeft}>
            <Text style={styles.sectionLabel}>STATEMENT</Text>
            <Text style={styles.bioBody}>
              {data.bio || "(自己紹介が未設定です)"}
            </Text>

            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>STRENGTHS</Text>
            <View style={styles.tagRow}>
              {data.strengths.length > 0 ? (
                data.strengths.map((s) => (
                  <Text key={s} style={styles.tag}>
                    {s}
                  </Text>
                ))
              ) : (
                <Text style={styles.bioBody}>(未設定)</Text>
              )}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>GENRES</Text>
            <View style={styles.tagRow}>
              {data.genres.length > 0 ? (
                data.genres.map((g) => (
                  <Text key={g} style={styles.tag}>
                    {g}
                  </Text>
                ))
              ) : (
                <Text style={styles.bioBody}>(未設定)</Text>
              )}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>AI TOOLS</Text>
            <View style={styles.tagRow}>
              {data.aiTools.length > 0 ? (
                data.aiTools.map((t) => (
                  <Text key={t} style={styles.tag}>
                    {t}
                  </Text>
                ))
              ) : (
                <Text style={styles.bioBody}>(未設定)</Text>
              )}
            </View>
          </View>

          <View style={styles.colRight}>
            <Text style={styles.sectionLabel}>CONTACT</Text>
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

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>SNS</Text>
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
              <Text style={styles.bioBody}>(未設定)</Text>
            )}
          </View>
        </View>

        <Footer pageLabel="PROFILE" />
      </Page>

      {/* === Works (1 件 1 ページ) === */}
      {data.works.map((w, i) => (
        <WorkSlide
          key={w.id}
          work={w}
          index={i + 1}
          total={data.works.length}
          thumbDataUrls={thumbDataUrls}
          frameDataUrls={frameDataUrls}
          creatorName={safeName}
        />
      ))}
    </Document>
  );
}
