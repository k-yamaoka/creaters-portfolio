"use client";

import { useState } from "react";
import { CLIENT_TYPES } from "@/lib/constants";

export type EditingRequirementsData = {
  footage_minutes: number | null;
  finish_duration_unit: "sec" | "min" | null;
  finish_duration_min: number | null;
  finish_duration_max: number | null;
  count_min: number | null;
  count_max: number | null;
  work_types: string[];
  revision_count: number | null;
  software_options: string[];
  delivery_formats: string[];
  delivery_days: number | null;
  reference_url: string | null;
  is_recurring: boolean;
  monthly_count: number | null;
  client_type: string | null;
};

function formatFinishDuration(d: EditingRequirementsData): string | null {
  const min = d.finish_duration_min;
  const max = d.finish_duration_max;
  const unit = d.finish_duration_unit === "sec" ? "秒" : "分";
  if (min == null && max == null) return null;
  // バケット 4 種に一致するなら定型ラベルを返す
  if (d.finish_duration_unit !== "sec") {
    if (min == null && max === 1) return "〜1分";
    if (min === 1 && max === 5) return "1分〜5分";
    if (min === 5 && max === 10) return "5分〜10分";
    if (min === 10 && max == null) return "10分以上";
  }
  if (min != null && max != null) {
    return min === max ? `${min}${unit}` : `${min}〜${max}${unit}`;
  }
  return `${min ?? max}${unit}`;
}

function formatFootageMinutes(n: number): string {
  if (n <= 10) return "〜10分";
  if (n <= 30) return "10〜30分";
  if (n === 60) return "30分〜1時間";
  if (n >= 61 && n < 121) return "1時間〜";
  if (n >= 121 && n < 181) return "2時間〜";
  if (n >= 181) return "3時間〜";
  return `約 ${n} 分`;
}

function formatRevisionCount(n: number): string {
  if (n >= 99) return "5回〜";
  return `${n} 回`;
}

function formatCount(d: EditingRequirementsData): string | null {
  const min = d.count_min;
  const max = d.count_max;
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return min === max ? `${min} 本` : `${min}〜${max} 本`;
  }
  return `${min ?? max} 本`;
}

function clientTypeLabel(value: string | null): string | null {
  if (!value) return null;
  return CLIENT_TYPES.find((t) => t.value === value)?.label ?? null;
}

function hasAnyRequirement(d: EditingRequirementsData): boolean {
  return (
    d.footage_minutes != null ||
    d.finish_duration_min != null ||
    d.finish_duration_max != null ||
    d.count_min != null ||
    d.count_max != null ||
    d.work_types.length > 0 ||
    d.revision_count != null ||
    d.software_options.length > 0 ||
    d.delivery_formats.length > 0 ||
    d.delivery_days != null ||
    !!d.reference_url ||
    d.is_recurring ||
    !!d.client_type
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5">
      <dt className="shrink-0 text-xs font-bold text-[#828282]">{label}</dt>
      <dd className="min-w-0 text-sm text-[#222]">{value}</dd>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((v) => (
        <span
          key={v}
          className="rounded-pill bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-500"
        >
          {v}
        </span>
      ))}
    </div>
  );
}

function RequirementBody({ d }: { d: EditingRequirementsData }) {
  const finishLabel = formatFinishDuration(d);
  const countLabel = formatCount(d);
  const ctLabel = clientTypeLabel(d.client_type);
  return (
    <dl className="divide-y divide-[#F2F2F2]">
      {d.footage_minutes != null && (
        <Row label="素材時間" value={formatFootageMinutes(d.footage_minutes)} />
      )}
      {finishLabel && <Row label="完成尺" value={finishLabel} />}
      {countLabel && <Row label="本数" value={countLabel} />}
      {d.work_types.length > 0 && (
        <Row label="作業内容" value={<TagList items={d.work_types} />} />
      )}
      {d.revision_count != null && (
        <Row label="修正回数" value={formatRevisionCount(d.revision_count)} />
      )}
      {d.software_options.length > 0 && (
        <Row label="使用ソフト" value={<TagList items={d.software_options} />} />
      )}
      {d.delivery_formats.length > 0 && (
        <Row label="納品形式" value={<TagList items={d.delivery_formats} />} />
      )}
      {d.delivery_days != null && (
        <Row label="納期" value={`素材受け取りから ${d.delivery_days} 日`} />
      )}
      {(d.is_recurring || d.monthly_count != null) && (
        <Row
          label="発注形態"
          value={
            d.is_recurring
              ? d.monthly_count
                ? `継続案件（月 ${d.monthly_count} 本）`
                : "継続案件（本数未定・相談）"
              : "単発"
          }
        />
      )}
      {d.reference_url && (
        <Row
          label="参考動画"
          value={
            <ul className="space-y-1">
              {d.reference_url
                .split(/\r?\n/)
                .map((u) => u.trim())
                .filter(Boolean)
                .map((u) => (
                  <li key={u}>
                    <a
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-primary-500 hover:underline"
                    >
                      {u}
                    </a>
                  </li>
                ))}
            </ul>
          }
        />
      )}
      {ctLabel && <Row label="クライアント種別" value={ctLabel} />}
    </dl>
  );
}

export function EditingRequirements({
  data,
  title = "編集要件",
}: {
  data: EditingRequirementsData;
  title?: string;
}) {
  if (!hasAnyRequirement(data)) return null;
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
      <h2 className="mb-4 text-lg font-bold text-[#222]">{title}</h2>
      <RequirementBody d={data} />
    </div>
  );
}

export function EditingRequirementsCollapsible({
  data,
  jobTitle,
  jobHref,
}: {
  data: EditingRequirementsData;
  jobTitle: string;
  jobHref?: string;
}) {
  // デフォルトは折りたたみ。チャット画面で縦スペースを圧迫しないように
  const [open, setOpen] = useState(false);
  if (!hasAnyRequirement(data)) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-primary-200 bg-primary-50/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-50"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-primary-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
              />
            </svg>
            編集要件
          </span>
          <p className="min-w-0 truncate text-sm font-bold text-ink">
            {jobTitle}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-primary-300 bg-white px-2.5 py-1 text-[11px] font-bold text-primary-600 transition-colors group-hover:border-primary-500 group-hover:bg-primary-500 group-hover:text-white">
          {open ? "閉じる" : "詳細を見る"}
          <svg
            className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="border-t border-primary-200 bg-white/70 px-4 pb-4 pt-3">
          <RequirementBody d={data} />
          {jobHref && (
            <a
              href={jobHref}
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:underline"
            >
              案件詳細を開く
              <span aria-hidden>→</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
