import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { getCreatorById } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";

// Fluid Compute: AI 呼び出しは長尺になりうるので延長
export const maxDuration = 60;

/**
 * クリエイター見積もり相談 AI チャット。
 *
 * - Vercel AI Gateway 経由で anthropic/claude-haiku-4.5 を呼び出し
 * - クリエイターの context (パッケージ/AIツール/強み/映像尺) を system prompt に注入
 * - useChat hook に対応する UI message 形式でストリーミング返却
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const creator = await getCreatorById(id);
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const body = (await req.json()) as { messages: UIMessage[] };
  const messages = body.messages ?? [];

  const activePackages = creator.service_packages.filter((p) => p.is_active);
  const minPrice =
    activePackages.length > 0
      ? Math.min(...activePackages.map((p) => p.price))
      : null;

  const packageLines = activePackages
    .map(
      (p, i) =>
        `${i + 1}. 「${p.name}」: ${formatPrice(p.price)} / ${p.delivery_days}日納期 / 修正${p.revisions}回\n   内容: ${p.description}\n   含むもの: ${p.features.join(", ")}`
    )
    .join("\n\n");

  const systemPrompt = `あなたは AI クリエイター特化マッチングプラットフォーム「AILIER (アイリエ)」の見積もり相談 AI です。
ユーザーは「${creator.profiles.display_name}」さん(以下「このクリエイター」)に依頼を検討中です。
ユーザーの希望(動画の用途・尺・本数・納期など)に対して、このクリエイターの公開料金から **概算金額** と **推奨パッケージ** を提案してください。

# このクリエイターの情報
- 名前: ${creator.profiles.display_name}
- 自己紹介: ${creator.bio || "(未記入)"}
- 所在地: ${creator.location || "(未記入)"}
- 経験年数: ${creator.years_of_experience}年
- 得意ジャンル: ${creator.genres.join(", ") || "(未記入)"}
- 使用 AI ツール: ${creator.ai_tools.join(", ") || "(未記入)"}
- 強み: ${creator.strengths.join(", ") || "(未記入)"}
- 得意映像尺: ${creator.video_lengths.join(", ") || "(未記入)"}
- 評価: ${creator.review_count > 0 ? `★${creator.rating.toFixed(1)} (${creator.review_count}件)` : "評価数 0"}

# 公開料金パッケージ
${packageLines || "(現在公開中のパッケージはありません)"}

${minPrice !== null ? `# 最低対応金額\n${formatPrice(minPrice)}〜` : ""}

# 回答のルール
1. **必ず日本語**で、3〜6 行程度の簡潔な箇条書きで答える
2. ユーザーの希望と公開パッケージを照らして「推奨プラン名」と「概算 ¥xx,xxx 〜 ¥xx,xxx」を提示
3. 公開パッケージにない用途(例: 静止画10枚だけ等)は「カスタム見積もり推奨」と書き、メッセージ経由で相談を促す
4. 過去実績や絶対値の約束はしない(「目安です」と書く)
5. 営業トーンにせず、フラットで誠実なトーンで
6. 最後に必ず「正確な見積もりはメッセージで直接ご相談ください」と1行添える
7. このクリエイターの info に無いツール・スキルを勝手に補足しない(例:「Sora 3 も対応」など書かない)
8. 依頼内容と関係ない雑談・違法・センシティブな質問には「見積もり以外はお答えできません」と短く返す`;

  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    // AI Gateway 経由 (環境変数 AI_GATEWAY_API_KEY が必要)
    model: "anthropic/claude-haiku-4.5",
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
