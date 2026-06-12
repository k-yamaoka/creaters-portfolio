"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  parseIntInRange,
  parseEnum,
  parseEnumList,
  parseText,
  parseDate,
  LIMITS,
} from "@/lib/validation";

const FINISH_DURATION_UNIT = ["sec", "min"] as const;
const CLIENT_TYPE = ["company", "individual"] as const;
const DELIVERY_FORMATS = ["mp4", "mov", "youtube_upload", "drive", "wetransfer"] as const;

// software_options / 納品形式 の「その他」自由入力を許容するための
// 文字列パススルー (60 字 / 20 件まで)
function parseStringList(raws: FormDataEntryValue[], maxLen = 60, maxCount = 20): string[] {
  return raws
    .map((r) => String(r).trim())
    .filter((s) => s.length > 0 && s.length <= maxLen)
    .slice(0, maxCount);
}

/**
 * 案件の作成。
 * formData の "save_mode" が "draft" のときは status=draft で保存し、
 * 一覧の "下書き" タブから後で続きを編集できる。
 * "draft" の場合は必須項目検証を緩める (タイトルだけ必須)。
 */
export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get or create client profile
  let { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!clientProfile) {
    const { data } = await supabase
      .from("client_profiles")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    clientProfile = data;
  }

  if (!clientProfile) {
    return { error: "クライアント情報の作成に失敗しました" };
  }

  const saveMode = (formData.get("save_mode") as string) ?? "publish";
  const isDraft = saveMode === "draft";

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

  const unit_price = parseIntInRange(formData.get("unit_price"), {
    max: LIMITS.UNIT_PRICE,
  });
  const deadline = parseDate(formData.get("deadline"));
  const delivery_deadline = parseDate(formData.get("delivery_deadline"));

  // 素材時間 / 作業内容 / 修正回数 / 納期 は UI から撤去 (2026-06-03)。
  // 互換のため DB へは null で投入する。
  const finish_duration_unit = parseEnum(
    formData.get("finish_duration_unit"),
    FINISH_DURATION_UNIT
  );
  const finish_duration_min = parseIntInRange(
    formData.get("finish_duration_min"),
    { max: LIMITS.FINISH_DURATION }
  );
  const finish_duration_max = parseIntInRange(
    formData.get("finish_duration_max"),
    { max: LIMITS.FINISH_DURATION }
  );

  // 使用ソフトは AI 動画生成系 + 自由記入のため文字列パススルー
  const software_options = parseStringList(formData.getAll("software_options"));
  // 納品形式は enum (既定セット) と「その他」自由入力の混在 → 文字列パススルーに統一
  const delivery_formats = parseStringList(formData.getAll("delivery_formats"));
  void DELIVERY_FORMATS; // 旧 enum は廃止。constants はリストの正規セットとしてのみ参照される
  // アスペクト比: horizontal / vertical / 自由入力。30字×5件まで。
  const aspect_ratios = parseStringList(formData.getAll("aspect_ratios"), 30, 5);
  // ビジュアルスタイル: JOB_VISUAL_STYLES の slug (cinematic, anime_jp 等)。30字×5件まで。
  const visual_styles = parseStringList(formData.getAll("visual_styles"), 30, 5);
  const reference_url = parseText(formData.get("reference_url"), 2000);
  // 公開時は参考URL必須、下書きは緩和
  if (!isDraft && !reference_url) {
    return { error: "参考動画 URL を 1 件以上入力してください" };
  }
  const is_recurring = !!formData.get("is_recurring");
  const monthly_count = parseIntInRange(formData.get("monthly_count"), {
    max: LIMITS.MONTHLY_COUNT,
  });
  const client_type = parseEnum(formData.get("client_type"), CLIENT_TYPE);
  const count_min = parseIntInRange(formData.get("count_min"), {
    max: LIMITS.COUNT,
  });
  const count_max = parseIntInRange(formData.get("count_max"), {
    max: LIMITS.COUNT,
  });
  if (count_min !== null && count_max !== null && count_min > count_max) {
    return { error: "本数の下限が上限を超えています" };
  }

  const { error } = await supabase.from("jobs").insert({
    client_id: clientProfile.id,
    title,
    description,
    genres,
    budget_min,
    budget_max,
    unit_price,
    deadline,
    delivery_deadline,
    status: isDraft ? "draft" : "open",
    // UI 撤去済フィールドは互換のため null で投入
    footage_minutes: null,
    finish_duration_unit,
    finish_duration_min,
    finish_duration_max,
    work_types: [] as string[],
    revision_count: null,
    software_options,
    delivery_formats,
    aspect_ratios,
    visual_styles,
    delivery_days: null,
    reference_url,
    is_recurring,
    monthly_count: is_recurring ? monthly_count : null,
    client_type,
    count_min,
    count_max,
  });

  if (error) {
    return { error: "案件の作成に失敗しました" };
  }

  redirect("/dashboard/jobs");
}
