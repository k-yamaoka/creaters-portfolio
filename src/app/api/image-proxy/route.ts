import { NextResponse } from "next/server";

/**
 * 画像 CORS / hotlink 防止 フォールバック用のストリーミングプロキシ。
 *
 * ユーザー制約 (超重要):
 *  - サムネイル画像は自社 DB / Storage に絶対に保存しない
 *  - 一時中継のみ (ReadableStream で流すだけ、ディスク書き込みなし)
 *  - Cache-Control は Vercel Edge の短期キャッシュのみを狙う
 *
 * 通常の <img src={og:image}> でオリジンが 403 / net::ERR_FAILED を返した
 * 記事のときだけ、UI 側で /api/image-proxy?url=... にフォールバックする想定。
 *
 * セキュリティ:
 *  - `url` は https:// のみ許可
 *  - Content-Type が image/* でないレスポンスは 415 で拒否 (HTML 中継防止)
 *  - Referer を元 URL のオリジンにして hotlink 判定をパス
 */

export const runtime = "nodejs";
// レスポンスは Edge Cache 側で 24h、client 側で 1h stale-while-revalidate
export const revalidate = 86400;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB 上限 (メモリ保護)
const FETCH_TIMEOUT_MS = 8000;

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) return badRequest("missing url");
  if (!/^https:\/\//i.test(target)) return badRequest("only https urls allowed");

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return badRequest("invalid url");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // ホットリンク防止対策として、対象記事オリジンを Referer に
        Referer: parsed.origin + "/",
        "User-Agent":
          "Mozilla/5.0 (compatible; AILIER-NewsImgProxy/1.0; +https://creaters-portfolio.vercel.app)",
        Accept: "image/*",
      },
    });
  } catch (e) {
    clearTimeout(timer);
    console.warn("[image-proxy] fetch failed", target, e);
    return badRequest("upstream fetch failed", 502);
  } finally {
    clearTimeout(timer);
  }

  if (!upstream.ok || !upstream.body) {
    return badRequest(`upstream ${upstream.status}`, 502);
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    // HTML やその他非画像を中継しない (SSRF / 情報中継対策)
    return badRequest("upstream is not an image", 415);
  }

  // サイズガード (Content-Length があれば早期 reject、無ければ stream 側で控える)
  const contentLength = upstream.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
    return badRequest("upstream too large", 413);
  }

  // ストリームを直接返却。バイナリをディスクや Blob に書き出さない。
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control":
        "public, s-maxage=86400, stale-while-revalidate=3600, max-age=3600",
      // 中継元を隠す (SEO 上の複製シグナル防止)
      "referrer-policy": "no-referrer",
    },
  });
}
