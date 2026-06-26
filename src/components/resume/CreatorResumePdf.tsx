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

// 型は別ファイル (types.ts) からも export してバンドル分離している
export type { ResumeData, ResumeWork };

/**
 * クリエイター職務経歴書 PDF。
 *
 * 設計:
 *  - @react-pdf/renderer で完全クライアント生成 (API ルート不要)
 *  - Noto Sans JP を Google Fonts CDN から runtime 取得して日本語フォント描画
 *  - 1 ページ目: 名前 / 連絡先 / SNS / 自己紹介 / 強み / 得意ジャンル /
 *    使用 AI ツール / 得意映像尺
 *  - 2 ページ目以降: 作品一覧 (サムネ 画像 + タイトル + 説明 + 外部 URL)
 *  - 全ページ右下に「AILIER. / https://creaters-portfolio.vercel.app」
 *
 * 画像:
 *  - PdfImage (= react-pdf 内蔵) は URL を fetch して内部で Base64 化するため
 *    Supabase Storage の public URL (CORS 許可済) で問題なく埋め込まれる
 *  - thumbnail_url が NULL の作品は灰色プレースホルダで描画
 */

// === フォント登録 (一度だけ) =========================================
// 2026-06-26: 旧 fonts.gstatic.com の hash 付き URL は 404 で取得できず、
// PDF 生成全体が失敗していたので、安定した GitHub raw URL に差替え。
// Google Fonts リポジトリは noto-sans-jp については variable font 1 ファイル
// (NotoSansJP[wght].ttf) のみ提供しているため、normal / bold を同じソースから
// fontWeight で出し分ける (react-pdf は variable font の wght 軸を解釈する)。
const NOTO_SANS_JP_TTF =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf";

try {
  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: NOTO_SANS_JP_TTF, fontWeight: "normal" },
      { src: NOTO_SANS_JP_TTF, fontWeight: "bold" },
    ],
  });
  // CJK の自動改行を許可 (react-pdf は空白で改行する既定。日本語は文字単位)
  Font.registerHyphenationCallback((word) => Array.from(word));
} catch {
  /* HMR で多重登録される可能性があるので無視 */
}

// === Styles ==========================================================
const SITE = {
  name: "AILIER",
  url: "https://creaters-portfolio.vercel.app",
};

const PALETTE = {
  text: "#0a0d12", // ink
  textMuted: "#5e636b",
  textFaint: "#9298a1",
  line: "#e5e7eb", // gray-200
  card: "#f9fafb", // gray-50
  accent: "#4f46e5", // indigo-600
  accentSoft: "#eef2ff", // indigo-50
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontFamily: "NotoSansJP",
    fontSize: 10,
    color: PALETTE.text,
    lineHeight: 1.6,
  },
  // === Header ===
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 6,
    borderBottom: `1pt solid ${PALETTE.line}`,
  },
  headerTitle: {
    fontSize: 9,
    color: PALETTE.textMuted,
    letterSpacing: 1.5,
  },
  headerName: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 6,
  },
  headerSubtitle: {
    fontSize: 9,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  // === Section ===
  sectionWrap: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: PALETTE.text,
    borderLeft: `3pt solid ${PALETTE.accent}`,
    paddingLeft: 6,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 10,
    color: PALETTE.text,
  },
  // === Contact / SNS rows ===
  kvRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  kvLabel: {
    width: 70,
    fontSize: 9,
    color: PALETTE.textMuted,
  },
  kvValue: {
    fontSize: 10,
    color: PALETTE.text,
    flex: 1,
  },
  // === Chip / Tag ===
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    fontSize: 8.5,
    color: PALETTE.accent,
    backgroundColor: PALETTE.accentSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  chipNeutral: {
    fontSize: 8.5,
    color: PALETTE.text,
    backgroundColor: PALETTE.card,
    border: `0.5pt solid ${PALETTE.line}`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  // === Works (2nd page) ===
  workCard: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottom: `0.5pt solid ${PALETTE.line}`,
  },
  workThumb: {
    width: 110,
    height: 62, // 16:9
    backgroundColor: PALETTE.card,
    borderRadius: 2,
    objectFit: "cover",
  },
  workThumbVertical: {
    width: 50,
    height: 88,
    backgroundColor: PALETTE.card,
    borderRadius: 2,
    objectFit: "cover",
  },
  workThumbSquare: {
    width: 78,
    height: 78,
    backgroundColor: PALETTE.card,
    borderRadius: 2,
    objectFit: "cover",
  },
  workPlaceholder: {
    backgroundColor: PALETTE.card,
    border: `0.5pt solid ${PALETTE.line}`,
    color: PALETTE.textFaint,
    fontSize: 7,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  workInfo: {
    flex: 1,
  },
  workTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: PALETTE.text,
    marginBottom: 2,
  },
  workMeta: {
    fontSize: 8.5,
    color: PALETTE.textMuted,
    marginBottom: 3,
  },
  workDesc: {
    fontSize: 9,
    color: PALETTE.text,
    marginBottom: 4,
  },
  workLink: {
    fontSize: 8.5,
    color: PALETTE.accent,
    textDecoration: "none",
  },
  // === Page footer ===
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTop: `0.5pt solid ${PALETTE.line}`,
    color: PALETTE.textMuted,
    fontSize: 8,
  },
  footerSiteName: {
    fontSize: 10,
    fontWeight: "bold",
    color: PALETTE.text,
  },
  footerSiteUrl: {
    fontSize: 8,
    color: PALETTE.textMuted,
  },
  footerPage: {
    fontSize: 8,
    color: PALETTE.textFaint,
  },
});

