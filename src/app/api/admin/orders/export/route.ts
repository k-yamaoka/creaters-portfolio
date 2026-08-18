import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/orders/export?status=<status>
 * admin のみ。全 orders (or status 絞込) を CSV でダウンロード。
 * 会計・確定申告用途。UTF-8 BOM 付きで Excel が文字化けしないように。
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status")?.trim() ?? "";

  // 会計向けなので service_role で全件取得
  const admin = getSupabaseAdmin();
  let query = admin
    .from("orders")
    .select(
      `id, order_number, title, status, escrow_status, total_amount, base_price, platform_fee,
       creator_payout, created_at, delivered_at, inspected_at, completed_at,
       payout_status, payout_scheduled_date,
       creator:creator_profiles!orders_creator_id_fkey (
         profiles!creator_profiles_user_id_fkey ( display_name, email )
       ),
       client:client_profiles!orders_client_id_fkey (
         profiles!client_profiles_user_id_fkey ( display_name, email )
       )`
    )
    .order("created_at", { ascending: false });
  if (statusFilter) query = query.eq("status", statusFilter);
  const { data: orders } = await query;

  const header = [
    "order_id",
    "order_number",
    "title",
    "status",
    "escrow_status",
    "total_amount",
    "base_price",
    "platform_fee",
    "creator_payout",
    "creator_name",
    "creator_email",
    "client_name",
    "client_email",
    "created_at",
    "delivered_at",
    "inspected_at",
    "completed_at",
    "payout_status",
    "payout_scheduled_date",
  ];

  const rows = (orders ?? []).map((o) => {
    const creatorProf = (
      o.creator as unknown as {
        profiles?: { display_name?: string; email?: string };
      } | null
    )?.profiles;
    const clientProf = (
      o.client as unknown as {
        profiles?: { display_name?: string; email?: string };
      } | null
    )?.profiles;
    return [
      o.id,
      o.order_number ?? "",
      o.title ?? "",
      o.status ?? "",
      o.escrow_status ?? "",
      o.total_amount ?? 0,
      o.base_price ?? 0,
      o.platform_fee ?? 0,
      o.creator_payout ?? 0,
      creatorProf?.display_name ?? "",
      creatorProf?.email ?? "",
      clientProf?.display_name ?? "",
      clientProf?.email ?? "",
      o.created_at ?? "",
      o.delivered_at ?? "",
      o.inspected_at ?? "",
      o.completed_at ?? "",
      o.payout_status ?? "",
      o.payout_scheduled_date ?? "",
    ];
  });

  function esc(v: unknown): string {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }
  const lines = [header.join(","), ...rows.map((r) => r.map(esc).join(","))];
  // UTF-8 BOM (﻿) → Excel で日本語文字化け防止
  const csv = "﻿" + lines.join("\r\n") + "\r\n";
  const today = new Date().toISOString().slice(0, 10);
  const filename = `ailier_orders_${statusFilter || "all"}_${today}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
