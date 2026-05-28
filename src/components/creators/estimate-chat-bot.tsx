"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

/**
 * クリエイター詳細ページの「AI 見積もり相談」チャット。
 * - useChat hook で /api/creators/[id]/estimate を呼び出し
 * - サンプル質問のクイックボタンを 3 つ用意
 */
export function EstimateChatBot({ creatorId }: { creatorId: string }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/creators/${creatorId}/estimate`,
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

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

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm shadow-[0_20px_50px_-15px_rgba(157,92,255,0.2)]">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple text-xs shadow-[0_0_10px_rgba(157,92,255,0.5)]">
            🤖
          </span>
          <div>
            <h3 className="text-sm font-black text-white">AI 見積もり相談</h3>
            <p className="text-[10px] text-white/60">
              依頼内容を伝えると概算を即答します
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-[360px] min-h-[120px] overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              よくある質問
            </p>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left text-xs text-white/80 transition-all hover:border-neon-cyan/40 hover:bg-white/[0.07] hover:text-white"
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
              return (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-xs leading-[1.7] ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-neon-pink/25 to-neon-purple/25 text-white"
                        : "border border-white/10 bg-white/[0.04] text-white/90"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-center gap-1.5 px-3.5 text-[11px] text-white/50">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-neon-cyan" />
                考え中…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-3 py-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="依頼内容を入力(例: 縦型15秒×5本)"
          className="flex-1 rounded-pill bg-white/5 px-4 py-2 text-xs text-white placeholder-white/40 outline-none transition-colors focus:bg-white/10 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-[0_0_12px_rgba(255,77,157,0.45)] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          aria-label="送信"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
