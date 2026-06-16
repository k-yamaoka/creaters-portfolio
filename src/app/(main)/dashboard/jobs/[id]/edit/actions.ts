"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseText, parseDate, parseIntInRange, LIMITS } from "@/lib/validation";

/**
 * 既存案件の編集。
 *
 * - 認可: 掲載企業 (client_id = 自分の client_profile.id) のみ更新可
 * - 編集対象: タイトル / 詳細 / ジャンル / 予算 / 応募締切 / 納品希望 / ステータス
 * - 募集中/締切/キャンセル/下書き の status 遷移のみ許可。delivered 等 enum
 *   外は弾く (DB enum で 2 重防御)
 * - 案件詳細フィールド (制作要件・本数・参考URL 等) はここでは扱わない
 *   (新規作成時に一気に決める設計のため、編集は基本情報に絞る)
 */
const ALLOWED_STATUS = new Set(["draft", "open", "closed", "cancelled"]);

export async function updateJob(jobId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 認可: 自分の client_profile が掲載した案件か確認
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!clientProfile) return { error: "企業情報が未登録です" };

  const { data: existingJob } = await supabase
    .from("jobs")
    .select("client_id")
    .eq("id", jobId)
    .single();
  if (!existingJob) return { error: "案件が見つかりません" };
  if (existingJob.client_id !== clientProfile.id) {
    return { error: "この案件を編集する権限がありません" };
  }

  const title = parseText(formData.get("title"), LIMITS.TITLE_LEN);
  if (!title) return { error: "タイトルを入力してください" };
  const description =
    parseText(formData.get("description"), LIMITS.DESCRIPTION_LEN) ?? "";

  const genres = (formData.getAll("genres") as FormDataEntryValue[])
    .map((g) => String(g))
    .filter((g) => g.length > 0 && g.length <= 50)
    .slice(0, 20);

  const budget_min = parseIntInRange(formData.get("budget_min"), {
    max: LIMITS.BUDGET,
  });
  const budget_max = parseIntInRange(formData.get("budget_max"), {
    max: LIMITS.BUDGET,
  });
  if (budget_min !== null && budget_max !== null && budget_min > budget_max) {
    return { error: "予算の下限が上限を超えています" };
  }

  const deadline = parseDate(formData.get("deadline"));
  const delivery_deadline = parseDate(formData.get("delivery_deadline"));

  const statusRaw = String(formData.get("status") ?? "").trim();
  if (!ALLOWED_STATUS.has(statusRaw)) {
    return { error: "ステータスが不正です" };
  }
  const status = statusRaw as "draft" | "open" | "closed" | "cancelled";

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      description,
      genres,
      budget_min,
      budget_max,
      deadline,
      delivery_deadline,
      status,
    })
    .eq("id", jobId);

  if (error) {
    return { error: "案件の更新に失敗しました" };
  }

  // 関連ページを即時反映
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath("/jobs", "layout");
  revalidatePath(`/jobs/${jobId}`);

  redirect(`/dashboard/jobs/${jobId}`);
}
