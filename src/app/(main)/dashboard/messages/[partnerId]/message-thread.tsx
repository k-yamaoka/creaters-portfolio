"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessage, markAsRead } from "../actions";
import { createClient } from "@/lib/supabase/client";

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
};

const NEAR_BOTTOM_PX = 120;

export function MessageThread({
  initialMessages,
  currentUserId,
  partnerId,
  compact = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialScrollDone = useRef(false);
  const sentByMeFlag = useRef(false);
  const composingRef = useRef(false);

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
      // 同 ID は無視
      if (prev.some((m) => m.id === incoming.id)) return prev;
      // 楽観挿入(temp) と内容一致するものを差し替え
      const tempMatchIdx = prev.findIndex(
        (m) =>
          m.id.startsWith("temp-") &&
          m.sender_id === incoming.sender_id &&
          m.content === incoming.content
      );
      if (tempMatchIdx >= 0) {
        const next = [...prev];
        next[tempMatchIdx] = incoming;
        return next;
      }
      return [...prev, incoming].sort((a, b) =>
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

    if (result?.error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      setError(result.error);
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
      <div className="border-t border-ink/10 pt-4">
        {error && (
          <p className="mb-2 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
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
