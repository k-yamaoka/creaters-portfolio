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

// === フォント登録 (Button から事前 fetch 済の ArrayBuffer を受け取る) ====
// 2026-06-26 経緯:
//  1) 旧 fonts.gstatic.com の hash 付き URL → 404 で全件失敗
//  2) raw.githubusercontent.com 経由 → CSP の font-src に許可なく
//     "Failed to fetch" (CORS / CSP)
//  3) public/fonts/NotoSansJP.ttf (variable, 9.6MB) → 自前ホスト OK だが
//     @react-pdf 4.x が variable font の vertical metrics を正しく取れず、
//     h1 (見出し名) と subtitle の baseline が衝突し文字が重なる
//  → static (non-variable) フォント Sawarabi Gothic Regular (1.9MB) に
//     差し替え。bold は無いが見出しは fontSize と letterSpacing で強調。
const RESUME_FONT_TTF = "/fonts/SawarabiGothic.ttf";
const RESUME_FONT_FAMILY = "SawarabiGothic";

let _fontRegistered = false;

/**
 * フォントを (URL または事前 fetch 済 ArrayBuffer から) 登録する。
 * - fontData が渡されれば内部 fetch を回避できるため進捗計測しやすい
 * - 初回 register 後はキャッシュされるので fontData なしの 2 回目以降は no-op
 */
/**
 * フォントを登録する。
 * @param srcOverride 事前 fetch 済の blob: ObjectURL を渡せば、@react-pdf
 *   内部の fetch を実質スキップできる (即時 resolve)。
 *   未指定なら通常の /fonts/NotoSansJP.ttf URL を使う。
 *
 * 2026-06-26: 当初 ArrayBuffer を直接 src に渡せると考えたが、@react-pdf
 *   4.x のランタイムは `src.indexOf(...)` で URL を判定するため非 string が
 *   渡ると例外。Blob → ObjectURL の string にして渡す形にした。
 */
export function registerResumeFont(srcOverride?: string) {
  if (_fontRegistered) return;
  try {
    const src = srcOverride ?? RESUME_FONT_TTF;
    // 2026-06-26: 同じ variable font src で normal/bold を別 fontWeight として
    // 登録すると、@react-pdf が axis を解釈できず "bold" 要求時に normal を
    // 2 重描画して文字が重なる現象を確認 (田中 映像 の名前重複)。
    // → normal のみ登録に変更。bold 強調は fontSize + letterSpacing で代用。
    Font.register({
      family: RESUME_FONT_FAMILY,
      fonts: [{ src, fontWeight: "normal" }],
    });
    // CJK の自動改行を許可 (react-pdf は空白で改行する既定、日本語は文字単位)
    Font.registerHyphenationCallback((word) => Array.from(word));
    _fontRegistered = true;
  } catch {
    /* HMR で多重登録される可能性があるので無視 */
  }
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
    fontFamily: RESUME_FONT_FAMILY,
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
    // bold が効かないため fontSize と letterSpacing で強調
    fontSize: 26,
    letterSpacing: 1,
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
    fontSize: 12,
    letterSpacing: 0.5,
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

function ThumbnailBox({
  work,
  dataUrl,
}: {
  work: ResumeWork;
  dataUrl?: string;
}) {
  const styleByAspect =
    work.aspect_ratio === "vertical"
      ? styles.workThumbVertical
      : work.aspect_ratio === "square"
        ? styles.workThumbSquare
        : styles.workThumb;
  // 事前 fetch 済の data:image/... URL があるものだけ表示。
  // Supabase Storage の直 URL を渡すと @react-pdf 内部 fetch が hang する。
  if (!dataUrl) {
    return (
      <View style={[styleByAspect, styles.workPlaceholder]}>
        <Text>サムネ未登録</Text>
      </View>
    );
  }
  return <PdfImage src={dataUrl} style={styleByAspect} />;
}

/**
 * 2026-06-26: サムネ画像は事前に fetch + Blob → dataURL 化した上で
 * thumbDataUrls (work.id -> data:...) で渡す。@react-pdf 内部 fetch を
 * 完全に skip するため hang リスクなし。
 */
export function CreatorResumePdf({
  data,
  thumbDataUrls = {},
}: {
  data: ResumeData;
  /** work.id -> "data:image/...;base64,..." */
  thumbDataUrls?: Record<string, string>;
}) {
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
                <ThumbnailBox work={w} dataUrl={thumbDataUrls[w.id]} />
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
                      → {w.external_url || w.video_url}
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
