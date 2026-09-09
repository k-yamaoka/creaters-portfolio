"use client";

import { useState, useTransition } from "react";
import { toggleUserActive, toggleUserVerified } from "../actions";

/**
 * 詳細画面用: 停止/復帰 + 認証/取消 の 2 ボタン。
 * 一覧側と同じ Server Action を叩き、成功後は revalidatePath で自動再描画。
 */
type Props = {
  userId: string;
  isActive: boolean;
  isVerified: boolean;
  /** 対象ユーザーの role (admin 保護判定用) */
  targetRole?: "admin" | "creator" | "client" | null;
  /** 実行者 admin 自身の user_id (自分自身の停止防止) */
  currentAdminUserId?: string;
};

export function UserActionsPanel({
  userId,
  isActive,
  isVerified,
  targetRole,
  currentAdminUserId,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  // ADM-025/026: 自 admin / 他 admin の 停止を UI で 明示的にガード。
  //   サーバー側 (users/actions.ts) にも 二重防御あり。
  const isSelf = currentAdminUserId === userId;
  const isTargetAdmin = targetRole === "admin";
  const suspendBlocked = isSelf || isTargetAdmin;
  const suspendBlockReason = isSelf
    ? "自分自身は 停止できません"
    : isTargetAdmin
      ? "他の 管理者アカウントは 停止できません (別経路で 権限管理)"
      : null;

  function handleActive() {
    const next = !isActive;
    // suspend 方向は blocked user では 実行不可
    if (!next && suspendBlocked) return;
    if (
      !confirm(
        next
          ? "このユーザーを 利用再開 しますか?"
          : "このユーザーを 利用停止 しますか?\n停止中は ログイン不可となり、次回アクセス時に signOut されます。"
      )
    )
      return;
    startTransition(async () => {
      const res = await toggleUserActive(userId, next);
      if ("error" in res && res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: next ? "利用再開しました" : "利用停止しました" });
    });
  }

  function handleVerified() {
    const next = !isVerified;
    if (
      !confirm(
        next
          ? "このユーザーを 認証済み にマークしますか?"
          : "認証済みマークを 取り消し しますか?"
      )
    )
      return;
    startTransition(async () => {
      const res = await toggleUserVerified(userId, next);
      if ("error" in res && res.error) setMsg({ type: "err", text: res.error });
      else
        setMsg({
          type: "ok",
          text: next ? "認証済みにしました" : "認証を取消しました",
        });
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="text-sm font-bold text-gray-900">運営アクション</h3>
      <p className="mt-1 text-xs text-gray-500">
        ユーザーへの操作。実行後は監査ログに残ります (未実装、後続対応)。
      </p>

      {msg && (
        <div
          className={`mt-3 rounded-lg p-2.5 text-xs ${
            msg.type === "err"
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleActive}
          disabled={pending || (isActive && suspendBlocked)}
          title={isActive && suspendBlockReason ? suspendBlockReason : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
              ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {isActive ? "利用を停止する" : "利用を再開する"}
        </button>
        {isActive && suspendBlockReason && (
          <p className="w-full text-[11px] text-amber-700">
            ⚠ {suspendBlockReason}
          </p>
        )}

        <button
          type="button"
          onClick={handleVerified}
          disabled={pending}
          className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            isVerified
              ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              : "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {isVerified ? "認証を取り消す" : "認証済みにする"}
        </button>
      </div>
    </div>
  );
}