// === Component =======================================================
function Footer({
  pageLabel,
}: {
  pageLabel: string;
}) {
  return (
    <View style={styles.footer} fixed>
      <View>
        <Text style={styles.footerSiteName}>{SITE.name}.</Text>
        <Text style={styles.footerSiteUrl}>{SITE.url}</Text>
      </View>
      <Text style={styles.footerPage}>{pageLabel}</Text>
    </View>
  );
}

function SocialLinks({ links }: { links: Record<string, string> }) {
  const order: Array<{ key: string; label: string }> = [
    { key: "website", label: "Website" },
    { key: "x", label: "X" },
    { key: "youtube", label: "YouTube" },
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
  ];
  const items = order
    .map((o) => ({ ...o, url: links[o.key] }))
    .filter((o) => !!o.url);
  if (items.length === 0)
    return <Text style={styles.kvValue}>未設定</Text>;
  return (
    <View>
      {items.map((it) => (
        <View key={it.key} style={styles.kvRow}>
          <Text style={styles.kvLabel}>{it.label}</Text>
          <PdfLink src={it.url!} style={styles.kvValue}>
            {it.url}
          </PdfLink>
        </View>
      ))}
    </View>
  );
}

function ThumbnailBox({ work }: { work: ResumeWork }) {
  const styleByAspect =
    work.aspect_ratio === "vertical"
      ? styles.workThumbVertical
      : work.aspect_ratio === "square"
        ? styles.workThumbSquare
        : styles.workThumb;
  if (!work.thumbnail_url) {
    return (
      <View style={[styleByAspect, styles.workPlaceholder]}>
        <Text>サムネ未登録</Text>
      </View>
    );
  }
  // PdfImage は URL fetch + 内部 Base64 化を行う。
  // Supabase Storage の public URL は CORS 許可済のため問題なし。
  return <PdfImage src={work.thumbnail_url} style={styleByAspect} />;
}

