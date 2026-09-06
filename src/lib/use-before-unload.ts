"use client";

import { useEffect } from "react";

/**
 * ページ離脱警告フック (UPL-003 用)。
 *
 * `active` が true の間だけ `window` に beforeunload リスナを付け、
 * ブラウザ標準の離脱確認ダイアログ (「このページを離れますか?」) を
 * 表示させる。false に戻ったとき、および unmount 時には確実に解除する。
 *
 * 用途: ファイルアップロード / 動画変換 / 大きな非同期処理の途中で
 * ユーザーが 戻る / リロード / タブ閉じ を試みたときのデータ喪失防止。
 *
 * 注意:
 *  - 現代のブラウザは preventDefault() + returnValue = "" だけを尊重し、
 *    カスタムメッセージ文字列は無視される (仕様統一)。表示文言は
 *    ブラウザ標準の一般メッセージとなる。
 *  - Next.js の SPA 内 <Link> ナビゲーションでは beforeunload は発火
 *    しない (これはブラウザ側の unload/reload/back のみ)。SPA 内遷移
 *    ブロックは別途 next/navigation の useRouter + confirm 等で実装。
 */
export function useBeforeUnload(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      // Chrome / Safari / Firefox は preventDefault + returnValue の両方を
      // 見て「離脱確認あり」と判定する (歴史的経緯のため両方セットが安全)。
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [active]);
}
