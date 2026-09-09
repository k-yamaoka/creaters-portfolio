"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef } from "react";
import { Bot, SendHorizonal, MessageSquare, AlertTriangle } from "lucide-react";

/**
 * クリエイター詳細ページの「AI 見積もり相談」チャット。
 * - useChat hook で /api/creators/[id]/estimate を呼び出し
 * - サンプル質問のクイックボタンを 3 つ用意
 *
 * 2026-06-23 ライトテーマ化 + チャット UX 強化:
 *  - bg-white/[0.04] / text-white を gray-* に統一
 *  - メッセージエリアの背景をわずかにグレー (bg-gray-50) にしてチャットだと
 *    一目で分かる視覚ヒエラルキー
 *  - 入力欄に明確な border + focus 時に aimovie-navy-700 リング
 *  - 送信ボタンを大きめのグラデピル + アイコン + ラベル "送信" で訴求
 */
// AIEST-001: 初期挨拶メッセージ (画面 上部に固定表示)
const INITIAL_GREETING =
  "こんにちは。AI 見積もり相談です。動画の用途 (SNS 広告 / ブランド 動画 / 商品紹介 等)・尺・本数・納期 を 教えていただければ、概算金額の目安を 即答します。\n\n下の よくある質問 をクリックするか、依頼内容を 直接入力してください。";

export function EstimateChatBot({ creatorId }: { creatorId: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/creators/${creatorId}/estimate`,
    }),
    // AIEST-003: ストリーム中の エラー イベントを 表示するため onError で 状態化
    onError: (e) => {
      // useChat の error state に格納されるが、明示的に console 出す
      console.error("[EstimateChatBot] chat error:", e);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  // メッセージ追加 or エラー時に 最下部へスクロール
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, error, isLoading]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    void sendMessage({ text: t });
    setInput("");
  };

  const QUICK_PROMPTS = [
    "縦型15秒のSNS広告動画を3本作りたい。いくら?",
    "新商品ローンチ用に30秒のブランド動画1本。Sora で。予算感を教えて",
    "静止画バナーを10枚作りたい場合、対応可能?概算は?",
  ];

  // AIEST-002: 受信ストリームで text part が空の アシスタントメッセージ (API が
  //   error イベントだけ流して終了した場合) を判別してフォールバック表示する
  const hasFailedAssistantMessage = messages.some((m) => {
    if (m.role !== "assistant") return false;
    const t = m.parts.filter((p) => p.type === "text").map((p) => p.text).join("");
    return t.trim().length === 0;
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm"
          >
            <Bot size={16} strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">AI 見積もり相談</h3>
            <p className="text-[10px] text-gray-600">
              依頼内容を伝えると概算を即答します
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1 rounded-pill border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-bold text-gray-600 sm:inline-flex">
          <MessageSquare size={10} strokeWidth={2} aria-hidden />
          Chat
        </span>
      </div>

      {/* Messages area — bg-gray-50 でチャットだと一目で分かる */}
      <div
        ref={scrollRef}
        className="max-h-[360px] min-h-[140px] overflow-y-auto bg-gray-50 px-4 py-3"
      >
        {/* AIEST-001: 初期挨拶 (常時 上部表示) */}
        <div className="mb-3 flex justify-start">
          <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white px-3.5 py-2 text-xs leading-[1.7] text-gray-800">
            {INITIAL_GREETING}
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              よくある質問
            </p>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs text-gray-800 transition-all hover:border-aimovie-navy-500/50 hover:bg-aimovie-navy-500/[0.05] hover:text-gray-900"
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const text = m.parts
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("");
              // AIEST-002: 空 アシスタントメッセージ (error のみ返却時) は 描画スキップ
              //   代わりに 下部 の エラーバナーで まとめて表示
              if (m.role === "assistant" && text.trim().length === 0) {
                return null;
              }
              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-xs leading-[1.7] ${
                      m.role === "user"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border border-gray-200 bg-white text-gray-800"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-1.5 px-3.5 text-[11px] text-gray-500">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-aimovie-navy-500" />
                考え中…
              </div>
            )}
          </div>
        )}

        {/* AIEST-003: エラー フォールバック (network fail / AI Gateway error / 空応答) */}
        {(error || (hasFailedAssistantMessage && !isLoading)) && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900"
          >
            <AlertTriangle
              size={14}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-amber-600"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="font-bold">一時的にエラーが発生しました</p>
              <p className="mt-0.5 text-[11px] text-amber-800/80">
                AI 見積もり応答の 生成に失敗しました。しばらく待って もう一度お試しいただくか、
                下のメッセージ送信ボタン から 直接クリエイターに 相談してください。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input — 明確な border + focus ring */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-gray-200 bg-white p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="依頼内容を入力 (例: 縦型15秒×5本)"
          aria-label="AI 見積もりの質問"
          className="flex-1 rounded-pill border border-gray-300 bg-white px-4 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-aimovie-navy-700 focus:ring-2 focus:ring-aimovie-navy-700/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-indigo-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:hover:translate-y-0"
          aria-label="送信"
        >
          <SendHorizonal size={14} strokeWidth={2} aria-hidden />
          送信
        </button>
      </form>
    </div>
  );
}