export function CreatorResumePdf({ data }: { data: ResumeData }) {
  const generatedAt = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const safeName = data.displayName || "クリエイター";

  return (
    <Document
      title={`${safeName} - 職務経歴書`}
      author={safeName}
      creator={SITE.name}
      producer={SITE.name}
    >
      {/* ========== Page 1: プロフィール ========== */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View>
          <Text style={styles.headerTitle}>CREATOR RESUME ／ 職務経歴書</Text>
          <Text style={styles.headerName}>{safeName}</Text>
          <Text style={styles.headerSubtitle}>
            {data.location ? `${data.location} ／ ` : ""}
            経験年数 {data.yearsOfExperience} 年 ／ 発行日 {generatedAt}
          </Text>
        </View>

        {/* 自己紹介 */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>自己紹介</Text>
          <Text style={styles.sectionBody}>
            {data.bio || "(自己紹介が未設定です)"}
          </Text>
        </View>

        {/* 連絡先 */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>連絡先</Text>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Email</Text>
            <Text style={styles.kvValue}>{data.email || "非公開"}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>サイト</Text>
            <Text style={styles.kvValue}>
              {SITE.url}
            </Text>
          </View>
        </View>

        {/* SNS / 外部リンク */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>SNS ／ 外部リンク</Text>
          <SocialLinks links={data.socialLinks} />
        </View>

        {/* 強み */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>強み</Text>
          {data.strengths.length > 0 ? (
            <View style={styles.chipRow}>
              {data.strengths.map((s) => (
                <Text key={s} style={styles.chip}>
                  {s}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionBody}>(未設定)</Text>
          )}
        </View>

        {/* 得意ジャンル */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>得意ジャンル</Text>
          {data.genres.length > 0 ? (
            <View style={styles.chipRow}>
              {data.genres.map((g) => (
                <Text key={g} style={styles.chipNeutral}>
                  {g}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionBody}>(未設定)</Text>
          )}
        </View>

        {/* 使用 AI ツール */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>使用 AI ツール</Text>
          {data.aiTools.length > 0 ? (
            <View style={styles.chipRow}>
              {data.aiTools.map((t) => (
                <Text key={t} style={styles.chipNeutral}>
                  {t}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.sectionBody}>(未設定)</Text>
          )}
        </View>

        {/* 得意映像尺 */}
        {data.videoLengths.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>得意映像尺</Text>
            <View style={styles.chipRow}>
              {data.videoLengths.map((l) => (
                <Text key={l} style={styles.chipNeutral}>
                  {l}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* 制作実績 (作品単位の tags を集計) */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>制作実績</Text>
          <Text style={styles.sectionBody}>
            {data.works.length > 0
              ? `公開作品 ${data.works.length} 件`
              : "(公開作品なし)"}
          </Text>
        </View>

        <Footer pageLabel="1 / プロフィール" />
      </Page>

      {/* ========== Page 2+: 作品 ========== */}
      {data.works.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <View>
            <Text style={styles.headerTitle}>WORKS ／ 過去の作品</Text>
            <Text style={styles.headerName}>{safeName}</Text>
            <Text style={styles.headerSubtitle}>
              全 {data.works.length} 件 ／ サムネと外部リンクを併記
            </Text>
          </View>

          <View style={{ marginTop: 14 }}>
            {data.works.map((w) => (
              <View key={w.id} style={styles.workCard} wrap={false}>
                <ThumbnailBox work={w} />
                <View style={styles.workInfo}>
                  <Text style={styles.workTitle}>{w.title}</Text>
                  <Text style={styles.workMeta}>
                    {[
                      w.genre,
                      w.aspect_ratio === "vertical"
                        ? "縦型"
                        : w.aspect_ratio === "square"
                          ? "正方形"
                          : "横型",
                      w.used_ai_tools.length > 0
                        ? `Tools: ${w.used_ai_tools.join(", ")}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join("  ／  ")}
                  </Text>
                  {w.description && (
                    <Text style={styles.workDesc}>{w.description}</Text>
                  )}
                  {(w.external_url || w.video_url) && (
                    <PdfLink
                      src={w.external_url || w.video_url || "#"}
                      style={styles.workLink}
                    >
                      ▸ {w.external_url || w.video_url}
                    </PdfLink>
                  )}
                </View>
              </View>
            ))}
          </View>

          <Footer pageLabel="2 / 過去の作品" />
        </Page>
      )}
    </Document>
  );
}
