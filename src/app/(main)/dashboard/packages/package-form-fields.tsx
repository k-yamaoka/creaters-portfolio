"use client";

import { useState } from "react";
import {
  PLANNING_SUPPORT_OPTIONS,
  PACKAGE_SOFTWARES,
  PACKAGE_AI_TOOLS,
  VOICEOVER_OPTIONS,
  RESOLUTION_OPTIONS,
  COMMERCIAL_USE_OPTIONS,
  DURATION_TARGET_OPTIONS,
} from "@/lib/constants";

export type PackageFormInitial = {
  name?: string;
  description?: string;
  price?: number | null;
  delivery_days?: number | null;
  revisions?: number | null;
  features?: string[];
  planning_support?: string | null;
  revisions_unlimited?: boolean;
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

/**
 * 料金プラン (追加 / 編集) の共通フォーム部品。
 *
 * 自身では <form> を作らず、親の form 内に配置する想定。
 * 全フィールドは name 属性を持つので、親 form の action(formData) で
 * そのまま受け取れる。
 */
export function PackageFormFields({
  initial = {},
}: {
  initial?: PackageFormInitial;
}) {
  const [usedSoftwares, setUsedSoftwares] = useState<string[]>(
    initial.used_softwares ?? []
  );
  const [usedAiTools, setUsedAiTools] = useState<string[]>(
    initial.used_ai_tools ?? []
  );
  const [revisionsUnlimited, setRevisionsUnlimited] = useState<boolean>(
    initial.revisions_unlimited ?? false
  );
  const [projectFilesIncluded, setProjectFilesIncluded] = useState<boolean>(
    initial.project_files_included ?? false
  );
  const [rushAvailable, setRushAvailable] = useState<boolean>(
    initial.rush_available ?? false
  );

  const toggleIn =
    (setter: (fn: (prev: string[]) => string[]) => void) => (v: string) =>
      setter((prev) =>
        prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
      );
  const toggleSoftware = toggleIn(setUsedSoftwares);
  const toggleAiTool = toggleIn(setUsedAiTools);

  const label = "mb-1.5 block text-sm font-medium text-[#4F4F4F]";
  const input =
    "w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink";
  const sectionTitle = "text-xs font-bold uppercase tracking-[0.16em] text-neon-purple-deep";

  return (
    <div className="space-y-6">
      {/* ============ 基本 ============ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>
            プラン名 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            maxLength={60}
            defaultValue={initial.name ?? ""}
            placeholder="例: スタンダード"
            className={input}
          />
        </div>
        <div>
          <label className={label}>
            料金（円） <span className="text-red-500">*</span>
          </label>
          <input
            name="price"
            type="number"
            required
            min={0}
            max={9999999}
            defaultValue={initial.price ?? ""}
            placeholder="300000"
            className={input}
          />
        </div>
      </div>

      <div>
        <label className={label}>
          プラン説明 <span className="text-red-500">*</span>
        </label>
        <input
          name="description"
          type="text"
          required
          maxLength={200}
          defaultValue={initial.description ?? ""}
          placeholder="例: 縦型 SNS 広告 15 秒 ×3 本 / Sora 2 + Runway 編集"
          className={input}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>
            通常納期（日） <span className="text-red-500">*</span>
          </label>
          <input
            name="delivery_days"
            type="number"
            required
            min={1}
            max={999}
            defaultValue={initial.delivery_days ?? ""}
            placeholder="14"
            className={input}
          />
        </div>
        <div>
          <label className={label}>
            無料修正回数 <span className="text-red-500">*</span>
          </label>
          <input
            name="revisions"
            type="number"
            required={!revisionsUnlimited}
            min={0}
            max={99}
            disabled={revisionsUnlimited}
            defaultValue={initial.revisions ?? ""}
            placeholder="2"
            className={`${input} ${revisionsUnlimited ? "bg-gray-100 text-gray-400" : ""}`}
          />
        </div>
        <div className="flex items-end">
          <label className="inline-flex cursor-pointer items-center gap-2 pb-3 text-sm text-[#4F4F4F]">
            <input
              type="checkbox"
              name="revisions_unlimited"
              value="1"
              checked={revisionsUnlimited}
              onChange={(e) => setRevisionsUnlimited(e.target.checked)}
              className="h-4 w-4 rounded border-[#BDBDBD] text-neon-pink focus:ring-neon-pink"
            />
            修正は無制限
          </label>
        </div>
      </div>

      <div>
        <label className={label}>含まれる内容（1 行に 1 つ）</label>
        <textarea
          name="features"
          rows={4}
          defaultValue={(initial.features ?? []).join("\n")}
          placeholder={"AB案 3 種\n縦型 9:16 対応\nテロップ・BGM 付き"}
          className={input}
        />
      </div>

      {/* ============ 制作プロセス・範囲 ============ */}
      <div>
        <p className={sectionTitle}>制作プロセス・範囲</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>企画・構成・絵コンテ</label>
            <select
              name="planning_support"
              defaultValue={initial.planning_support ?? ""}
              className={`${input} bg-white`}
            >
              <option value="">選択してください</option>
              {PLANNING_SUPPORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>提供する映像尺の目安</label>
            <select
              name="duration_target"
              defaultValue={initial.duration_target ?? ""}
              className={`${input} bg-white`}
            >
              <option value="">選択してください</option>
              {DURATION_TARGET_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============ 使用ソフト (編集・制作ツール) ============ */}
      <div>
        <p className={sectionTitle}>使用ソフト（編集・制作ツール）</p>
        <p className="mt-1 text-xs text-[#828282]">
          編集や制作で実際に使用する従来型ソフトを選択してください（複数選択可）
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PACKAGE_SOFTWARES.map((t) => {
            const isActive = usedSoftwares.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleSoftware(t)}
                className={`rounded-pill border px-3 py-1.5 text-xs font-bold transition-colors ${
                  isActive
                    ? "border-neon-cyan bg-gradient-to-r from-neon-cyan to-neon-purple text-white"
                    : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-cyan hover:text-neon-cyan"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        {usedSoftwares.map((t) => (
          <input
            key={`sw-${t}`}
            type="hidden"
            name="used_softwares"
            value={t}
          />
        ))}
      </div>

      {/* ============ 使用 生成 AI ツール ============ */}
      <div>
        <p className={sectionTitle}>使用 生成 AI ツール</p>
        <p className="mt-1 text-xs text-[#828282]">
          動画 / 画像 / 音声 / 文章生成に使用する AI ツールを選択してください（複数選択可）
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PACKAGE_AI_TOOLS.map((t) => {
            const isActive = usedAiTools.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleAiTool(t)}
                className={`rounded-pill border px-3 py-1.5 text-xs font-bold transition-colors ${
                  isActive
                    ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple text-white"
                    : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-pink hover:text-neon-pink"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        {usedAiTools.map((t) => (
          <input
            key={`ai-${t}`}
            type="hidden"
            name="used_ai_tools"
            value={t}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>ナレーション / 音声</label>
          <select
            name="voiceover_type"
            defaultValue={initial.voiceover_type ?? ""}
            className={`${input} bg-white`}
          >
            <option value="">選択してください</option>
            {VOICEOVER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>BGM の方針 (任意)</label>
          <input
            name="bgm_policy"
            type="text"
            maxLength={200}
            defaultValue={initial.bgm_policy ?? ""}
            placeholder="例: ロイヤリティフリー BGM ライセンス込み"
            className={input}
          />
        </div>
      </div>

      {/* ============ 納品物・権利 ============ */}
      <div>
        <p className={sectionTitle}>納品物・権利</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>納品解像度</label>
            <select
              name="resolution"
              defaultValue={initial.resolution ?? ""}
              className={`${input} bg-white`}
            >
              <option value="">選択してください</option>
              {RESOLUTION_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>商用利用 / 著作権</label>
            <select
              name="commercial_use"
              defaultValue={initial.commercial_use ?? ""}
              className={`${input} bg-white`}
            >
              <option value="">選択してください</option>
              {COMMERCIAL_USE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#4F4F4F]">
            <input
              type="checkbox"
              name="project_files_included"
              value="1"
              checked={projectFilesIncluded}
              onChange={(e) => setProjectFilesIncluded(e.target.checked)}
              className="h-4 w-4 rounded border-[#BDBDBD] text-neon-pink focus:ring-neon-pink"
            />
            プロジェクトファイル（元データ・生成プロンプト等）を納品物に含む
          </label>
        </div>

        <div className="mt-3">
          <label className={label}>商用利用範囲の補足 (任意)</label>
          <input
            name="commercial_use_note"
            type="text"
            maxLength={200}
            defaultValue={initial.commercial_use_note ?? ""}
            placeholder="例: 自社 SNS / 自社 LP に限る。広告配信先は要相談"
            className={input}
          />
        </div>
      </div>

      {/* ============ スケジュール / 特急 ============ */}
      <div>
        <p className={sectionTitle}>特急納品オプション</p>
        <div className="mt-3 space-y-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#4F4F4F]">
            <input
              type="checkbox"
              name="rush_available"
              value="1"
              checked={rushAvailable}
              onChange={(e) => setRushAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-[#BDBDBD] text-neon-pink focus:ring-neon-pink"
            />
            特急納品に対応する
          </label>

          {rushAvailable && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>特急時の納期（日）</label>
                <input
                  name="rush_delivery_days"
                  type="number"
                  min={1}
                  max={999}
                  defaultValue={initial.rush_delivery_days ?? ""}
                  placeholder="3"
                  className={input}
                />
              </div>
              <div>
                <label className={label}>追加料金（円）</label>
                <input
                  name="rush_surcharge"
                  type="number"
                  min={0}
                  max={9999999}
                  defaultValue={initial.rush_surcharge ?? ""}
                  placeholder="50000"
                  className={input}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
