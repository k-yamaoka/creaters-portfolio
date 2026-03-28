import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Confirm payment and update order status to "paid"
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      escrow_status: "held",
    })
    .eq("id", orderId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
