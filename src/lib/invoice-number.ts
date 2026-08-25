/**
 * 適格請求書 (インボイス) 番号 生成。
 * order_number を短縮 + 発行年月で prefix。
 * 例: INV-202608-A1B2 (order_number の hash 短縮 4 桁)
 */
export function buildInvoiceNumber(orderNumber: string, issuedAt: Date): string {
  const yyyymm = issuedAt.toISOString().slice(0, 7).replace("-", "");
  // order_number の hash を短縮 (安定して同じ order は同じ番号)
  let hash = 0;
  for (let i = 0; i < orderNumber.length; i++) {
    hash = (hash * 31 + orderNumber.charCodeAt(i)) >>> 0;
  }
  const suffix = hash.toString(16).toUpperCase().padStart(8, "0").slice(0, 4);
  return `INV-${yyyymm}-${suffix}`;
}
