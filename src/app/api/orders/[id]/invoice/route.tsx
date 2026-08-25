import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { renderToStream } from "@react-pdf/renderer";
import {
  InvoicePdfDocument,
  registerInvoiceFont,
  type InvoiceData,
} from "@/components/billing/invoice-pdf";
import { buildInvoiceNumber } from "@/lib/invoice-number";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:id/invoice
 *
 * 適格請求書 (インボイス) PDF を生成して返す。
 * - client のみ (発注者本人)
 * - 検収済 (escrow_status='released') のみ
 * - 発行者情報は AILIER 運営会社
 */

const ISSUER = {
  name: "Comhuman-Quality株式会社",
  // 発行者登録番号。本番運用開始時に env で置換 (テスト用ダミー T + 13 桁)。
  registrationNumber:
    process.env.INVOICE_ISSUER_REGISTRATION_NUMBER ?? "T0000000000000",
  address: process.env.INVOICE_ISSUER_ADDRESS ?? undefined,
  contactEmail: "support@ailier.jp",
};

const TAX_RATE = 0.1;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, order_number, title, total_amount, base_price, platform_fee,
       escrow_status, inspected_at, completed_at, created_at,
       client:client_profiles!orders_client_id_fkey (
         user_id, company_name,
         profiles!client_profiles_user_id_fkey ( display_name )
       )`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const clientProf = order.client as unknown as {
    user_id?: string;
    company_name?: string | null;
    profiles?: { display_name?: string };
  } | null;
  if (clientProf?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.escrow_status !== "released") {
    return NextResponse.json(
      { error: "検収完了 (escrow=released) の取引のみ請求書を発行できます" },
      { status: 400 }
    );
  }

  // 金額計算: total_amount が税込 総額。base_price × 1.15 の 15% は
  // AILIER のシステム手数料 (企業から徴収)、その全体が課税対象。
  // 消費税は 10% 内税として計算表示。
  const totalIncTax = order.total_amount ?? 0;
  const subtotal = Math.floor(totalIncTax / (1 + TAX_RATE));
  const tax = totalIncTax - subtotal;

  const transactionDate =
    order.inspected_at ??
    order.completed_at ??
    order.created_at ??
    new Date().toISOString();
  const issuedAt = new Date().toISOString();
  const invoiceNumber = buildInvoiceNumber(
    order.order_number ?? order.id,
    new Date(issuedAt)
  );

  // company_name → display_name の順で優先
  const recipientName =
    clientProf?.company_name?.trim() ||
    clientProf?.profiles?.display_name?.trim() ||
    "御担当者様";

  // 交付先の郵便住所 (追加: 企業プロフィールに 住所欄 追加時に service_role で取得)
  let recipientAddress: string | null = null;
  try {
    const admin = getSupabaseAdmin();
    // 現状 client_profiles に住所カラムは無いので null 固定。将来追加時に SELECT する。
    admin;
  } catch {
    /* admin 未設定は無視 */
  }

  // フォント登録 (server side): public/fonts/SawarabiGothic.ttf を絶対 URL で
  const originHeader = _request.headers.get("host");
  const proto = _request.headers.get("x-forwarded-proto") ?? "https";
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (originHeader ? `${proto}://${originHeader}` : "");
  registerInvoiceFont(origin ? `${origin}/fonts/SawarabiGothic.ttf` : undefined);

  const invoiceData: InvoiceData = {
    invoiceNumber,
    issuedAt,
    transactionDate,
    issuer: ISSUER,
    recipient: { name: recipientName, address: recipientAddress },
    order: {
      orderNumber: order.order_number ?? order.id,
      title: order.title ?? "取引",
    },
    amounts: { subtotal, tax, total: totalIncTax, taxRate: TAX_RATE },
  };

  const stream = await renderToStream(<InvoicePdfDocument data={invoiceData} />);
  const nodeStream = stream as unknown as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of nodeStream) {
    chunks.push(Buffer.from(chunk));
  }
  const pdfBuffer = Buffer.concat(chunks);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
