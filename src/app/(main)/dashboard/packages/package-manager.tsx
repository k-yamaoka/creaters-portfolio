"use client";

import { useState } from "react";
import {
  addPackage,
  updatePackage,
  deletePackage,
  togglePackageActive,
} from "./actions";
import { formatPrice } from "@/lib/utils";
import { PackageFormFields } from "./package-form-fields";
import {
  PLANNING_SUPPORT_OPTIONS,
  VOICEOVER_OPTIONS,
  RESOLUTION_OPTIONS,
  COMMERCIAL_USE_OPTIONS,
} from "@/lib/constants";

type ServicePackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  // 詳細設定 (00048)
  planning_support?: string | null;
  revisions_unlimited?: boolean;
  // 2026-06-03 分割 (00049)
  used_softwares?: string[];
  used_ai_tools?: string[];
  voiceover_type?: string | null;
  bgm_policy?: string | null;
  resolution?: string | null;
  project_files_included?: boolean;
  commercial_use?: string | null;
  commercial_use_note?: string | null;
  duration_target?: string | null;
  rush_available?: boolean;
  rush_delivery_days?: number | null;
  rush_surcharge?: number | null;
};

function labelOf<T extends { value: string; label: string }>(
  list: readonly T[],
  v: string | null | undefined
): string | null {
  if (!v) return null;
  return list.find((x) => x.value === v)?.label ?? v;
}

