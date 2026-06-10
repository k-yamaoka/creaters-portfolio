"use client";

import { useState } from "react";
import { JOB_DESCRIPTION_TEMPLATES } from "./job-description-templates";

/**
 * 「案件詳細」入力欄 + テンプレート選択ピッカー。
 *
 * - 上部にテンプレートのチップが並ぶ (カスタム / SNS広告 / プロダクト紹介 …)
 * - チップを押すと textarea の内容をそのテンプレートに「上書き」する
 *   既に入力があれば確認ダイアログで意図せぬ破壊を防ぐ
 * - textarea は controlled で、value / onChange を内部 state で管理
 * - フォーム送信時は name="description" のまま親の form action に渡る
 */
export function JobDescriptionWithTemplate() {
  const [content, setContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");

  const applyTemplate = (value: string) => {
    const tmpl = JOB_DESCRIPTION_TEMPLATES.find((t) => t.value === value);
    if (!tmpl) return;

    // 既に何か入力済の状態でテンプレートを切り替えると破壊的なので確認する。
    // (空白だけのときはそのまま上書き)
    if (content.trim() !== "" && content !== tmpl.body) {
      const ok = confirm(
        "入力済の案件詳細をテンプレートで上書きします。よろしいですか？"
      );
      if (!ok) return;
    }
    setSelectedTemplate(value);
    setContent(tmpl.body);
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <h2 className="mb-2 flex items-center text-lg font-bold text-[#222]">
        案件詳細
        <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
          必須
        </span>
      </h2>
      <p className="mb-4 text-sm text-[#828282]">
        テンプレートから雛形を選んで埋めるか、「カスタム」で空欄から自由に記入してください。
      </p>

      {/* テンプレート選択 */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neon-purple-deep">
          テンプレート
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {JOB_DESCRIPTION_TEMPLATES.map((tmpl) => {
            const isActive = selectedTemplate === tmpl.value;
            return (
              <button
                key={tmpl.value}
                type="button"
                onClick={() => applyTemplate(tmpl.value)}
                className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "border-neon-pink bg-neon-purple/10"
                    : "border-[#E0E0E0] hover:border-[#BDBDBD]"
                }`}
              >
                <span className="text-xl leading-none">{tmpl.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-bold ${
                      isActive ? "text-neon-purple-deep" : "text-[#4F4F4F]"
                    }`}
                  >
                    {tmpl.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-[#828282]">
                    {tmpl.description}
                  </p>
                </div>
                {isActive && (
                  <svg
                    className="h-4 w-4 shrink-0 text-neon-pink"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        id="description"
        name="description"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={14}
        required
        className="w-full rounded-lg border border-[#E0E0E0] px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink"
        placeholder={
          "例:\n・動画の目的や配信先\n・ターゲット視聴者\n・希望するテイストや参考動画\n・素材の有無 (撮影が必要か等)\n・その他の要件"
        }
      />
      <p className="mt-2 text-[11px] text-[#828282]">
        ※ テンプレート挿入後はそのまま自由に編集できます。各「:」の後ろに具体内容を追記してください。
      </p>
    </section>
  );
}
