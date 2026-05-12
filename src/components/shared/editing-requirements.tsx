"use client";

import { useState } from "react";
import { CLIENT_TYPES } from "@/lib/constants";

export type EditingRequirementsData = {
  footage_minutes: number | null;
  finish_duration_unit: "sec" | "min" | null;
  finish_duration_min: number | null;
  finish_duration_max: number | null;
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
  const unit = d.finish_duration_unit === "min" ? "分" : "秒";
  const min = d.finish_duration_min;
  const max = d.finish_duration_max;
  if (min == null && max == null) return null;
  if (min != null && max != null) {
    return min === max ? `${min}${unit}` : `${min}〜${max}${unit}`;
  }
  return `${min ?? max}${unit}`;
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
  const ctLabel = clientTypeLabel(d.client_type);
  return (
    <dl className="divide-y divide-[#F2F2F2]">
      {d.footage_minutes != null && (
        <Row label="素材時間" value={`約 ${d.footage_minutes} 分`} />
      )}
      {finishLabel && <Row label="完成尺" value={finishLabel} />}
      {d.work_types.length > 0 && (
        <Row label="作業内容" value={<TagList items={d.work_types} />} />
      )}
      {d.revision_count != null && (
        <Row label="修正回数" value={`${d.revision_count} 回`} />
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
                : "継続案件"
              : "単発"
          }
        />
      )}
      {d.reference_url && (
        <Row
          label="参考動画"
          value={
            <a
              href={d.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary-500 hover:underline"
            >
              {d.reference_url}
            </a>
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
  const [open, setOpen] = useState(true);
  if (!hasAnyRequirement(data)) return null;
  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600">
            この取引の編集要件
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-[#222]">
            {jobTitle}
          </p>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-[#828282] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-primary-100 px-4 pb-4 pt-3">
          <RequirementBody d={data} />
          {jobHref && (
            <a
              href={jobHref}
              className="mt-3 inline-block text-xs font-medium text-primary-600 hover:underline"
            >
              案件詳細を開く →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
