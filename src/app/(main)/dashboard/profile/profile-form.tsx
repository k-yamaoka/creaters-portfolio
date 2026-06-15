"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import {
  GENRES,
  VIDEO_LENGTHS,
  STRENGTHS,
  MAX_STRENGTHS,
  AI_TOOLS,
  AI_TOOL_CATEGORIES,
  AVAILABILITY_STATUSES,
  SOCIAL_LINK_DEFS,
} from "@/lib/constants";
import type { CurrentUser } from "@/lib/supabase/queries";
import { MIcon } from "@/components/ui/m-icon";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const cp = user.creator_profile;
  // ジャンル / 尺 / 強み は定数リスト変更で旧値が DB に残っているケースがある。
  // 現在の定数に存在する値のみを初期選択にすることで、ユーザーが
  // 「全部チェック → 保存」しても "見えない旧値" が残らないようにする (同期切れ対策)。
  const genreAllowed = new Set<string>(GENRES);
  const lengthAllowed = new Set<string>(VIDEO_LENGTHS);
  const strengthAllowed = new Set<string>(STRENGTHS);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    (cp?.genres ?? []).filter((g) => genreAllowed.has(g))
  );
  const [selectedLengths, setSelectedLengths] = useState<string[]>(
    (cp?.video_lengths ?? []).filter((l) => lengthAllowed.has(l))
  );
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>(
    (cp?.strengths ?? []).filter((s) => strengthAllowed.has(s))
  );
  // 使用 AI ツール — マスタリストにあるものだけを初期選択 (旧値の混入防止)
  const aiToolAllowed = new Set(AI_TOOLS.map((t) => t.name));
  const [selectedAiTools, setSelectedAiTools] = useState<string[]>(
    (cp?.ai_tools ?? []).filter((t) => aiToolAllowed.has(t))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAiTool = (name: string) =>
    setSelectedAiTools((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleLength = (length: string) => {
    setSelectedLengths((prev) =>
      prev.includes(length)
        ? prev.filter((l) => l !== length)
        : [...prev, length]
    );
  };

  const toggleStrength = (s: string) => {
    setSelectedStrengths((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      // 最大2件まで
      if (prev.length >= MAX_STRENGTHS) return prev;
      return [...prev, s];
    });
  };

  const strengthsAtLimit =
    selectedStrengths.length >= MAX_STRENGTHS;

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    selectedGenres.forEach((g) => formData.append("genres", g));
    selectedLengths.forEach((l) => formData.append("video_lengths", l));
    selectedStrengths
      .slice(0, MAX_STRENGTHS)
      .forEach((s) => formData.append("strengths", s));
    selectedAiTools.forEach((t) => formData.append("ai_tools", t));
    const result = await updateProfile(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-6 text-lg font-bold text-[#222]">基本情報</h2>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="display_name"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              表示名 <span className="text-red-500">*</span>
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              defaultValue={user.display_name}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
          </div>

          {/* 所在地は 2026-06-10 に項目ごと撤去 */}
          {/* 経験年数も 2026-06-10 に項目ごと撤去 */}

          {/* 最低受注金額 — クリエイター一覧/詳細で「¥xx,xxx〜」として表示される */}
          <div>
            <label
              htmlFor="minimum_order_amount"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              最低受注金額（円）
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#828282]">¥</span>
              <input
                id="minimum_order_amount"
                name="minimum_order_amount"
                type="number"
                min={0}
                max={9999999}
                step={1000}
                defaultValue={cp?.minimum_order_amount ?? ""}
                placeholder="30000"
                className="w-48 rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              />
              <span className="text-sm text-[#828282]">〜</span>
            </div>
            <p className="mt-1.5 text-xs text-[#828282]">
              ※ クリエイター一覧/詳細に「¥xx,xxx〜」として表示されます。未設定 (空欄) の場合は「応相談」になります。
            </p>
          </div>
        </div>
      </section>

      {/* Genres */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">得意ジャンル</h2>
        <p className="mb-4 text-sm text-[#828282]">
          該当するジャンルを選択してください(複数選択可)
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                selectedGenres.includes(genre)
                  ? "border-neon-pink bg-gradient-to-r from-neon-pink to-neon-purple text-white"
                  : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-pink"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Video Lengths */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">得意映像尺</h2>
        <p className="mb-4 text-sm text-[#828282]">
          得意な動画の長さを選択してください(複数選択可)
        </p>
        <div className="flex flex-wrap gap-2">
          {VIDEO_LENGTHS.map((length) => (
            <button
              key={length}
              type="button"
              onClick={() => toggleLength(length)}
              className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                selectedLengths.includes(length)
                  ? "border-neon-cyan bg-gradient-to-r from-neon-cyan to-neon-purple text-white"
                  : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-cyan"
              }`}
            >
              {length}
            </button>
          ))}
        </div>
      </section>

      {/* Strengths */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-[#222]">強み</h2>
          <span
            className={`text-xs font-bold ${
              strengthsAtLimit ? "text-neon-pink" : "text-[#828282]"
            }`}
          >
            {selectedStrengths.length} / {MAX_STRENGTHS}
          </span>
        </div>
        <p className="mb-4 text-sm text-[#828282]">
          最大 {MAX_STRENGTHS} つまで選択できます。AIの中でも自分を選ぶ理由を絞り込みます。
        </p>
        <div className="flex flex-wrap gap-2">
          {STRENGTHS.map((s) => {
            const active = selectedStrengths.includes(s);
            const disabled = !active && strengthsAtLimit;
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleStrength(s)}
                disabled={disabled}
                aria-pressed={active}
                className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-neon-pink bg-neon-pink text-white shadow-[0_0_14px_rgba(255,77,157,0.4)]"
                    : disabled
                      ? "cursor-not-allowed border-[#E0E0E0] text-[#BDBDBD] opacity-60"
                      : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-pink"
                }`}
                title={disabled ? `最大${MAX_STRENGTHS}つまで` : undefined}
              >
                {s}
              </button>
            );
          })}
        </div>
        {strengthsAtLimit && (
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-neon-purple-deep">
            <MIcon name="check_circle" fill size={14} />
            {MAX_STRENGTHS}つ選択済み。変更する場合はチェック済みを外してください。
          </p>
        )}
      </section>

      {/* 使用 AI ツール — カテゴリ別グルーピング、複数選択可 */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">使用 AI ツール</h2>
        <p className="mb-4 text-sm text-[#828282]">
          使いこなしている AI ツールを選択してください (複数選択可)。
          企業はここで検索・フィルタリングを行います。
        </p>
        <div className="space-y-4">
          {AI_TOOL_CATEGORIES.map((cat) => {
            const tools = AI_TOOLS.filter((t) => t.category === cat);
            if (tools.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#828282]">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tools.map((t) => {
                    const active = selectedAiTools.includes(t.name);
                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => toggleAiTool(t.name)}
                        className={`rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-neon-purple bg-gradient-to-r from-neon-purple to-neon-pink text-white"
                            : "border-[#BDBDBD] text-[#4F4F4F] hover:border-neon-purple"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[#828282]">
          選択中: <span className="font-bold text-neon-purple-deep">{selectedAiTools.length}</span> 件
        </p>
      </section>

      {/* 稼働状況 + 制作期間目安 */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">稼働状況 / 納期目安</h2>
        <p className="mb-4 text-sm text-[#828282]">
          企業が依頼可否を判断する重要な情報です。最新の状況に合わせて更新してください。
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4F4F4F]">
              現在の稼働状況
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_STATUSES.map((s) => (
                <label
                  key={s.value}
                  className="cursor-pointer"
                  htmlFor={`avail_${s.value}`}
                >
                  <input
                    id={`avail_${s.value}`}
                    type="radio"
                    name="availability_status"
                    value={s.value}
                    defaultChecked={cp?.availability_status === s.value}
                    className="peer sr-only"
                  />
                  <span
                    className={`inline-flex items-center rounded-pill border-2 px-3 py-1.5 text-xs font-bold transition-colors ${s.color} border-transparent peer-checked:border-neon-pink peer-checked:shadow-[0_0_10px_rgba(255,77,157,0.35)]`}
                  >
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#828282]">
              ※ 未選択の場合はバッジを表示しません
            </p>
          </div>

          <div>
            <label
              htmlFor="typical_first_draft_days"
              className="mb-2 block text-sm font-medium text-[#4F4F4F]"
            >
              初稿提出までの目安日数
            </label>
            <div className="flex items-center gap-2">
              <input
                id="typical_first_draft_days"
                name="typical_first_draft_days"
                type="number"
                min={1}
                max={90}
                step={1}
                defaultValue={cp?.typical_first_draft_days ?? ""}
                placeholder="7"
                className="w-28 rounded-lg border border-[#E0E0E0] px-3 py-2.5 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              />
              <span className="text-sm text-[#4F4F4F]">日</span>
            </div>
            <p className="mt-2 text-[11px] text-[#828282]">
              受注後、初稿を提出するまでに通常かかる日数 (1〜90)
            </p>
          </div>
        </div>
      </section>

      {/* SNS / 外部リンク */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">SNS / 外部リンク</h2>
        <p className="mb-4 text-sm text-[#828282]">
          公開している場合のみ、URL を入力してください。空欄は非表示になります。
        </p>
        <div className="space-y-3">
          {SOCIAL_LINK_DEFS.map((def) => (
            <div key={def.key} className="grid items-center gap-2 sm:grid-cols-[140px_1fr]">
              <label
                htmlFor={`social_${def.key}`}
                className="text-sm font-medium text-[#4F4F4F]"
              >
                {def.label}
              </label>
              <input
                id={`social_${def.key}`}
                name={`social_${def.key}`}
                type="url"
                defaultValue={cp?.social_links?.[def.key] ?? ""}
                placeholder={def.placeholder}
                className="w-full rounded-lg border border-[#E0E0E0] px-4 py-2.5 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Bio (最下部) */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-2 text-lg font-bold text-[#222]">自己紹介</h2>
        <p className="mb-4 text-sm text-[#828282]">
          あなたの強み・得意ジャンル・実績・制作への想いなどを記入してください
        </p>
        <textarea
          name="bio"
          rows={6}
          defaultValue={cp?.bio ?? ""}
          placeholder="例: 元・広告代理店プランナー。Meta広告のAB案を1週間で50案出すスタイル。Sora 2 + Runway での合成編集が得意で、コスメD2C・SaaS業界での実績多数。"
          className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
        />
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
