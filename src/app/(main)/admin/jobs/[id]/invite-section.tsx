"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Search, CheckCheck, Sparkles } from "lucide-react";

/**
 * C-3 案件詳細ページの右カラムに配置される「クリエイターを探して招待する」
 * セクション (2026-07-21)。
 *
 * 挙動:
 *   1. タグをカテゴリ別に列挙。クリック で選択 (AND 条件)
 *   2. 「検索」で GET /api/admin/creators/search を叩く
 *   3. 結果一覧にチェックボックス。全選択 / 個別選択
 *   4. 「招待通知を送る」で POST /api/admin/jobs/:id/invite (一括 or 個別)
 *   5. 送信後、招待済みは検索結果から自動除外 (exclude_invited_job)
 */

type Tag = {
  id: string;
  category: string;
  name: string;
  sort_order: number;
};

type Creator = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_early_member: boolean;
  ai_tools: string[];
  genres: string[];
  matched_tag_ids: string[];
  matched_tag_count: number;
};

const CATEGORY_LABEL: Record<string, string> = {
  ai_tool: "AI ツール",
  genre: "ジャンル",
  skill: "スキル・強み",
  industry: "業種",
};

type Props = {
  jobId: string;
  jobTitle: string;
  tags: Tag[];
  preselectedTagIds: string[];
};

export function InviteSection({
  jobId,
  jobTitle,
  tags,
  preselectedTagIds,
}: Props) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    () => new Set(preselectedTagIds)
  );
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(
    new Set()
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const tagsByCategory = useMemo(() => {
    const grouped = new Map<string, Tag[]>();
    for (const t of tags) {
      const arr = grouped.get(t.category) ?? [];
      arr.push(t);
      grouped.set(t.category, arr);
    }
    return grouped;
  }, [tags]);

  async function runSearch() {
    setError(null);
    setLoading(true);
    setSelectedCreators(new Set());
    try {
      const params = new URLSearchParams();
      if (selectedTags.size > 0) {
        params.set("tags", Array.from(selectedTags).join(","));
      }
      params.set("exclude_invited_job", jobId);
      const r = await fetch(
        `/api/admin/creators/search?${params.toString()}`
      );
      const j = (await r.json()) as { creators?: Creator[]; error?: string };
      if (!r.ok) throw new Error(j.error ?? "検索に失敗しました");
      setCreators(j.creators ?? []);
      setHasSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setLoading(false);
    }
  }

  // preselectedTagIds があれば初回 auto search
  useEffect(() => {
    if (preselectedTagIds.length > 0) {
      void runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleTag(id: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleCreator(id: string) {
    setSelectedCreators((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selectedCreators.size === creators.length) {
      setSelectedCreators(new Set());
    } else {
      setSelectedCreators(new Set(creators.map((c) => c.id)));
    }
  }

  async function sendInvites() {
    if (selectedCreators.size === 0) return;
    setError(null);
    setFlash(null);
    setSending(true);
    try {
      const r = await fetch(`/api/admin/jobs/${jobId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_ids: Array.from(selectedCreators),
          message: message.trim() || undefined,
        }),
      });
      const j = (await r.json()) as {
        ok?: boolean;
        error?: string;
        invited?: number;
        skipped?: number;
      };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "招待送信に失敗");
      setFlash(
        `✓ ${j.invited} 名に招待通知を送信しました${
          (j.skipped ?? 0) > 0 ? ` (${j.skipped} 名は既招待でスキップ)` : ""
        }`
      );
      setSelectedCreators(new Set());
      setMessage("");
      // 再検索で招待済みを除外
      await runSearch();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sticky top-6 space-y-4 rounded-2xl border-2 border-indigo-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <Sparkles size={14} strokeWidth={2} className="text-indigo-600" aria-hidden />
          クリエイターを探して招待する
        </h3>
        <p className="mt-1 text-[10px] text-gray-500">
          タグで絞り込み → 選択 → 一括スカウト送信
        </p>
      </div>

      {/* タグ選択 */}
      <div className="space-y-2">
        {Array.from(tagsByCategory.entries()).map(([cat, catTags]) => (
          <div key={cat}>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {CATEGORY_LABEL[cat] ?? cat}
            </p>
            <div className="flex flex-wrap gap-1">
              {catTags.map((t) => {
                const active = selectedTags.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`rounded-pill border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      active
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={runSearch}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-pill bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50"
      >
        <Search size={12} strokeWidth={2} aria-hidden />
        {loading ? "検索中..." : "検索"}
      </button>

      {/* 検索結果 */}
      {hasSearched && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-700">
              検索結果: {creators.length} 名
              {selectedCreators.size > 0 && (
                <span className="ml-2 text-indigo-600">
                  ({selectedCreators.size} 名選択中)
                </span>
              )}
            </p>
            {creators.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:underline"
              >
                <CheckCheck size={10} strokeWidth={2} aria-hidden />
                {selectedCreators.size === creators.length
                  ? "全解除"
                  : "全選択"}
              </button>
            )}
          </div>

          <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
            {creators.length === 0 && (
              <li className="rounded-md bg-gray-50 px-3 py-2 text-center text-[11px] text-gray-500">
                該当するクリエイターがいません
              </li>
            )}
            {creators.map((c) => {
              const checked = selectedCreators.has(c.id);
              return (
                <li key={c.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
                      checked
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCreator(c.id)}
                      className="mt-0.5 h-3.5 w-3.5 accent-indigo-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">
                          {c.display_name}
                        </span>
                        {c.is_early_member && (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0 text-[9px] font-bold text-amber-800">
                            創設
                          </span>
                        )}
                        {c.matched_tag_count > 0 && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0 text-[9px] font-bold text-emerald-800">
                            マッチ {c.matched_tag_count}
                          </span>
                        )}
                      </span>
                      {c.bio && (
                        <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-600">
                          {c.bio}
                        </p>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* メッセージ + 送信 */}
      {selectedCreators.size > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <label className="block text-[11px] font-medium text-gray-700">
            一言メッセージ (任意)
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            disabled={sending}
            placeholder="例) あなたの作品が案件に非常にマッチしていると思いました！"
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50"
          />
          <p className="mt-0.5 text-[10px] text-gray-500">
            {message.length} / 500 (メールとアプリ内通知に含まれます)
          </p>

          <button
            type="button"
            onClick={sendInvites}
            disabled={sending}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-pill bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send size={12} strokeWidth={2} aria-hidden />
            {sending
              ? "送信中..."
              : `${selectedCreators.size} 名に招待を送る`}
          </button>
        </div>
      )}

      {flash && (
        <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800">
          {flash}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <p className="border-t border-gray-100 pt-2 text-[9px] text-gray-400">
        送信先: 「{jobTitle}」/ 有効期限 14 日 (超過で自動見送り)
      </p>
    </div>
  );
}
