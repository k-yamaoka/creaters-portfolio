"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

/**
 * 適格請求書 (インボイス) PDF。
 *
 * 対象: escrow_status='released' な取引 1 件を客体化して発行。
 * client 側 (企業) が /dashboard/orders/[id] から DL する用途。
 *
 * 記載事項 (国税庁「適格請求書等保存方式」の要件):
 *   1. 発行者の氏名/名称 と 登録番号 (AILIER 運営会社)
 *   2. 取引年月日 (検収完了日)
 *   3. 取引内容
 *   4. 税抜金額 or 税込金額 + 適用税率
 *   5. 税率毎の消費税額
 *   6. 交付先 (受領事業者) の名称
 *
 * ※ 内税表記。AILIER の platform_fee 15% を含む total_amount を税込表記。
 * ※ 消費税は現状 10% 一律で計算表示 (本番は運営会社の課税事業者ステータスで決定)。
 */

// Sawarabi Gothic (public/fonts/) を JP フォントとして登録。
const JP_FAMILY = "SawarabiGothic";
let _registered = false;
export function registerInvoiceFont(srcOverride?: string) {
  if (_registered) return;
  try {
    Font.register({
      family: JP_FAMILY,
      fonts: [{ src: srcOverride ?? "/fonts/SawarabiGothic.ttf" }],
    });
    Font.registerHyphenationCallback((word) => Array.from(word));
    _registered = true;
  } catch {
    /* HMR 多重登録は無視 */
  }
}

export type InvoiceData = {
  invoiceNumber: string;
  issuedAt: string; // ISO
  transactionDate: string; // 検収完了日 ISO
  // 発行者 (AILIER 運営会社)
  issuer: {
    name: string;
    registrationNumber: string; // T + 13 桁
    address?: string;
    contactEmail?: string;
  };
  // 交付先 (企業)
  recipient: {
    name: string; // 会社名 or 表示名
    address?: string | null;
  };
  order: {
    orderNumber: string;
    title: string;
  };
  amounts: {
    subtotal: number; // 税抜
    tax: number;
    total: number; // 税込
    taxRate: number; // 0.10
  };
};

const s = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: JP_FAMILY,
    color: "#1c1c1a",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  title: { fontSize: 24, fontWeight: 700, letterSpacing: 2 },
  subtitleJa: { fontSize: 12, color: "#5b5b58", marginTop: 4 },
  metaBlock: { alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: "#8a8a85" },
  metaValue: { fontSize: 10, marginBottom: 4 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 8,
    color: "#8a8a85",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  recipientName: { fontSize: 14, fontWeight: 700 },
  issuerBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d9d3c4",
    borderRadius: 4,
    marginBottom: 24,
  },
  issuerRow: { fontSize: 10, marginBottom: 2 },
  bold: { fontWeight: 700 },
  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f0e6",
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    color: "#5b5b58",
    borderBottomWidth: 1,
    borderBottomColor: "#d9d3c4",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e0",
  },
  colDesc: { flex: 3 },
  colAmount: { flex: 1, textAlign: "right" },
  totalsBox: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 240,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#1c1c1a",
    fontWeight: 700,
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#8a8a85",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e0",
    paddingTop: 10,
  },
});

function jpy(n: number): string {
  return `¥${Math.max(0, Math.floor(n)).toLocaleString("ja-JP")}`;
}

function formatJaDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y} 年 ${m} 月 ${day} 日`;
}

export function InvoicePdfDocument({ data }: { data: InvoiceData }) {
  const taxRatePct = Math.round(data.amounts.taxRate * 100);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ヘッダ */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>INVOICE</Text>
            <Text style={s.subtitleJa}>適格請求書</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>請求書番号</Text>
            <Text style={s.metaValue}>{data.invoiceNumber}</Text>
            <Text style={s.metaLabel}>発行日</Text>
            <Text style={s.metaValue}>{formatJaDate(data.issuedAt)}</Text>
            <Text style={s.metaLabel}>取引年月日</Text>
            <Text style={s.metaValue}>
              {formatJaDate(data.transactionDate)}
            </Text>
          </View>
        </View>

        {/* 交付先 */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>宛先 (交付先)</Text>
          <Text style={s.recipientName}>{data.recipient.name} 御中</Text>
          {data.recipient.address && (
            <Text style={{ fontSize: 9, color: "#5b5b58", marginTop: 2 }}>
              {data.recipient.address}
            </Text>
          )}
        </View>

        {/* 発行者 */}
        <View style={s.issuerBox}>
          <Text style={s.sectionLabel}>発行者</Text>
          <Text style={[s.issuerRow, s.bold]}>{data.issuer.name}</Text>
          <Text style={s.issuerRow}>
            登録番号: {data.issuer.registrationNumber}
          </Text>
          {data.issuer.address && (
            <Text style={s.issuerRow}>{data.issuer.address}</Text>
          )}
          {data.issuer.contactEmail && (
            <Text style={s.issuerRow}>{data.issuer.contactEmail}</Text>
          )}
        </View>

        {/* 明細 */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>取引内容</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={s.colDesc}>内容</Text>
              <Text style={s.colAmount}>税抜金額</Text>
              <Text style={s.colAmount}>税率</Text>
              <Text style={s.colAmount}>税込金額</Text>
            </View>
            <View style={s.tableRow}>
              <View style={s.colDesc}>
                <Text style={s.bold}>{data.order.title}</Text>
                <Text style={{ fontSize: 8, color: "#8a8a85", marginTop: 2 }}>
                  注文番号: {data.order.orderNumber}
                </Text>
              </View>
              <Text style={s.colAmount}>{jpy(data.amounts.subtotal)}</Text>
              <Text style={s.colAmount}>{taxRatePct}%</Text>
              <Text style={s.colAmount}>{jpy(data.amounts.total)}</Text>
            </View>
          </View>
        </View>

        {/* 集計 */}
        <View style={s.totalsBox}>
          <View style={s.totalsRow}>
            <Text>小計 (税抜)</Text>
            <Text>{jpy(data.amounts.subtotal)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text>消費税 ({taxRatePct}%)</Text>
            <Text>{jpy(data.amounts.tax)}</Text>
          </View>
          <View style={s.totalsRowFinal}>
            <Text>合計金額 (税込)</Text>
            <Text>{jpy(data.amounts.total)}</Text>
          </View>
        </View>

        <Text style={s.footer}>
          この請求書は 適格請求書等保存方式 (インボイス制度) に対応しています。
          金額に誤りがある場合は support@ailier.jp までご連絡ください。
        </Text>
      </Page>
    </Document>
  );
}
