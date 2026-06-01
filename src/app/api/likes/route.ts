import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/likes
 * body: { portfolio_item_id: string }
 *
 * いいねトグル。既にあれば DELETE、無ければ INSERT。
 * 戻り値: { liked: boolean, count: number }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { portfolio_item_id?: string }
    | null;
  const portfolioItemId = body?.portfolio_item_id;

  if (!portfolioItemId || typeof portfolioItemId !== "string") {
    return NextResponse.json(
      { error: "portfolio_item_id is required" },
      { status: 400 }
    );
  }

  // 既存いいねを確認
  const { data: existing } = await supabase
    .from("portfolio_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("portfolio_item_id", portfolioItemId)
    .maybeSingle();

  if (existing) {
    // DELETE → 取り消し
    const { error } = await supabase
      .from("portfolio_likes")
      .delete()
      .eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
    }
  } else {
    // INSERT
    const { error } = await supabase.from("portfolio_likes").insert({
      user_id: user.id,
      portfolio_item_id: portfolioItemId,
    });
    if (error) {
      return NextResponse.json({ error: "Failed to like" }, { status: 500 });
    }
  }

  // 最新の like_count を返却
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("like_count")
    .eq("id", portfolioItemId)
    .maybeSingle();

  return NextResponse.json({
    liked: !existing,
    count: item?.like_count ?? 0,
  });
}
