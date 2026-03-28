import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { markAsRead } from "../actions";
import { MessageThread } from "./message-thread";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get partner info
  const { data: partner } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("id", partnerId)
    .single();

  if (!partner) redirect("/dashboard/messages");

  // Get messages between the two users
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  // Mark unread messages as read
  await markAsRead(partnerId);

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#F2F2F2] pb-4">
        <Link
          href="/dashboard/messages"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#828282] hover:bg-[#F2F2F2]"
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
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </Link>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
          {partner.display_name[0]}
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#222]">
            {partner.display_name}
          </h2>
          <p className="text-xs text-[#828282]">
            {partner.role === "creator" ? "クリエイター" : "クライアント"}
          </p>
        </div>
      </div>

      {/* Messages + Input */}
      <MessageThread
        messages={messages ?? []}
        currentUserId={user.id}
        partnerId={partnerId}
      />
    </div>
  );
}
