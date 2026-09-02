"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PartyPopper, X } from "lucide-react";

/**
 * ダッシュボード 歓迎トースト。
 *
 * 挙動:
 *   - URL に ?welcome=1 が付いていたら 右下に「アイムビ へようこそ」トースト表示
 *   - 表示直後に router.replace で ?welcome=1 を URL から取り除く
 *     → リロードや戻る操作で 二度出さない
 *   - 8 秒で auto-close、または閉じるボタンで即 close
 *   - session storage で「表示済み」を記録して同一タブ 内で二度出さない
 *
 * 発火経路:
 *   - オンボーディング完了時: /dashboard?welcome=1 に redirect (onboarding-wizard 側)
 *   - パスワードリセット完了時: 別 flag (password_reset=1) 相当も 将来ここに集約可能
 */
export function WelcomeToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;

    // 二重表示防止: 同 tab で既に表示済ならスキップ
    const shown = sessionStorage.getItem("dashboard_welcome_shown");
    if (shown === "1") {
      // URL だけクリーンアップ
      router.replace(pathname);
      return;
    }
    sessionStorage.setItem("dashboard_welcome_shown", "1");
    setOpen(true);

    // URL から ?welcome=1 を除去 (履歴を汚さないよう replace)
    router.replace(pathname);

    // 8 秒後 自動 close
    const t = setTimeout(() => setOpen(false), 8000);
    return () => clearTimeout(t);
  }, [searchParams, router, pathname]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[9998] w-[min(360px,calc(100vw-2rem))] rounded-xl border border-aimovie-ember-500/40 bg-white p-4 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-aimovie-ember-500/10 text-aimovie-ember-500">
          <PartyPopper size={18} strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-aimovie-navy-900">
            アイムビ へようこそ 🎬
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            プロフィールとポートフォリオの準備ができれば、企業からの
            スカウトが届きやすくなります。左メニューから編集してください。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="閉じる"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
