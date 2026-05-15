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
const WORK_TYPES = [
  "cut_edit",
  "telop",
  "se",
  "color",
  "motion",
  "vfx",
  "thumbnail",
] as const;
const SOFTWARE = [
  "premiere",
  "final_cut",
  "davinci",
  "after_effects",
  "capcut",
  "vrew",
  "other",
] as const;
const DELIVERY_FORMATS = ["mp4", "mov", "youtube_upload", "drive", "wetransfer"] as const;

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

  const footage_minutes = parseIntInRange(formData.get("footage_minutes"), {
    max: LIMITS.FOOTAGE_MINUTES,
  });
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

  const work_types = parseEnumList(formData.getAll("work_types"), WORK_TYPES);
  const revision_count = parseIntInRange(formData.get("revision_count"), {
    max: LIMITS.REVISION_COUNT,
  });
  const software_options = parseEnumList(
    formData.getAll("software_options"),
    SOFTWARE
  );
  const delivery_formats = parseEnumList(
    formData.getAll("delivery_formats"),
    DELIVERY_FORMATS
  );
  const delivery_days = parseIntInRange(formData.get("delivery_days"), {
    max: LIMITS.DELIVERY_DAYS,
  });
  const reference_url = parseText(formData.get("reference_url"), 2000);
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
    status: "open",
    footage_minutes,
    finish_duration_unit,
    finish_duration_min,
    finish_duration_max,
    work_types,
    revision_count,
    software_options,
    delivery_formats,
    delivery_days,
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
