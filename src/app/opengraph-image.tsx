import { ImageResponse } from "next/og";

/**
 * SEO-002: トップページ (/) 用 OGP 画像 (1200x630)。
 *
 * Next.js 15 の file-based OG 慣習: `app/opengraph-image.tsx` を置くと
 * `/opengraph-image` エンドポイントが 自動生成され、layout.tsx の metadata に
 * `og:image` / `og:image:width` / `og:image:height` / `og:image:alt` が
 * 自動注入される。SNS シェア時に Twitter/Facebook/LINE 等が 拾う。
 *
 * デザイン方針: Cinema Ink パレット。左側に ロゴ + サービス名 + キャッチ、
 * 右側に AI キーワード ピル。動的な HTML/CSS で 描画するため、公開画像
 * ファイルの管理コストゼロ・ブランド変更にも 追従。
 */
export const runtime = "edge";
export const alt = "アイムビ — AIクリエイター特化型の企業マッチングプラットフォーム";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0B1224 0%, #131C36 60%, #1A2545 100%)",
          padding: "72px 80px",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        {/* ヘッダー: ブランド ロゴマーク + アイムビ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              border: "3px solid #ED6E3D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(237,110,61,0.08)",
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "22px solid #ED6E3D",
                borderTop: "16px solid transparent",
                borderBottom: "16px solid transparent",
                marginLeft: 6,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: -1,
              display: "flex",
            }}
          >
            アイムビ
            <span style={{ color: "#ED6E3D", marginLeft: 4 }}>.</span>
          </div>
        </div>

        {/* メインタイポ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: -1.5,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            AIクリエイター特化型
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#F5F5F5",
              display: "flex",
            }}
          >
            企業マッチング プラットフォーム
          </div>
        </div>

        {/* フッター: AI ツール ピル + ドメイン */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {["Sora", "Veo", "Runway", "Seedance"].map((label) => (
              <div
                key={label}
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.06)",
                  fontSize: 22,
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#ED6E3D",
              fontWeight: 700,
              display: "flex",
            }}
          >
            aimovie-works.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
