"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 会話ページ表示直後にレイアウトを再フェッチし、未読バッジを最新化する。
 *
 * 背景: 親レイアウトでは SSR 中に `unreadCount` を `messages` テーブルから集計しているが、
 * 当ページの server component で `markAsRead` を呼ぶより前にレイアウトのフェッチが
 * 走るため、初回レスポンスのバッジは更新前の値で固まる。
 * revalidatePath だけでは「次のナビゲーション」しか反映されないので、
 * クライアント側で一度だけ `router.refresh()` を呼んで層全体を再描画する。
 */
export function RefreshOnMount() {
  const router = useRouter();
  useEffect(() => {
    router.refresh();
  }, [router]);
  return null;
}