export function PackageManager({ packages }: { packages: ServicePackage[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingPkg = editingId
    ? packages.find((p) => p.id === editingId) ?? null
    : null;

  const handleAdd = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const result = await addPackage(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleUpdate = (id: string) => async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const result = await updatePackage(id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
    setSaving(false);
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await togglePackageActive(id, !currentActive);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このプランを削除しますか？")) return;
    const result = await deletePackage(id);
    if (result?.error) setError(result.error);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!showForm && !editingId && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-primary text-sm"
        >
          + プランを追加
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <form
          action={handleAdd}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8"
        >
          <h2 className="mb-6 text-lg font-bold text-[#222]">
            新しい料金プラン
          </h2>
          <PackageFormFields />
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-white text-sm"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? "追加中..." : "追加する"}
            </button>
          </div>
        </form>
      )}

      {/* Package list */}
      {packages.length === 0 && !showForm ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-card">
          <svg
            className="mx-auto h-12 w-12 text-[#E0E0E0]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-bold text-[#222]">
            まだプランがありません
          </h3>
          <p className="mt-2 text-sm text-[#828282]">
            「プランを追加」ボタンから料金プランを作成しましょう
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => {
            const isEditing = editingId === pkg.id;
            if (isEditing && editingPkg) {
              return (
                <form
                  key={pkg.id}
                  action={handleUpdate(pkg.id)}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8"
                >
                  <h2 className="mb-6 text-lg font-bold text-[#222]">
                    プランを編集
                  </h2>
                  <PackageFormFields
                    initial={{
                      name: editingPkg.name,
                      description: editingPkg.description,
                      price: editingPkg.price,
                      delivery_days: editingPkg.delivery_days,
                      revisions: editingPkg.revisions,
                      features: editingPkg.features,
                      planning_support: editingPkg.planning_support,
                      revisions_unlimited: editingPkg.revisions_unlimited,
                      used_softwares: editingPkg.used_softwares,
                      used_ai_tools: editingPkg.used_ai_tools,
                      voiceover_type: editingPkg.voiceover_type,
                      bgm_policy: editingPkg.bgm_policy,
                      resolution: editingPkg.resolution,
                      project_files_included: editingPkg.project_files_included,
                      commercial_use: editingPkg.commercial_use,
                      commercial_use_note: editingPkg.commercial_use_note,
                      duration_target: editingPkg.duration_target,
                      rush_available: editingPkg.rush_available,
                      rush_delivery_days: editingPkg.rush_delivery_days,
                      rush_surcharge: editingPkg.rush_surcharge,
                    }}
                  />
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-white text-sm"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary text-sm disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "保存する"}
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onEdit={() => setEditingId(pkg.id)}
                onToggle={() => handleToggle(pkg.id, pkg.is_active)}
                onDelete={() => handleDelete(pkg.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 *  カード表示 (閲覧モード)
 * ============================================================ */
function PackageCard({
  pkg,
  onEdit,
  onToggle,
  onDelete,
}: {
  pkg: ServicePackage;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const planning = labelOf(PLANNING_SUPPORT_OPTIONS, pkg.planning_support);
  const voiceover = labelOf(VOICEOVER_OPTIONS, pkg.voiceover_type);
  const resolution = labelOf(RESOLUTION_OPTIONS, pkg.resolution);
  const commercial = labelOf(COMMERCIAL_USE_OPTIONS, pkg.commercial_use);
  const revisionsLabel = pkg.revisions_unlimited
    ? "無制限"
    : `${pkg.revisions}回`;

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-card ${
        !pkg.is_active ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-[#222]">{pkg.name}</h3>
            {!pkg.is_active && (
              <span className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#828282]">
                非公開
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#828282]">{pkg.description}</p>
        </div>
        <p className="shrink-0 text-xl font-bold text-neon-purple-deep">
          {formatPrice(pkg.price)}
        </p>
      </div>

      {/* 基本メタ */}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#828282]">
        <span>納期 {pkg.delivery_days} 日</span>
        <span>修正 {revisionsLabel}</span>
        {pkg.duration_target && <span>尺 {pkg.duration_target}</span>}
        {resolution && <span>{resolution}</span>}
      </div>

      {/* 詳細メタ — 2026-06-03 追加 */}
      {(planning ||
        voiceover ||
        commercial ||
        pkg.project_files_included ||
        pkg.rush_available ||
        (pkg.used_softwares && pkg.used_softwares.length > 0) ||
        (pkg.used_ai_tools && pkg.used_ai_tools.length > 0) ||
        pkg.bgm_policy ||
        pkg.commercial_use_note) && (
        <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4">
          {/* 使用ソフト (cyan) と 生成 AI (pink) を別グループで表示 */}
          {pkg.used_softwares && pkg.used_softwares.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neon-cyan">
                使用ソフト
              </span>
              {pkg.used_softwares.map((t) => (
                <span
                  key={`sw-${t}`}
                  className="rounded-pill border border-neon-cyan/40 bg-neon-cyan/10 px-2.5 py-0.5 text-[11px] font-bold text-neon-cyan"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {pkg.used_ai_tools && pkg.used_ai_tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neon-pink">
                生成 AI ツール
              </span>
              {pkg.used_ai_tools.map((t) => (
                <span
                  key={`ai-${t}`}
                  className="rounded-pill border border-neon-pink/40 bg-neon-pink/10 px-2.5 py-0.5 text-[11px] font-bold text-neon-pink"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-2 text-xs text-[#4F4F4F] sm:grid-cols-2">
            {planning && (
              <p>
                <span className="text-[#828282]">企画・絵コンテ:</span>{" "}
                {planning}
              </p>
            )}
            {voiceover && (
              <p>
                <span className="text-[#828282]">ナレーション:</span> {voiceover}
              </p>
            )}
            {pkg.bgm_policy && (
              <p>
                <span className="text-[#828282]">BGM:</span> {pkg.bgm_policy}
              </p>
            )}
            {commercial && (
              <p>
                <span className="text-[#828282]">商用利用:</span> {commercial}
              </p>
            )}
            {pkg.project_files_included && (
              <p className="text-emerald-600">
                ✓ プロジェクトファイル納品あり
              </p>
            )}
            {pkg.rush_available && (
              <p className="text-neon-pink">
                ⚡ 特急対応:{" "}
                {pkg.rush_delivery_days && `${pkg.rush_delivery_days} 日 / `}
                {pkg.rush_surcharge != null
                  ? `+${formatPrice(pkg.rush_surcharge)}`
                  : "別途"}
              </p>
            )}
          </div>
          {pkg.commercial_use_note && (
            <p className="text-[11px] text-[#828282]">
              ※ {pkg.commercial_use_note}
            </p>
          )}
        </div>
      )}

      {/* features chips */}
      {pkg.features.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pkg.features.map((f) => (
            <span
              key={f}
              className="rounded bg-[#F2F2F2] px-2 py-0.5 text-[11px] text-[#4F4F4F]"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-3 border-t border-[#F2F2F2] pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-bold text-neon-purple-deep hover:text-neon-pink"
        >
          編集
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="text-sm text-[#828282] hover:text-[#4F4F4F]"
        >
          {pkg.is_active ? "非公開にする" : "公開する"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-red-500 hover:text-red-700"
        >
          削除
        </button>
      </div>
    </div>
  );
}
