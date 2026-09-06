import { useEffect, type RefObject } from "react";

/**
 * A11Y-004 / A11Y-005: モーダルの キーボード操作 (Esc / Tab) を まとめて提供する 共通フック。
 *
 * ダイアログ / モーダル系 コンポーネントで 一括して 呼ぶ:
 *   useDialogA11y({ open, containerRef, onClose });
 *
 * 提供する挙動:
 *   1. **Esc 押下で onClose 発火** (WAI-ARIA APG dialog pattern)
 *   2. **Tab / Shift+Tab の フォーカストラップ** (背景要素へ 抜けない)
 *   3. **初期フォーカス**: 開いた瞬間 containerRef 内の 最初のフォーカサブル要素に飛ぶ
 *      (=aria-modal="true" のダイアログでは 内側の 何かにフォーカスを 持ってくるのが標準)
 *   4. **フォーカス復帰**: 閉じたとき、開いた側 (opener button) にフォーカスを戻す
 *      → キーボード操作者が 元居た位置に 帰れる
 *
 * ref は `<div role="dialog" ref={containerRef}>` に付ける。open=false のときは
 * 何もしないので、コンポーネント側で 条件レンダー ({open && …}) しても 安全。
 *
 * 選択肢に radix-ui/react-dialog / focus-trap-react 等の 既製品もあるが、
 * bundle 増を避けるため 単一目的の 小規模フックとして 内製する。
 */

// フォーカサブル判定に使う selector (WAI-ARIA APG 相当)
const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "audio[controls]",
  "video[controls]",
  "iframe",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
].join(",");

function getFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      // display:none / visibility:hidden の要素は除外 (offsetParent が null)
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement)
  );
}

export function useDialogA11y({
  open,
  containerRef,
  onClose,
  autoFocus = true,
}: {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  /** open 時に モーダル内 最初の要素へ 自動フォーカスするか (default true) */
  autoFocus?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container) return;

    // 開いた瞬間の フォーカス保持元 (閉じたときに 戻す)
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // A11Y-005: 初期フォーカス
    if (autoFocus) {
      const focusables = getFocusables(container);
      const target = focusables[0] ?? container;
      // 動的な contentTypes (video 等) が スクロール で 見え隠れするケース対策で
      //   requestAnimationFrame で 描画後に フォーカスする
      requestAnimationFrame(() => {
        // container 直接フォーカスの場合、tabIndex="-1" が必要 (呼出側で付与)
        target.focus({ preventScroll: true });
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // A11Y-004: Esc で 閉じる
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      // A11Y-005: Tab / Shift+Tab の フォーカストラップ
      if (e.key !== "Tab") return;
      const focusables = getFocusables(container);
      if (focusables.length === 0) {
        // フォーカサブルが 1 個もなければ container 自身に トラップ
        e.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    // capture 段階で拾って、内部 <input> の Escape が form submit 等に流れないようにする
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      // 閉じたら 呼出元にフォーカスを 戻す (キーボード操作者の 導線保護)
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open, containerRef, onClose, autoFocus]);
}
