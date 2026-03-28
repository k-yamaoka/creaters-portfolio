"use client";

import { useRef, useEffect, useState } from "react";
import { sendMessage } from "../actions";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export function MessageThread({
  messages,
  currentUserId,
  partnerId,
}: {
  messages: Message[];
  currentUserId: string;
  partnerId: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (formData: FormData) => {
    if (!input.trim()) return;
    setSending(true);
    formData.set("receiver_id", partnerId);
    await sendMessage(formData);
    setInput("");
    setSending(false);
  };

  return (
    <>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#BDBDBD]">
              メッセージを送って会話を始めましょう
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
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
                        ? "bg-primary-500 text-white"
                        : "bg-white text-[#222] shadow-card"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        isMine ? "text-white/60" : "text-[#BDBDBD]"
                      }`}
                    >
                      {date} {time}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex gap-3 border-t border-[#F2F2F2] pt-4"
      >
        <input type="hidden" name="receiver_id" value={partnerId} />
        <input
          name="content"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 rounded-xl border border-[#E0E0E0] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
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
      </form>
    </>
  );
}
