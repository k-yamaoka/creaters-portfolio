import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import Link from "next/link";
import { markAsRead } from "../actions";
import { MessageThread } from "./message-thread";
import { RefreshOnMount } from "./refresh-on-mount";
import { ApplicationActions } from "@/components/messages/application-actions";
import { OrderTodoBanner } from "@/components/messages/order-todo-banner";
import {
  EditingRequirementsCollapsible,
  type EditingRequirementsData,
} from "@/components/shared/editing-requirements";

type JobRequirementsRow = {
  id: string;
  title: string;
  footage_minutes: number | null;
  finish_duration_unit: string | null;
  finish_duration_min: number | null;
  finish_duration_max: number | null;
  count_min: number | null;
  count_max: number | null;
  work_types: string[] | null;
  revision_count: number | null;
  software_options: string[] | null;
  delivery_formats: string[] | null;
  delivery_days: number | null;
  reference_url: string | null;
  is_recurring: boolean | null;
  monthly_count: number | null;
  client_type: string | null;
};

const JOB_REQUIREMENT_FIELDS =
  "id, title, footage_minutes, finish_duration_unit, finish_duration_min, finish_duration_max, count_min, count_max, work_types, revision_count, software_options, delivery_formats, delivery_days, reference_url, is_recurring, monthly_count, client_type";

function toRequirementsData(job: JobRequirementsRow): EditingRequirementsData {
  return {
    footage_minutes: job.footage_minutes ?? null,
    finish_duration_unit:
      job.finish_duration_unit === "sec" || job.finish_duration_unit === "min"
        ? job.finish_duration_unit
        : null,
    finish_duration_min: job.finish_duration_min ?? null,
    finish_duration_max: job.finish_duration_max ?? null,
    count_min: job.count_min ?? null,
    count_max: job.count_max ?? null,
    work_types: job.work_types ?? [],
    revision_count: job.revision_count ?? null,
    software_options: job.software_options ?? [],
    delivery_formats: job.delivery_formats ?? [],
    delivery_days: job.delivery_days ?? null,
    reference_url: job.reference_url ?? null,
    is_recurring: !!job.is_recurring,
    monthly_count: job.monthly_count ?? null,
    client_type: job.client_type ?? null,
  };
}

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

  // 両者間の最新応募 (status 問わず) を引き、その応募の created_at を
  // 「現在の会話の開始点 (anchor)」として使う。
  // anchor 以降のメッセージのみ表示することで、過去の取引メッセージが
  // 新しい応募の会話に引き継がれないようにする。
  // ついでに contextJob (取引中の編集要件) もこの応募から派生して取り出す。
  let contextJob: JobRequirementsRow | null = null;
  let threadAnchorAt: string | null = null;
  {
    const clientUserId = me.role === "client" ? me.id : partnerId;
    const creatorUserId = me.role === "creator" ? me.id : partnerId;

    const { data: cp } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", clientUserId)
      .single();
    const { data: crp } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", creatorUserId)
      .single();

    if (cp && crp) {
      const { data: app } = await supabase
        .from("job_applications")
        .select(
          `id, status, created_at,
           job:jobs!job_applications_job_id_fkey ( ${JOB_REQUIREMENT_FIELDS}, client_id )`
        )
        .eq("creator_id", crp.id)
        .order("created_at", { ascending: false });

      const matches = (app ?? []).filter((a) => {
        const j = a.job as unknown as { client_id: string } | null;
        return j?.client_id === cp.id;
      });
      // 最新応募の created_at を anchor に
      if (matches.length > 0) {
        threadAnchorAt = matches[0].created_at;
      }
      // 編集要件表示用: 進行中 (pending/accepted) の最新応募
      const live = matches.find(
        (a) => a.status === "pending" || a.status === "accepted"
      );
      if (live) {
        contextJob = live.job as unknown as JobRequirementsRow;
      }
    }
  }

  // 二者間のメッセージ (anchor 以降のみ)
  let messagesQuery = supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${me.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${me.id})`
    )
    .order("created_at", { ascending: true });
  if (threadAnchorAt) {
    messagesQuery = messagesQuery.gte("created_at", threadAnchorAt);
  }
  const { data: messages } = await messagesQuery;

  await markAsRead(partnerId);

  // 二者間の現在進行中の order を 1 件取得 (やること バナー用)
  let activeOrder:
    | { id: string; title: string; status: string }
    | null = null;
  {
    const clientUserId = me.role === "client" ? me.id : partnerId;
    const creatorUserId = me.role === "creator" ? me.id : partnerId;
    const { data: cp } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", clientUserId)
      .maybeSingle();
    const { data: crp } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", creatorUserId)
      .maybeSingle();
    if (cp && crp) {
      // 進行中ステータス優先で 1 件取り出す
      const { data: orders } = await supabase
        .from("orders")
        .select("id, title, status, updated_at")
        .eq("client_id", cp.id)
        .eq("creator_id", crp.id)
        .order("updated_at", { ascending: false })
        .limit(5);
      // cancelled は最後の手段
      const live = (orders ?? []).find((o) => o.status !== "cancelled");
      const pick = live ?? orders?.[0] ?? null;
      if (pick) {
        activeOrder = { id: pick.id, title: pick.title, status: pick.status };
      }
    }
  }

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
    // ヘッダー + Footer を引いた高さで限界までチャット領域を確保。
    // 視認性のため最低 640px を確保し、上限も 1000px まで広げる。
    <div className="flex h-[min(calc(100svh-14rem),1000px)] min-h-[640px] flex-col pb-4">
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

      {/* 取引中の編集要件 (常時表示・折りたたみ可) */}
      {contextJob && (
        <div className="mt-4">
          <EditingRequirementsCollapsible
            data={toRequirementsData(contextJob)}
            jobTitle={contextJob.title}
            jobHref={`/jobs/${contextJob.id}`}
          />
        </div>
      )}

      {/* Messages + Input */}
      <MessageThread
        initialMessages={messages ?? []}
        currentUserId={me.id}
        partnerId={partnerId}
        senderRole={me.role}
        footerSlot={
          activeOrder && (me.role === "client" || me.role === "creator") ? (
            <OrderTodoBanner
              orderId={activeOrder.id}
              orderTitle={activeOrder.title}
              status={activeOrder.status}
              viewerRole={me.role}
            />
          ) : null
        }
      />

      {/* マウント時に layout を再フェッチして未読バッジを 0 にする */}
      <RefreshOnMount />
    </div>
  );
}
