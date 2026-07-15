"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  RichUploadDropzone,
  type UploadPayload,
} from "@/components/upload/rich-upload-dropzone";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

/**
 * オンボーディング ウィザード (2 ステップ)。
 *
 * Step 1: 基本情報の確認
 *   - display_name (読み取り専用: /register or OAuth 由来を反映済み)
 *   - user_type ラジオ (個人 / 法人) — 初期値 individual
 *   - 自己紹介 (任意, 空欄可)
 *
 * Step 2: 初回ポートフォリオ登録
 *   - RichUploadDropzone (D&D + URL タブ)
 *   - 最低 1 点必須。1 点でも登録すれば is_searchable=true になる (trigger)
 *
 * 完了フロー:
 *   1. 素材アップロード:
 *      - 画像 → /api/upload/thumbnail (formData POST)
 *      - 動画 → /api/upload/video/sign → 直 PUT
 *      - URL → そのまま
 *   2. /api/portfolio/batch で一括 INSERT
 *   3. /api/onboarding/complete で完了宣言
 *   4. /dashboard へ遷移
 */

type Props = {
  initialDisplayName: string;
  email: string;
  initialUserType: "individual" | "corporate";
  initialBio: string;
};

type Step = 1 | 2;

export function OnboardingWizard({
  initialDisplayName,
  email,
  initialUserType,
  initialBio,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [userType, setUserType] = useState<"individual" | "corporate">(
    initialUserType
  );
  const [bio, setBio] = useState(initialBio);

  // Step 2 state
  const [payload, setPayload] = useState<UploadPayload>({
    files: [],
    urls: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const totalItems = payload.files.length + payload.urls.length;
  const canSubmitStep2 = totalItems > 0 && !submitting;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    setProgress("アップロード準備中...");

    try {
      const supabase = createClient();

      type PreparedItem = {
        media_type: "video" | "image";
        video_url?: string | null;
        image_url?: string | null;
        video_platform?: "youtube" | "vimeo" | "other";
        thumbnail_url?: string | null;
        title: string;
      };

      const prepared: PreparedItem[] = [];

      // ---- ファイル アップロード (image は /api/upload/thumbnail, video は sign→PUT) ----
      for (const [i, f] of payload.files.entries()) {
        setProgress(`アップロード中 (${i + 1}/${payload.files.length}): ${f.file.name}`);
        if (f.kind === "image") {
          const fd = new FormData();
          fd.append("file", f.file);
          const r = await fetch("/api/upload/thumbnail", {
            method: "POST",
            body: fd,
          });
          const j = (await r.json()) as { url?: string; error?: string };
          if (!r.ok || !j.url) throw new Error(j.error ?? "画像アップロード失敗");
          prepared.push({
            media_type: "image",
            image_url: j.url,
            title: f.file.name.replace(/\.[^.]+$/, ""),
          });
        } else {
          // video: sign endpoint → 署名 URL に直 PUT
          const signRes = await fetch("/api/upload/video/sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: f.file.name,
              contentType: f.file.type,
              size: f.file.size,
            }),
          });
          const signJson = (await signRes.json()) as {
            signedUrl?: string;
            path?: string;
            publicUrl?: string;
            error?: string;
          };
          if (!signRes.ok || !signJson.signedUrl || !signJson.publicUrl) {
            throw new Error(signJson.error ?? "動画の署名URL発行に失敗");
          }
          // Supabase storage への直 PUT (signed URL は verb 制約なしで PUT 可)
          const uploadRes = await fetch(signJson.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": f.file.type },
            body: f.file,
          });
          if (!uploadRes.ok) throw new Error("動画アップロードに失敗");
          prepared.push({
            media_type: "video",
            video_url: signJson.publicUrl,
            video_platform: "other",
            title: f.file.name.replace(/\.[^.]+$/, ""),
          });
        }
      }

      // ---- URL 埋め込みは URL / サムネイルだけ prepared に流す ----
      for (const u of payload.urls) {
        prepared.push({
          media_type: "video",
          video_url: u.url,
          video_platform: u.platform,
          thumbnail_url: u.thumbnailUrl ?? null,
          title: u.title ?? "無題の動画",
        });
      }

      // ---- バッチ INSERT ----
      setProgress("投稿を登録しています...");
      const batchRes = await fetch("/api/portfolio/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: prepared }),
      });
      const batchJson = (await batchRes.json()) as {
        count?: number;
        error?: string;
      };
      if (!batchRes.ok) throw new Error(batchJson.error ?? "投稿に失敗");

      // ---- オンボーディング完了記録 ----
      setProgress("完了処理中...");
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, user_type: userType }),
      });

      // supabase の user_metadata display_name 差分 (念のため同期)
      await supabase.auth.updateUser({
        data: { display_name: initialDisplayName },
      });

      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "不明なエラー";
      setError(msg);
      setSubmitting(false);
      setProgress("");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neon-pink to-neon-purple text-white shadow-md">
          <Sparkles size={22} strokeWidth={1.8} aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            AILIER へようこそ
          </h1>
          <p className="text-sm text-gray-500">
            2 ステップでプロフィールを公開しましょう
          </p>
        </div>
      </div>

      {/* Progress */}
      <ol className="mb-8 grid grid-cols-2 gap-3 text-xs sm:text-sm">
        {[
          { n: 1 as const, label: "基本情報の確認" },
          { n: 2 as const, label: "最初のポートフォリオ" },
        ].map((s) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <li key={s.n}>
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  active
                    ? "border-neon-pink bg-neon-pink/5 text-neon-pink"
                    : done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-neon-pink text-white"
                      : done
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {done ? <CheckCircle2 size={12} strokeWidth={2.4} aria-hidden /> : s.n}
                </span>
                <span className="font-medium">STEP {s.n}: {s.label}</span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Body */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {step === 1 && (
          <Step1
            displayName={initialDisplayName}
            email={email}
            userType={userType}
            setUserType={setUserType}
            bio={bio}
            setBio={setBio}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            payload={payload}
            setPayload={setPayload}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
            canSubmit={canSubmitStep2}
            submitting={submitting}
            progress={progress}
            error={error}
          />
        )}
      </div>

      {/* Skip link (最低 1 点必須なので step2 では表示しない) */}
      {step === 1 && (
        <p className="mt-4 text-center text-xs text-gray-400">
          ※ 表示名は登録時のものを引き継ぎます。プロフィール画像等は登録完了後に「ダッシュボード → プロフィール」から追加できます。
        </p>
      )}
    </div>
  );
}

