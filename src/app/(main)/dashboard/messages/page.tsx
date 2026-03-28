import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get all messages involving the current user
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // Group by conversation partner
  const conversations = new Map<
    string,
    { partnerId: string; lastMessage: string; lastAt: string; unread: number }
  >();

  for (const msg of messages ?? []) {
    const partnerId =
      msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partnerId,
        lastMessage: msg.content,
        lastAt: msg.created_at,
        unread: 0,
      });
    }

    if (msg.receiver_id === user.id && !msg.is_read) {
      const conv = conversations.get(partnerId)!;
      conv.unread++;
    }
  }

  // Get partner profiles
  const partnerIds = Array.from(conversations.keys());
  let partners: Record<string, { display_name: string; avatar_url: string | null }> = {};

  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", partnerIds);

    for (const p of profiles ?? []) {
      partners[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url };
    }
  }

  const convList = Array.from(conversations.values());

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">メッセージ</h1>
      <p className="mt-2 text-sm text-[#828282]">
        クリエイター・クライアントとのやりとり
      </p>

      <div className="mt-6">
        {convList.length === 0 ? (
          <div className="rounded-2xl bg-white py-16 text-center shadow-card">
            <svg
              className="mx-auto h-12 w-12 text-[#E0E0E0]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-bold text-[#222]">
              まだメッセージはありません
            </h3>
            <p className="mt-2 text-sm text-[#828282]">
              クリエイターのページから「メッセージを送る」で会話を始めましょう
            </p>
            <Link href="/creators" className="btn-primary mt-6 inline-block text-sm">
              クリエイターを探す
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {convList.map((conv) => {
              const partner = partners[conv.partnerId];
              const name = partner?.display_name ?? "ユーザー";
              const initial = name[0];
              const timeStr = new Date(conv.lastAt).toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Link
                  key={conv.partnerId}
                  href={`/dashboard/messages/${conv.partnerId}`}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#222]">{name}</h3>
                      <span className="text-xs text-[#BDBDBD]">{timeStr}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[#828282]">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[11px] font-bold text-white">
                      {conv.unread}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
