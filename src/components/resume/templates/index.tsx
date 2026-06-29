"use client";

import type { ResumeData, ResumeTemplateId } from "../types";
import { CinematicA } from "./CinematicA";
import { MinimalA } from "./MinimalA";
import { EditorialA } from "./EditorialA";
import { DataA } from "./DataA";
import { ProposalA } from "./ProposalA";

export { registerResumeFont } from "./common";
export type ResumeRenderProps = {
  data: ResumeData;
  thumbDataUrls: Record<string, string>;
  frameDataUrls: Record<string, string[]>;
};

/**
 * テンプレート ID から PDF Document JSX を返す dispatcher。
 *
 * Phase 1: 5 種を実装済 (cinematic-a / minimal-a / editorial-a / data-a / proposal-a)
 * Phase 2-4 で追加予定の ID (cinematic-b など) はここで CinematicA に fallback
 * する (UI 側で「準備中」表示)。
 */
export function renderResumeByTemplate(
  templateId: ResumeTemplateId,
  props: ResumeRenderProps
): React.ReactElement {
  switch (templateId) {
    case "cinematic-a":
      return <CinematicA {...props} />;
    case "minimal-a":
      return <MinimalA {...props} />;
    case "editorial-a":
      return <EditorialA {...props} />;
    case "data-a":
      return <DataA {...props} />;
    case "proposal-a":
      return <ProposalA {...props} />;
    default:
      return <CinematicA {...props} />;
  }
}
