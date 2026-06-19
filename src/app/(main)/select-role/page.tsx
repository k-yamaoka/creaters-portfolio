"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Video } from "lucide-react";

export default function SelectRolePage() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "creator" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!role) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/auth/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    const data = await res.json();
    if (data.error) {
      setError(data.error);
      setSaving(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-card">
          <div className="mb-2 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-neon-pink to-neon-purple text-sm font-black text-white">
                A
              </div>
              <span className="text-xl font-bold text-[#222]">AILIER</span>
            </Link>
          </div>

          <h1 className="mt-4 text-center text-2xl font-bold text-[#222]">
            アカウントの種類を選択
          </h1>
          <p className="mt-2 text-center text-sm text-[#828282]">
            AILIERの利用方法に合わせて選択してください
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`rounded-xl border-2 px-4 py-6 text-center transition-colors ${
                role === "client"
                  ? "border-neon-purple-deep bg-neon-purple/10 text-neon-purple-deep"
                  : "border-[#E0E0E0] text-[#4F4F4F] hover:border-[#BDBDBD]"
              }`}
            >
              <Building2 size={36} strokeWidth={1.6} aria-hidden />
              <div className="mt-2 text-sm font-bold">依頼者</div>
              <div className="mt-1 text-xs text-[#828282]">
                AIクリエイターに依頼したい
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole("creator")}
              className={`rounded-xl border-2 px-4 py-6 text-center transition-colors ${
                role === "creator"
                  ? "border-neon-purple-deep bg-neon-purple/10 text-neon-purple-deep"
                  : "border-[#E0E0E0] text-[#4F4F4F] hover:border-[#BDBDBD]"
              }`}
            >
              <Video size={36} strokeWidth={1.6} aria-hidden />
              <div className="mt-2 text-sm font-bold">AIクリエイター</div>
              <div className="mt-1 text-xs text-[#828282]">
                AI動画案件を受注したい
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!role || saving}
            className="btn-primary mt-6 w-full disabled:opacity-50"
          >
            {saving ? "設定中..." : "続ける"}
          </button>
        </div>
      </div>
    </div>
  );
}
