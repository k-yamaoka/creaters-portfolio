import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import Link from "next/link";
import { markAsRead } from "../actions";
import { MessageThread } from "./message-thread";
import { ApplicationActions } from "@/components/messages/application-actions";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const supabase = await createClient();

  // パートナー情報
  const { data: partner } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role")
    .eq("id", partnerId)
    .single();

  if (!partner) redirect("/dashboard/messages");

  // 二者間の全メッセージ
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${me.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${me.id})`
    )
    .order("created_at", { ascending: true });

  await markAsRead(partnerId);

  // 自分が企業 & 相手がクリエイターのとき: 自分のジョブへの pending 応募を引く
  let pendingApplication: {
    id: string;
    job_id: string;
    job_title: string;
  } | null = null;

  if (
    me.role === "client" &&
    me.client_profile &&
    partner.role === "creator"
  ) {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", partnerId)
      .single();

    if (creatorProfile) {
      const { data: app } = await supabase
        .from("job_applications")
        .select(
          `
          id, job_id,
          job:jobs!job_applications_job_id_fkey ( id, title, client_id )
        `
        )
        .eq("creator_id", creatorProfile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      const myApps = (app ?? []).filter((a) => {
        const j = a.job as unknown as { client_id: string } | null;
        return j?.client_id === me.client_profile!.id;
      });
      if (myApps.length > 0) {
        const top = myApps[0];
        const job = top.job as unknown as { id: string; title: string };
        pendingApplication = {
          id: top.id,
          job_id: job.id,
          job_title: job.title,
        };
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#F2F2F2] pb-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/messages"
            className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-[#828282] hover:bg-[#F2F2F2]"
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
            {/* 企業側のみ: 採用/不採用ボタン (pending応募がある場合) */}
            {pendingApplication && (
              <div className="mt-2">
                <ApplicationActions
                  applicationId={pendingApplication.id}
                  jobId={pendingApplication.job_id}
                  jobTitle={pendingApplication.job_title}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages + Input */}
      <MessageThread
        initialMessages={messages ?? []}
        currentUserId={me.id}
        partnerId={partnerId}
        senderRole={me.role}
      />
    </div>
  );
}
