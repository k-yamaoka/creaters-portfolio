"use client";

import { useState, useTransition } from "react";
import { createTag, deleteTag, toggleTagActive, updateTag } from "./actions";

type Tag = {
  id: string;
  category: string;
  name: string;
  slug: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Props = {
  category: string;
  tags: Tag[];
};

export function TagsAdmin({ category, tags }: Props) {
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<{ ok?: boolean; error?: string }>, fd: FormData, resetForm?: HTMLFormElement) {
    startTransition(async () => {
      const res = await action(fd);
      if (res.error) setMsg({ type: "err", text: res.error });
      else {
        setMsg({ type: "ok", text: "保存しました" });
        resetForm?.reset();
        setEditingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`rounded-lg p-3 text-sm ${
            msg.type === "err" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* 新規追加 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("category", category);
          run(createTag, fd, e.currentTarget);
        }}
        className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5"
      >
        <h3 className="text-sm font-bold text-gray-700">＋ 新規追加</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_120px_auto]">
          <input
            name="name"
            required
            maxLength={100}
            placeholder="表示名 (例: Sora 2 / SNS 広告動画)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="slug"
            maxLength={80}
            placeholder="slug (任意、URL/API 用 ASCII)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            name="sort_order"
            type="number"
            defaultValue={100}
            min={0}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            title="表示順 (小さいほど上位)"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </form>

      {/* 一覧 */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">表示名</th>
              <th className="px-4 py-3">slug</th>
              <th className="px-4 py-3 text-right">順</th>
              <th className="px-4 py-3">状態</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {tags.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  まだ タグ が登録されていません
                </td>
              </tr>
            )}
            {tags.map((tag) => {
              const isEditing = editingId === tag.id;
              return (
                <tr key={tag.id} className="border-b border-gray-100 last:border-0">
                  {isEditing ? (
                    <td colSpan={5} className="px-4 py-3">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          fd.set("id", tag.id);
                          run(updateTag, fd);
                        }}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_120px_auto_auto]"
                      >
                        <input
                          name="name"
                          defaultValue={tag.name}
                          required
                          maxLength={100}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          name="slug"
                          defaultValue={tag.slug ?? ""}
                          maxLength={80}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          name="sort_order"
                          type="number"
                          defaultValue={tag.sort_order}
                          min={0}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white hover:bg-gray-800"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-xs hover:bg-gray-50"
                        >
                          取消
                        </button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{tag.name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {tag.slug ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500">
                        {tag.sort_order}
                      </td>
                      <td className="px-4 py-3">
                        {tag.is_active ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                            有効
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                            無効
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditingId(tag.id)}
                          className="mr-2 text-xs text-neon-purple-deep hover:underline"
                        >
                          編集
                        </button>
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            fd.set("id", tag.id);
                            fd.set("next_active", tag.is_active ? "0" : "1");
                            run(toggleTagActive, fd);
                          }}
                        >
                          <button
                            type="submit"
                            className="mr-2 text-xs text-gray-600 hover:underline"
                          >
                            {tag.is_active ? "無効化" : "有効化"}
                          </button>
                        </form>
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!confirm(`「${tag.name}」を削除しますか?\n使用中のタグは削除できません (無効化してください)`))
                              return;
                            const fd = new FormData();
                            fd.set("id", tag.id);
                            run(deleteTag, fd);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:underline"
                          >
                            削除
                          </button>
                        </form>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
