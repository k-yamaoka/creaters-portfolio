"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * ダッシュボード上部の「基本情報」(表示名 + アバター) のみを更新するアクション。
 *
 * - 表示名: 1〜40 文字。空文字は弾く。
 * - avatar_url: アップロード後のクライアントが Storage の public URL を渡す。
 *   "" を渡すとアバターを解除 (null 保存)。
 * - profiles テーブルのみ更新 (creator_profiles などは触らない)。
 *
 * 楽観更新で UI が即時反映されるよう、エラー時は { error } を返す。
 * 成功時は呼び出し元 path を revalidate して /dashboard と /creators の
 * SSR データを最新化する。
 */
export async function updateBasicInfo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const rawName = String(formData.get("display_name") ?? "").trim();
  if (!rawName) return { error: "表示名を入力してください" };
  if (rawName.length > 40) return { error: "表示名は 40 文字以内で入力してください" };

  // avatar_url は signed-URL アップロード後の public URL を受け取る形にする。
  // "__keep__" を渡すと既存値を維持、"" を渡すと null 化 (アバター解除)。
  const rawAvatar = formData.get("avatar_url");
  const avatarParam =
    typeof rawAvatar === "string" ? rawAvatar : undefined;

  const updates: Record<string, unknown> = { display_name: rawName };
  if (avatarParam !== undefined && avatarParam !== "__keep__") {
    // 簡易ホワイトリスト: 自社 Supabase Storage の URL のみ受け付ける
    if (avatarParam === "") {
      updates.avatar_url = null;
    } else if (
      /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/avatars\//.test(
        avatarParam
      )
    ) {
      updates.avatar_url = avatarParam;
    } else {
      return { error: "アバター画像 URL の形式が不正です" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: "基本情報の更新に失敗しました" };
  }

  // ===== 最低受注金額 (クリエイターのみ) =====
  // 値が送られてきた場合のみ creator_profiles.minimum_order_amount を更新する。
  // 空文字は明示的に NULL (応相談) としてセット。
  if (formData.has("minimum_order_amount")) {
    const raw = String(formData.get("minimum_order_amount") ?? "").trim();
    let parsed: number | null = null;
    if (raw !== "") {
      const n = parseInt(raw, 10);
      if (isNaN(n) || n < 0 || n > 9_999_999) {
        return {
          error: "最低受注金額は 0 〜 9,999,999 の範囲で入力してください",
        };
      }
      parsed = n;
    }

    const { data: existing } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error: cpErr } = await supabase
        .from("creator_profiles")
        .update({ minimum_order_amount: parsed })
        .eq("user_id", user.id);
      if (cpErr) {
        return { error: "最低受注金額の更新に失敗しました" };
      }
    }
    // クリエイタープロフ未作成の場合は ここでは何もしない
    // (プロフィール編集ページの updateProfile で初期作成される)
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/creators");
  return { ok: true as const };
}



export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const display_name = formData.get("display_name") as string;
  const bio = formData.get("bio") as string;
  // 所在地 + 経験年数は 2026-06-10 に項目ごと撤去。DB の列は後方互換のため
  // 残置するが、新規保存では常に null/0 で上書きする。
  const minRaw = (formData.get("minimum_order_amount") as string) || "";
  const minNum = parseInt(minRaw);
  const minimum_order_amount =
    minRaw === "" || isNaN(minNum) || minNum < 0 || minNum > 9_999_999
      ? null
      : minNum;
  const genres = formData.getAll("genres") as string[];
  const video_lengths = formData.getAll("video_lengths") as string[];
  const strengths_raw = formData.getAll("strengths") as string[];
  // 強みは最大2つまで(DB制約と二重に防御)
  if (strengths_raw.length > 2) {
    return { error: "強みは最大2つまで選択できます" };
  }
  const strengths = strengths_raw.slice(0, 2);
  // 使用 AI ツール (Sora, Runway 等) — マッチング向上のため再導入
  const ai_tools = formData.getAll("ai_tools") as string[];
  // 稼働状況
  const availRaw = (formData.get("availability_status") as string) || "";
  const allowedAvail = new Set([
    "accepting",
    "consultation_only",
    "busy",
    "paused",
  ]);
  const availability_status = allowedAvail.has(availRaw) ? availRaw : null;
  // 制作期間目安 (初稿)
  const draftRaw = (formData.get("typical_first_draft_days") as string) || "";
  const draftNum = parseInt(draftRaw);
  const typical_first_draft_days =
    draftRaw === "" || isNaN(draftNum) || draftNum < 1 || draftNum > 90
      ? null
      : draftNum;
  // SNS / 外部リンク — 各キーごとに input を読み、URL を簡易バリデーション
  const SOCIAL_KEYS = ["website", "youtube", "x", "instagram", "tiktok"];
  const social_links: Record<string, string> = {};
  for (const k of SOCIAL_KEYS) {
    const v = ((formData.get(`social_${k}`) as string) || "").trim();
    if (!v) continue;
    // http(s):// で始まる URL のみ受け付ける (誤入力ガード)
    if (!/^https?:\/\//i.test(v)) continue;
    social_links[k] = v;
  }

  // Update profile (display_name)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id);

  if (profileError) {
    return { error: "プロフィールの更新に失敗しました" };
  }

  // Check if creator_profile exists
  const { data: existing } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const payload = {
    bio,
    video_lengths,
    strengths,
    // 使用 AI ツール — マッチング/検索のために再導入 (2026-06-11)
    ai_tools,
    genres,
    // 所在地・経験年数は撤去。新規保存では常に null/0 で上書き。
    location: null as string | null,
    years_of_experience: 0,
    minimum_order_amount,
    availability_status,
    typical_first_draft_days,
    social_links,
  };

  if (existing) {
    const { error } = await supabase
      .from("creator_profiles")
      .update(payload)
      .eq("user_id", user.id);

    if (error) {
      return { error: "クリエイタープロフィールの更新に失敗しました" };
    }
  } else {
    const { error } = await supabase
      .from("creator_profiles")
      .insert({ user_id: user.id, ...payload });

    if (error) {
      return { error: "クリエイタープロフィールの作成に失敗しました" };
    }
  }

  // ===== Read 側ページを即時無効化 =====
  // 編集内容が /creators / /creators/[id] / /jobs などへすぐに反映されるように、
  // 関連するすべての SSR キャッシュを明示的に取り消す。
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/creators", "layout");
  revalidatePath("/portfolios");
  revalidatePath("/");

  redirect("/dashboard");
}

