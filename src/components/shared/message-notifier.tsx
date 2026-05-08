"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Toast = {
  id: string;
  senderName: string;
  senderId: string;
  content: string;
};

type Payload = {
  new: {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
  };
};

const TOAST_TTL_MS = 6000;

export function MessageNotifier({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const channel = supabase
      .channel(`messages:receiver:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const msg = (payload as unknown as Payload).new;
          if (!msg) return;

          if (typeof window !== "undefined") {
            const path = window.location.pathname;
            if (path === `/dashboard/messages/${msg.sender_id}`) {
              router.refresh();
              return;
            }
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", msg.sender_id)
            .single();

          const senderName = profile?.display_name ?? "ユーザー";

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.visibilityState !== "visible"
          ) {
            try {
              new Notification(`${senderName} さんから新着メッセージ`, {
                body: msg.content.slice(0, 140),
                tag: `msg-${msg.sender_id}`,
                icon: "/favicon.ico",
              });
            } catch {
              // ignore
            }
          }

          const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`;

          setToasts((prev) => [
            ...prev,
            {
              id,
              senderName,
              senderId: msg.sender_id,
              content: msg.content,
            },
          ]);

          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
          }, TOAST_TTL_MS);

          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[100] flex flex-col gap-3">
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          onDismiss={() =>
            setToasts((prev) => prev.filter((x) => x.id !== t.id))
          }
        />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="pointer-events-auto relative w-[340px] animate-toast-in border border-ink bg-paper p-4 shadow-[6px_6px_0_0_rgba(26,26,26,1)]"
    >
      <Link
        href={`/dashboard/messages/${toast.senderId}`}
        onClick={onDismiss}
        className="flex items-start gap-3"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary-500 font-display text-sm font-medium text-white">
          {toast.senderName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-display text-sm font-medium text-ink">
              {toast.senderName}
            </p>
            <span className="font-display text-[10px] uppercase tracking-[0.25em] text-primary-500">
              New
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-[1.6] text-ink-muted">
            {toast.content}
          </p>
          <p className="mt-2 font-display text-[10px] uppercase tracking-[0.25em] text-ink-soft">
            tap to reply →
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="閉じる"
        className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-ink-muted transition-colors hover:text-ink"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
