"use client";

import { useState } from "react";
import { updatePassword, updateEmail, deleteAccount } from "./actions";

export function SettingsForm({ email }: { email: string }) {
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePasswordSubmit = async (formData: FormData) => {
    setSaving(true);
    setPasswordMsg(null);
    const result = await updatePassword(formData);
    if (result?.error) {
      setPasswordMsg({ type: "error", text: result.error });
    } else if (result?.success) {
      setPasswordMsg({ type: "success", text: result.success });
    }
    setSaving(false);
  };

  const handleEmailSubmit = async (formData: FormData) => {
    setSaving(true);
    setEmailMsg(null);
    const result = await updateEmail(formData);
    if (result?.error) {
      setEmailMsg({ type: "error", text: result.error });
    } else if (result?.success) {
      setEmailMsg({ type: "success", text: result.success });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteAccount();
  };

  return (
    <div className="space-y-8">
      {/* Email */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-[#222]">メールアドレス</h2>
        <p className="mt-1 text-sm text-[#828282]">
          現在: {email}
        </p>

        {emailMsg && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              emailMsg.type === "error"
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {emailMsg.text}
          </div>
        )}

        <form action={handleEmailSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="new_email"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              新しいメールアドレス
            </label>
            <input
              id="new_email"
              name="new_email"
              type="email"
              required
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="new@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-white text-sm disabled:opacity-50"
          >
            {saving ? "更新中..." : "メールアドレスを変更"}
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold text-[#222]">パスワード変更</h2>

        {passwordMsg && (
          <div
            className={`mt-4 rounded-lg p-3 text-sm ${
              passwordMsg.type === "error"
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form action={handlePasswordSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="new_password"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              新しいパスワード
            </label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="6文字以上"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              パスワードを確認
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="もう一度入力"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? "更新中..." : "パスワードを変更"}
          </button>
        </form>
      </section>

      {/* Delete Account */}
      <section className="rounded-2xl border-2 border-red-100 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-bold text-red-600">アカウント削除</h2>
        <p className="mt-2 text-sm text-[#828282]">
          アカウントを削除すると、プロフィール・ポートフォリオ・取引履歴が無効化されます。この操作は取り消せません。
        </p>

        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="mt-4 text-sm font-medium text-red-500 hover:text-red-700"
          >
            アカウントを削除する
          </button>
        ) : (
          <div className="mt-4 rounded-xl bg-red-50 p-4">
            <p className="text-sm font-bold text-red-700">
              本当にアカウントを削除しますか？
            </p>
            <p className="mt-1 text-xs text-red-500">
              進行中の取引がある場合、トラブルの原因になる可能性があります。
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "処理中..." : "削除する"}
              </button>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="btn-white text-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