/**
 * カバー画像 URL を保存/解除する。
 * - クライアント側 (CoverImageEditor) で Storage アップロード済の publicUrl を受け取る
 * - null を渡すとカラムを null にして「カバー画像なし」にする
 * - URL は avatars/ バケット由来のみ許可 (任意の外部 URL を弾く)
 */
export async function updateCoverImage(url: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  if (url != null) {
    // 雑な URL 検証: Supabase Storage avatars バケットの publicURL のみ受け付ける
    if (!/\/storage\/v1\/object\/public\/avatars\//.test(url)) {
      return { error: "許可されていない画像 URL です" };
    }
  }

  const { error } = await supabase
    .from("creator_profiles")
    .update({ cover_image_url: url })
    .eq("user_id", user.id);
  if (error) {
    return { error: "カバー画像の更新に失敗しました" };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/creators", "layout");
  return { ok: true };
}

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const display_name = formData.get("display_name") as string;
  const company_name = formData.get("company_name") as string;
  const company_url = formData.get("company_url") as string;
  const industry = formData.get("industry") as string;
  // 00056 で追加した信頼性向上フィールド
  const company_description = formData.get("company_description") as string;
  const invoiceRaw = ((formData.get("invoice_registration_number") as string) ?? "").trim();
  // 適格請求書発行事業者の登録番号 (T + 13 桁)。空 or 形式 OK 以外は null。
  const invoice_registration_number =
    invoiceRaw && /^T\d{13}$/i.test(invoiceRaw)
      ? invoiceRaw.toUpperCase()
      : invoiceRaw === ""
        ? null
        : null;
  if (invoiceRaw && invoice_registration_number === null) {
    return {
      error:
        "インボイス登録番号の形式が正しくありません (T で始まる 13 桁を入力してください)",
    };
  }
  // logo_url はクライアント側でアップロード後に hidden で送られてくる
  const logoRaw = ((formData.get("logo_url") as string) ?? "").trim();
  // 信頼できる URL のみ受け付ける (avatars バケットの publicURL)
  const logo_url =
    logoRaw === ""
      ? null
      : /\/storage\/v1\/object\/public\/avatars\//.test(logoRaw)
        ? logoRaw
        : null;

  // Update profile (display_name)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id);

  if (profileError) {
    return { error: "プロフィールの更新に失敗しました" };
  }

  // Check if client_profile exists
  const { data: existing } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const clientData = {
    company_name: company_name || null,
    company_url: company_url || null,
    industry: industry || null,
    company_description: company_description?.trim() || null,
    invoice_registration_number,
    logo_url,
  };

  if (existing) {
    const { error } = await supabase
      .from("client_profiles")
      .update(clientData)
      .eq("user_id", user.id);

    if (error) {
      return { error: "企業情報の更新に失敗しました" };
    }
  } else {
    const { error } = await supabase.from("client_profiles").insert({
      user_id: user.id,
      ...clientData,
    });

    if (error) {
      return { error: "企業情報の作成に失敗しました" };
    }
  }

  // 案件一覧 / 案件詳細 / 応募管理 ページが即時に新しい企業情報を反映するよう
  // キャッシュを取り消す
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/jobs", "layout");
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/jobs", "layout");

  redirect("/dashboard");
}
