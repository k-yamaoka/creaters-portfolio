"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendMessage, markAsRead } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { templatesFor, type MessageTemplate } from "@/lib/message-templates";

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
};

type Props = {
  initialMessages: Message[];
  currentUserId: string;
  partnerId: string;
  /** 高さの抑制（order詳細埋め込み等） */
  compact?: boolean;
  /** 自分のロール（テンプレート出し分け） */
  senderRole?: "creator" | "client" | "admin";
};

const NEAR_BOTTOM_PX = 120;

export function MessageThread({
  initialMessages,
  currentUserId,
  partnerId,
  compact = false,
  senderRole,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const templates = useMemo(() => templatesFor(senderRole), [senderRole]);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDone = useRef(false);
  const sentByMeFlag = useRef(false);
  const composingRef = useRef(false);

  const insertTemplate = (t: MessageTemplate) => {
    setInput(t.body);
    setTemplatesOpen(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 240) + "px";
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };

  // 初期マウント時: アニメ無しで最下部にジャンプ
  useEffect(() => {
    const c = containerRef.current;
    if (c && !initialScrollDone.current) {
      c.scrollTop = c.scrollHeight;
      initialScrollDone.current = true;
    }
  }, []);

  // メッセージ追加時: 自分送信 or 既に最下部付近なら追従
  useEffect(() => {
    if (!initialScrollDone.current) return;
    const c = containerRef.current;
    if (!c) return;
    const distanceFromBottom = c.scrollHeight - c.scrollTop - c.clientHeight;
    const isNearBottom = distanceFromBottom < NEAR_BOTTOM_PX;
    if (sentByMeFlag.current || isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      sentByMeFlag.current = false;
    }
  }, [messages]);

  const mergeMessage = useCallback((incoming: Message) => {
    setMessages((prev) => {
      // 既に同 ID が存在する場合は無視 (自分送信は sendMessage の戻り値で先に差し替え済み)
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming].sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      );
    });
  }, []);

  const replaceTemp = useCallback((tempId: string, real: Message) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === tempId);
      if (idx === -1) {
        // temp が見つからない (realtime が先着) → ID 重複なら何もしない、無ければ追加
        if (prev.some((m) => m.id === real.id)) return prev;
        return [...prev, real].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        );
      }
      // 既に realtime で real が入っていたら temp だけ消す
      const realAlreadyIn = prev.some(
        (m, i) => i !== idx && m.id === real.id
      );
      const next = prev.filter((_, i) => i !== idx);
      if (!realAlreadyIn) next.push(real);
      return next.sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      );
    });
  }, []);

  // Realtime: 自分宛(相手→自分) と 自分発(自分→相手) 双方を購読
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread:${currentUserId}:${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== partnerId) return;
          mergeMessage(msg);
          await markAsRead(partnerId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.receiver_id !== partnerId) return;
          mergeMessage(msg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, partnerId, mergeMessage]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: partnerId,
      content: text,
      created_at: new Date().toISOString(),
    };
    sentByMeFlag.current = true;
    setMessages((prev) => [...prev, optimistic]);

    const fd = new FormData();
    fd.set("receiver_id", partnerId);
    fd.set("content", text);
    const result = await sendMessage(fd);

    if ("error" in result) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      setError(result.error);
    } else {
      replaceTemp(tempId, {
        id: result.message.id,
        sender_id: result.message.sender_id,
        receiver_id: result.message.receiver_id,
        content: result.message.content,
        created_at: result.message.created_at,
        is_read: result.message.is_read,
      });
    }
    setSending(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (composingRef.current) return; // IME変換中は無視
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div className={`flex flex-col ${compact ? "h-[520px]" : "h-full min-h-0"}`}>
      {/* メッセージリスト */}
      <div ref={containerRef} className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-ink-soft">
              メッセージを送って会話を始めましょう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              const isTemp = msg.id.startsWith("temp-");
              const time = new Date(msg.created_at).toLocaleTimeString(
                "ja-JP",
                { hour: "2-digit", minute: "2-digit" }
              );
              const date = new Date(msg.created_at).toLocaleDateString(
                "ja-JP",
                { month: "short", day: "numeric" }
              );

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? `bg-primary-500 text-white ${isTemp ? "opacity-70" : ""}`
                        : "bg-white text-ink shadow-card"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        isMine ? "text-white/60" : "text-ink-soft"
                      }`}
                    >
                      {date} {time}
                      {isTemp && " · 送信中…"}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 入力 */}
      <div className="relative border-t border-ink/10 pt-4">
        {error && (
          <p className="mb-2 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}

        {/* テンプレポップオーバー */}
        {templatesOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setTemplatesOpen(false)}
            />
            <div className="absolute bottom-full left-0 z-50 mb-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-ink bg-white shadow-[6px_6px_0_0_rgba(26,26,26,1)]">
              <div className="border-b border-ink/15 px-4 py-2">
                <p className="font-display text-sm font-medium text-ink">
                  返信テンプレート
                </p>
                <p className="text-[10px] text-ink-soft">
                  {senderRole === "client"
                    ? "企業向け定型文"
                    : "クリエイター向け定型文"}
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => insertTemplate(t)}
                    className="block w-full border-b border-ink/10 px-4 py-3 text-left transition-colors last:border-0 hover:bg-paper-deep"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">
                        {t.category}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {t.title}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                      {t.body.split("\n")[0]}
                    </p>
                  </button>
                ))}
              </div>
              <div className="border-t border-ink/15 px-4 py-2 text-[10px] text-ink-soft">
                クリックすると入力欄に挿入されます ({"{}"} 内は編集して送信)
              </div>
            </div>
          </>
        )}

        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTemplatesOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-md border border-ink/20 px-3 py-1.5 text-xs font-medium transition-colors ${
              templatesOpen
                ? "bg-ink text-paper"
                : "bg-white text-ink hover:border-ink hover:bg-paper-deep"
            }`}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
              />
            </svg>
            返信テンプレ
          </button>
        </div>

        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize(e.currentTarget);
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={() => {
              composingRef.current = false;
            }}
            placeholder="メッセージを入力 (Enter送信 / Shift+Enter改行)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-ink/20 bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            aria-label="送信"
          >
            <svg
              className="h-5 w-5"
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
        </div>
      </div>
    </div>
  );
}
