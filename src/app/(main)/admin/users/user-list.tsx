"use client";

import { useState } from "react";
import { toggleUserActive, toggleUserVerified } from "./actions";

type User = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
};

export function UserList({ users }: { users: User[] }) {
  const [filter, setFilter] = useState<"all" | "creator" | "client">("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered =
    filter === "all" ? users : users.filter((u) => u.role === filter);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setLoading(userId);
    await toggleUserActive(userId, !currentActive);
    setLoading(null);
  };

  const handleToggleVerified = async (
    userId: string,
    currentVerified: boolean
  ) => {
    setLoading(userId);
    await toggleUserVerified(userId, !currentVerified);
    setLoading(null);
  };

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {(["all", "creator", "client"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary-500 text-white"
                : "border border-[#BDBDBD] text-[#4F4F4F] hover:bg-[#F2F2F2]"
            }`}
          >
            {f === "all"
              ? `全て (${users.length})`
              : f === "creator"
                ? `クリエイター (${users.filter((u) => u.role === "creator").length})`
                : `クライアント (${users.filter((u) => u.role === "client").length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F2F2F2]">
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                ユーザー
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                ロール
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                ステータス
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-[#828282]">
                登録日
              </th>
              <th className="px-5 py-3 text-right text-xs font-bold text-[#828282]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[#F2F2F2] last:border-0"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-[#222]">
                    {user.display_name}
                  </p>
                  <p className="text-xs text-[#828282]">{user.email}</p>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-pill px-2.5 py-0.5 text-[11px] font-bold ${
                      user.role === "creator"
                        ? "bg-purple-100 text-purple-700"
                        : user.role === "admin"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.role === "creator"
                      ? "クリエイター"
                      : user.role === "admin"
                        ? "管理者"
                        : "クライアント"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    {user.is_verified && (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                        認証済
                      </span>
                    )}
                    {!user.is_active && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                        停止中
                      </span>
                    )}
                    {user.is_active && !user.is_verified && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-[#828282]">
                        未認証
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-[#828282]">
                  {new Date(user.created_at).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-5 py-4 text-right">
                  {user.role !== "admin" && (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleVerified(user.id, user.is_verified)
                        }
                        disabled={loading === user.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#4F4F4F] hover:bg-[#F2F2F2] disabled:opacity-50"
                      >
                        {user.is_verified ? "認証取消" : "認証する"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleActive(user.id, user.is_active)
                        }
                        disabled={loading === user.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          user.is_active
                            ? "text-red-500 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {user.is_active ? "利用停止" : "利用再開"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
