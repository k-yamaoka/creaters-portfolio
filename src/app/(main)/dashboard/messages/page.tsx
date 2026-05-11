import { redirect } from "next/navigation";

// 受信箱は廃止。すべての会話は取引管理(取引詳細下部)に集約。
// 既存のリンクを破壊しないよう /dashboard/orders へリダイレクトする。
// 個別スレッドの直リンク (/dashboard/messages/[partnerId]) は引き続き動作する。
export default function MessagesIndexRedirect() {
  redirect("/dashboard/orders");
}
