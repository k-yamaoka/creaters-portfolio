import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Confirm payment: contract → data_sharing (escrow held)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();

  // 認可: 支払う側 (client) 本人のみ確定可能
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, status, escrow_status,
       client:client_profiles!orders_client_id_fkey ( user_id )`
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const clientUserId = (
    order.client as unknown as { user_id: string } | null
  )?.user_id;
  if (!clientUserId || clientUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // status: contract かつ escrow: pending のみ遷移許可。
  // 二重実行で複数回 held に変えないよう WHERE 句で絞り込む。
  const { error, data: updated } = await supabase
    .from("orders")
    .update({
      status: "data_sharing",
      escrow_status: "held",
    })
    .eq("id", orderId)
    .eq("status", "contract")
    .neq("escrow_status", "held")
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: "既に処理済みです" },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
