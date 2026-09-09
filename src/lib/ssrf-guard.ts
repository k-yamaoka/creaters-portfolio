import { promises as dnsPromises } from "node:dns";

/**
 * SEC-H1 / SEC-H2: SSRF ガード。
 *
 * 外部 URL を server 側で fetch する 全経路で 呼び出し、
 * 内部 IP / メタデータ endpoint への 中継を 遮断する。
 *
 * 使い方:
 *   if (!(await isSafePublicUrl(target))) {
 *     return NextResponse.json({ error: "unsafe url" }, { status: 400 });
 *   }
 *   const res = await fetch(target, { redirect: "manual" });
 *   // 3xx なら Location を isSafePublicUrl で 再検証
 *
 * 遮断対象:
 *  - IPv4 loopback (127.0.0.0/8)
 *  - IPv4 private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 *  - IPv4 link-local (169.254.0.0/16) — AWS/GCP metadata endpoint 含む
 *  - IPv6 loopback (::1)
 *  - IPv6 unique local (fc00::/7)
 *  - IPv6 link-local (fe80::/10)
 *  - hostname に localhost, 0.0.0.0, ::1 等 の 直リテラル
 *  - DNS rebinding 対策として resolved IP も 同判定
 */

function isPrivateOrLocalIPv4(ip: string): boolean {
  const parts = ip.split(".").map((s) => parseInt(s, 10));
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    return true; // 不正 IPv4 は 危険側に寄せて遮断
  }
  const [a, b] = parts;
  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (link-local, AWS metadata 169.254.169.254 含む)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 (this host)
  if (a === 0) return true;
  // 100.64.0.0/10 (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function isPrivateOrLocalIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  // ::ffff:0:0/96 IPv4-mapped → まず取り出して IPv4 判定
  const v4mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isPrivateOrLocalIPv4(v4mapped[1]);
  // fc00::/7 (unique local) — 先頭 7bit が 1111110
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  // fe80::/10 (link-local)
  if (lower.startsWith("fe8") || lower.startsWith("fe9") ||
      lower.startsWith("fea") || lower.startsWith("feb")) return true;
  return false;
}

/**
 * hostname が IP リテラル (v4 or v6) なら 私 IP 判定を そのまま返す。
 * ドメイン名なら DNS 解決して 得られた 全 IP を 判定 (どれか 1 つでも
 * 私 IP なら 危険とみなす)。DNS rebinding 対策。
 */
async function isPrivateOrLocal(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase().trim();
  // よくある localhost 系 リテラル
  if (host === "localhost" || host === "localhost.localdomain") return true;
  if (host === "0" || host === "0.0.0.0") return true;

  // IPv4 リテラル判定
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return isPrivateOrLocalIPv4(host);
  // IPv6 リテラル判定 ([...] は 呼出前に stripped されている想定)
  if (host.includes(":")) return isPrivateOrLocalIPv6(host);

  // ドメイン名 → DNS 解決
  try {
    const records = await dnsPromises.lookup(host, { all: true });
    for (const rec of records) {
      if (rec.family === 4 && isPrivateOrLocalIPv4(rec.address)) return true;
      if (rec.family === 6 && isPrivateOrLocalIPv6(rec.address)) return true;
    }
  } catch {
    // 解決失敗は 危険側で 遮断
    return true;
  }
  return false;
}

/**
 * SSRF 安全 URL 判定 のメイン。
 * - スキーム http/https のみ
 * - hostname が 私 IP / metadata / localhost 系 なら 拒否
 * - DNS rebinding 対策として resolve 後 IP も 判定
 */
export async function isSafePublicUrl(
  target: string,
  opts: { allowHttp?: boolean } = {}
): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && !(opts.allowHttp && parsed.protocol === "http:")) {
    return false;
  }
  if (await isPrivateOrLocal(parsed.hostname)) return false;
  return true;
}

/**
 * host allowlist 判定。scrapeOgImage 系で 「特定 ドメインのみ」を許可したい
 * 場合に isSafePublicUrl と AND で 使う。
 * @param target 対象 URL
 * @param allowedHosts 許可 ホスト suffix リスト (例: ["instagram.com", "vimeo.com"])
 */
export function matchesAllowedHost(
  target: string,
  allowedHosts: readonly string[]
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  return allowedHosts.some(
    (h) => host === h.toLowerCase() || host.endsWith(`.${h.toLowerCase()}`)
  );
}