// ==================== Step 1 ====================

function Step1({
  displayName,
  email,
  userType,
  setUserType,
  bio,
  setBio,
  onNext,
}: {
  displayName: string;
  email: string;
  userType: "individual" | "corporate";
  setUserType: (v: "individual" | "corporate") => void;
  bio: string;
  setBio: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">基本情報の確認</h2>
        <p className="mt-1 text-sm text-gray-500">
          登録時の情報を確認して、必要なら事業形態と自己紹介を編集してください。自己紹介は空欄でも構いません。
        </p>
      </div>

      <dl className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="shrink-0 text-gray-500">表示名</dt>
          <dd className="truncate font-medium text-gray-900">{displayName}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="shrink-0 text-gray-500">メール</dt>
          <dd className="truncate text-gray-700">{email}</dd>
        </div>
      </dl>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          事業形態
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              userType === "individual"
                ? "border-neon-pink bg-neon-pink/10 text-neon-pink"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="userType"
              value="individual"
              checked={userType === "individual"}
              onChange={() => setUserType("individual")}
              className="sr-only"
            />
            個人 (フリーランス)
          </label>
          <label
            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
              userType === "corporate"
                ? "border-neon-pink bg-neon-pink/10 text-neon-pink"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="userType"
              value="corporate"
              checked={userType === "corporate"}
              onChange={() => setUserType("corporate")}
              className="sr-only"
            />
            法人 (映像制作会社等)
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-gray-700">
          自己紹介 <span className="text-xs font-normal text-gray-400">(任意 — 後から追加可能)</span>
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="得意ジャンル・活動歴・使えるツールなどを 1〜2 行で。"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-pill bg-neon-pink px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-neon-pink/90"
        >
          次へ: 作品を登録
          <ArrowRight size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ==================== Step 2 ====================

function Step2({
  payload,
  setPayload,
  onBack,
  onSubmit,
  canSubmit,
  submitting,
  progress,
  error,
}: {
  payload: UploadPayload;
  setPayload: (p: UploadPayload) => void;
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  submitting: boolean;
  progress: string;
  error: string | null;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          最初のポートフォリオを登録しよう
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          <b>1 点以上</b>の実績があると、企業側の検索・一覧に自動で公開されます。ファイルのドラッグ&ドロップまたは YouTube / Vimeo の URL 埋め込みに対応しています。
        </p>
      </div>

      <RichUploadDropzone
        value={payload}
        onChange={setPayload}
        maxFiles={10}
        maxFileSizeMb={50}
        disabled={submitting}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {submitting && (
        <div className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          {progress || "処理中..."}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-pill border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-pill bg-neon-pink px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-neon-pink/90 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "投稿中..." : "投稿して公開する"}
          {!submitting && <ArrowRight size={16} strokeWidth={2} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
