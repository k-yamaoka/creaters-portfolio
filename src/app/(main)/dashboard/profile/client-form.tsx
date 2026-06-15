"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { updateClientProfile } from "./actions";
import type { CurrentUser } from "@/lib/supabase/queries";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const ALLOWED_LOGO_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export function ClientForm({ user }: { user: CurrentUser }) {
  const cp = user.client_profile;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(cp?.logo_url ?? null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!f) return;
    if (!ALLOWED_LOGO_MIME.includes(f.type as (typeof ALLOWED_LOGO_MIME)[number])) {
      setError("ロゴは JPEG / PNG / WebP のみアップロード可能です");
      return;
    }
    if (f.size > MAX_LOGO_BYTES) {
      setError("ロゴは 5MB 以下にしてください");
      return;
    }
    setError(null);
    setUploadingLogo(true);
    try {
      const supabase = createBrowserSupabase();
      const ext =
        f.type === "image/png"
          ? "png"
          : f.type === "image/webp"
            ? "webp"
            : "jpg";
      const path = `${user.id}/logo.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, f, { upsert: true, contentType: f.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setLogoUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "ロゴのアップロードに失敗しました"
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    if (logoUrl) formData.set("logo_url", logoUrl);
    else formData.set("logo_url", "");
    const result = await updateClientProfile(formData);
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
              担当者名 <span className="text-red-500">*</span>
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

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              disabled
              value={user.email}
              className="w-full rounded-lg border border-[#E0E0E0] bg-[#F8F8F8] px-4 py-3 text-sm text-[#828282]"
            />
          </div>
        </div>
      </section>

      {/* Company Info — 信頼性向上のため拡張 (2026-06-15) */}
      <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <h2 className="mb-1 text-lg font-bold text-[#222]">企業情報</h2>
        <p className="mb-6 text-xs text-[#828282]">
          ※ クリエイターに安心して取引してもらうため、ロゴ・事業内容・インボイス番号の入力を推奨します
        </p>
        <div className="space-y-5">
          {/* 企業ロゴ */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#4F4F4F]">
              企業ロゴ
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E0E0E0] bg-[#F8F8F8]">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="企業ロゴ"
                    fill
                    sizes="80px"
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-[#BDBDBD]">
                    未設定
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple px-4 py-2 text-xs font-bold text-white shadow-card transition-shadow hover:shadow-card-hover disabled:opacity-50"
                >
                  {uploadingLogo
                    ? "アップロード中..."
                    : logoUrl
                      ? "ロゴを変更"
                      : "ロゴを設定"}
                </button>
                {logoUrl && !uploadingLogo && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="text-[11px] text-[#828282] hover:text-red-500"
                  >
                    外す
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoPick}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="company_name"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              会社名
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              defaultValue={cp?.company_name ?? ""}
              placeholder="例: 株式会社サンプル"
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
          </div>

          <div>
            <label
              htmlFor="company_url"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              会社URL
            </label>
            <input
              id="company_url"
              name="company_url"
              type="url"
              defaultValue={cp?.company_url ?? ""}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
          </div>

          <div>
            <label
              htmlFor="industry"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              業種
            </label>
            <select
              id="industry"
              name="industry"
              defaultValue={cp?.industry ?? ""}
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            >
              <option value="">選択してください</option>
              <option value="IT・通信">IT・通信</option>
              <option value="広告・マーケティング">広告・マーケティング</option>
              <option value="メディア・エンタメ">メディア・エンタメ</option>
              <option value="製造業">製造業</option>
              <option value="小売・EC">小売・EC</option>
              <option value="飲食・サービス">飲食・サービス</option>
              <option value="不動産・建設">不動産・建設</option>
              <option value="医療・ヘルスケア">医療・ヘルスケア</option>
              <option value="教育">教育</option>
              <option value="金融・保険">金融・保険</option>
              <option value="官公庁・団体">官公庁・団体</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="company_description"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              会社概要・事業内容
            </label>
            <textarea
              id="company_description"
              name="company_description"
              rows={5}
              maxLength={1500}
              defaultValue={cp?.company_description ?? ""}
              placeholder="例: SNS広告運用支援会社。月間500本以上の動画クリエイティブを運用し、SaaS・D2C・教育業界での実績多数。"
              className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
            <p className="mt-1 text-[11px] text-[#828282]">
              ※ クリエイターが案件内容を判断する際の重要情報になります (最大 1,500 字)
            </p>
          </div>

          <div>
            <label
              htmlFor="invoice_registration_number"
              className="mb-1.5 block text-sm font-medium text-[#4F4F4F]"
            >
              インボイス登録番号
            </label>
            <input
              id="invoice_registration_number"
              name="invoice_registration_number"
              type="text"
              maxLength={14}
              defaultValue={cp?.invoice_registration_number ?? ""}
              placeholder="例: T1234567890123"
              className="w-full max-w-xs rounded-lg border border-[#E0E0E0] px-4 py-3 text-sm font-mono outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
            />
            <p className="mt-1 text-[11px] text-[#828282]">
              ※ 適格請求書発行事業者の登録番号 (T で始まる 13 桁) を入力してください。任意項目です。
            </p>
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || uploadingLogo}
          className="btn-primary px-10 text-sm disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
