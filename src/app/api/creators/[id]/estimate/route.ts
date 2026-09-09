import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { getCreatorById } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";

/**
 * AI Gateway が返す 認可/請求 エラーを 日本語 に変換して 有意義な文言 に置換。
 * onError で 拾って streamText の flush 時に 生成結果に 差し込む。
 */
function localizeGatewayError(msg: string): string {
  const low = msg.toLowerCase();
  if (low.includes("credit card")) {
    return "AI 見積もり サービスの 一時利用制限中です (支払い設定が 完了していません)。恐れ入りますが、下部の 「メッセージを送る」から クリエイターに 直接ご相談ください。";
  }
  if (low.includes("rate limit") || low.includes("429")) {
    return "AI 見積もりの 利用が集中しています。しばらく待って もう一度お試しください。";
  }
  if (low.includes("unauthorized") || low.includes("401") || low.includes("api key")) {
    return "AI 見積もり サービスの 認証エラーが発生しました。運営に お問い合わせください。";
  }
  return "AI 見積もりの 応答生成に失敗しました。しばらく待って もう一度お試しください。";
}

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

  // 料金プラン機能は撤去 (00050)。価格は minimum_order_amount 1 値のみ参照。
  const minPrice = creator.minimum_order_amount ?? null;

  const systemPrompt = `あなたは AI クリエイター特化マッチングプラットフォーム「アイムビ (アイムビ)」の見積もり相談 AI です。
ユーザーは「${creator.profiles.display_name}」さん(以下「このクリエイター」)に依頼を検討中です。
ユーザーの希望(動画の用途・尺・本数・納期など)に対して、概算金額の目安を提案してください。

# このクリエイターの情報
- 名前: ${creator.profiles.display_name}
- 自己紹介: ${creator.bio || "(未記入)"}
- 得意ジャンル: ${creator.genres.join(", ") || "(未記入)"}
- 強み: ${creator.strengths.join(", ") || "(未記入)"}
- 得意映像尺: ${creator.video_lengths.join(", ") || "(未記入)"}
- 評価: ${creator.review_count > 0 ? `★${creator.rating.toFixed(1)} (${creator.review_count}件)` : "評価数 0"}

${minPrice !== null ? `# 最低受注金額\n${formatPrice(minPrice)}〜` : "# 最低受注金額\n(未設定。応相談)"}

# 回答のルール
1. **必ず日本語**で、3〜6 行程度の簡潔な箇条書きで答える
2. ユーザーの希望から概算金額の目安「概算 ¥xx,xxx 〜 ¥xx,xxx」を提示
3. 最低受注金額が設定されている場合、それを下回る金額は提示しない
4. 過去実績や絶対値の約束はしない(「目安です」と書く)
5. 営業トーンにせず、フラットで誠実なトーンで
6. 最後に必ず「正確な見積もりはメッセージで直接ご相談ください」と1行添える
7. クリエイターの info に無いスキルや使用ツールを勝手に補足しない(具体的な AI ツール名 〔Sora / Runway / Veo 等〕も挙げない — 流動的で陳腐化しやすいため)
8. 依頼内容と関係ない雑談・違法・センシティブな質問には「見積もり以外はお答えできません」と短く返す`;

  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    // AI Gateway 経由 (環境変数 AI_GATEWAY_API_KEY が必要)。model 一覧は
    // https://ai-gateway.vercel.sh/v1/models で 都度確認。
    model: "anthropic/claude-haiku-4.5",
    system: systemPrompt,
    messages: modelMessages,
    // AIEST-003: streaming 中の エラーを 明示的に console + client 側に 流す
    onError: ({ error }) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[estimate] streamText error:", message);
    },
  });

  // toUIMessageStreamResponse は onError オプションで stream 内 error message を
  //   カスタム文字列に 変換できる。デフォルトだと生の 英語エラーが流れて UX が悪い。
  return result.toUIMessageStreamResponse({
    onError: (error) => {
      const raw = error instanceof Error ? error.message : String(error);
      return localizeGatewayError(raw);
    },
  });
}
