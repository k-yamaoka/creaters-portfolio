import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatDateJP } from "@/lib/utils";
import { ClientBillingBreakdown } from "@/components/order/client-billing-breakdown";
import { CreatorEarningsDisplay } from "@/components/order/creator-earnings-display";
import { STATUS_FLOW, STATUS_META, getStatusMeta } from "@/lib/order-status";
import Link from "next/link";
import { OrderActions } from "./order-actions";
import { ReviewForm } from "./review-form";
import { MessageThread } from "../../messages/[partnerId]/message-thread";
import { OrderTodoBanner } from "@/components/messages/order-todo-banner";
import { markAsRead } from "../../messages/actions";
import {
  EditingRequirements,
  type EditingRequirementsData,
} from "@/components/shared/editing-requirements";
import { PrePaymentAlert } from "@/components/orders/pre-payment-alert";
import { DisputeStatusBadge } from "@/components/orders/dispute-status-badge";
import { evaluateRevisionState } from "@/lib/order-flow";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      creator:creator_profiles!orders_creator_id_fkey (
        id, user_id,
        profiles!creator_profiles_user_id_fkey ( display_name )
      ),
      client:client_profiles!orders_client_id_fkey (
        id, user_id,
        profiles!client_profiles_user_id_fkey ( display_name )
      )
    `
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  // 検収完了 (= delivered + escrow released) でレビュー対象
  const isFullyCompleted =
    order.status === "delivered" && order.escrow_status === "released";
  let hasReview = false;
  if (isFullyCompleted) {
    const { data: review } = await supabase
      .from("reviews")
      .select("id")
      .eq("order_id", id)
      .single();
    hasReview = !!review;
  }

  const isCreator = user.role === "creator";
  // 退会者がいる場合は creator/client が null になる (FK ON DELETE SET NULL)
  const creatorData = order.creator as unknown as {
    id: string;
    user_id: string;
    profiles: { display_name: string };
  } | null;
  const clientData = order.client as unknown as {
    id: string;
    user_id: string;
    profiles: { display_name: string };
  } | null;
  // 料金プラン (service_packages) は 00050 で撤去済

  const status = getStatusMeta(order.status);
  const currentStepIndex = STATUS_FLOW.indexOf(
    order.status as (typeof STATUS_FLOW)[number]
  );
  // partner が退会済みの場合は archived_*_user_id を fallback として使う
  const partnerUserId = isCreator
    ? clientData?.user_id ?? order.archived_client_user_id
    : creatorData?.user_id ?? order.archived_creator_user_id;
  const partnerName = isCreator
    ? clientData?.profiles.display_name ?? "(退会済みのクライアント)"
    : creatorData?.profiles.display_name ?? "(退会済みのクリエイター)";

  // 二者間のメッセージを取得 (左メニュー「メッセージ」と同期)。
  // 過去取引のメッセージ混入を防ぐため、この取引の前にあった "最新の応募" の
  // created_at を anchor として使う (応募開始 〜 受注 までの相談メッセージも含めるため)。
  // 該当応募がなければ order.created_at を anchor にする。
  // partner が退会済みで user_id が引けない場合はメッセージ取得不能なのでスキップする。
  let threadMessages: unknown[] | null = null;
  if (partnerUserId && creatorData && clientData) {
    let anchorAt: string = order.created_at;
    const { data: priorApp } = await supabase
      .from("job_applications")
      .select(
        "created_at, job:jobs!job_applications_job_id_fkey ( client_id )"
      )
      .eq("creator_id", creatorData.id)
      .lte("created_at", order.created_at)
      .order("created_at", { ascending: false });
    const matched = (priorApp ?? []).find((a) => {
      const j = a.job as unknown as { client_id: string } | null;
      return j?.client_id === clientData.id;
    });
    if (matched) anchorAt = matched.created_at;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerUserId}),and(sender_id.eq.${partnerUserId},receiver_id.eq.${user.id})`
      )
      .gte("created_at", anchorAt)
      .order("created_at", { ascending: true });
    threadMessages = data;
    await markAsRead(partnerUserId);
  } else if (partnerUserId) {
    // 相手が退会済みなど creatorData/clientData が null のときは anchor が引けない。
    // フォールバックで全件取る (退会後の表示なので過去取引引き継ぎ問題は実害が小さい)。
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${partnerUserId}),and(sender_id.eq.${partnerUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    threadMessages = data;
    await markAsRead(partnerUserId);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/orders"
            className="text-sm text-[#828282] hover:text-neon-pink"
          >
            &larr; 取引一覧に戻る
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[#222]">
            {order.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#828282]">
            <span
              className={`rounded-pill px-3 py-1 text-xs font-bold ${status.color}`}
            >
              {status.shortLabel}
            </span>
            <span>{order.order_number}</span>
            <span>{formatDateJP(order.created_at)}</span>
            {/* 00071: 運営裁定中バッジ (受付済/確認中/対応完了) */}
            {order.active_dispute_id && (
              <DisputeAdminBadge disputeId={order.active_dispute_id} />
            )}
          </div>
        </div>
      </div>

      {/* 00071: 仮払い前アラート (escrow が held/released 以外のとき常時表示) */}
      <div className="mt-4">
        <PrePaymentAlert
          escrowStatus={order.escrow_status}
          isCreator={isCreator}
        />
      </div>

      {/* 00071: 修正回数の警告 (revision_count_used が上限直前/超過) */}
      {(() => {
        const rev = evaluateRevisionState(
          order.revision_count_used ?? 0,
          order.max_revisions ?? 1
        );
        if (!rev.warning) return null;
        return (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-bold">修正回数のお知らせ</p>
            <p className="mt-1 text-xs leading-relaxed">
              {rev.warning}
            </p>
            <p className="mt-1.5 text-[11px] text-amber-800">
              使用済み {rev.used} / 合意上限 {rev.max}
            </p>
          </div>
        );
      })()}

      {/* Progress bar */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          {STATUS_FLOW.map((step, i) => {
            const stepInfo = STATUS_META[step];
            const isCompleted = i <= currentStepIndex;
            const isCurrent = step === order.status;

            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    title={stepInfo.description}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? "bg-gradient-to-r from-neon-pink to-neon-purple text-white"
                        : isCompleted
                          ? "bg-neon-purple/15 text-neon-purple-deep"
                          : "bg-[#F2F2F2] text-[#BDBDBD]"
                    }`}
                  >
                    {isCompleted && !isCurrent ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="mt-1 hidden text-[10px] text-[#828282] sm:block">
                    {stepInfo.shortLabel}
                  </span>
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 ${
                      i < currentStepIndex ? "bg-neon-purple/40" : "bg-[#F2F2F2]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-[#222]">依頼内容</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#4F4F4F]">
              {order.description || "詳細なし"}
            </p>
          </div>

          {/* 編集要件 */}
          <EditingRequirements
            data={{
              footage_minutes: order.footage_minutes ?? null,
              finish_duration_unit: (order.finish_duration_unit as
                | "sec"
                | "min"
                | null) ?? null,
              finish_duration_min: order.finish_duration_min ?? null,
              finish_duration_max: order.finish_duration_max ?? null,
              count_min: order.count_min ?? null,
              count_max: order.count_max ?? null,
              work_types: order.work_types ?? [],
              revision_count: order.revision_count ?? null,
              software_options: order.software_options ?? [],
              delivery_formats: order.delivery_formats ?? [],
              delivery_days: order.delivery_days ?? null,
              reference_url: order.reference_url ?? null,
              is_recurring: !!order.is_recurring,
              monthly_count: order.monthly_count ?? null,
              client_type: order.client_type ?? null,
            } satisfies EditingRequirementsData}
          />

          {/* Actions */}
          {order.status !== "cancelled" && !isFullyCompleted && (
            <OrderActions
              orderId={order.id}
              currentStatus={order.status}
              escrowStatus={order.escrow_status}
              isCreator={isCreator}
              hasStripeKey={!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
              basePrice={order.base_price ?? 0}
              activeDisputeId={order.active_dispute_id}
              terminatedAt={order.terminated_at}
            />
          )}

          {/* A-4: キャンセル済 order の snapshot 表示 */}
          {order.status === "cancelled" && order.cancel_stage && (
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <h2 className="text-lg font-bold text-red-800">
                キャンセル済み
              </h2>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-red-700/70">段階</dt>
                  <dd className="font-medium text-red-900">
                    {order.cancel_stage === "pre_start"
                      ? "着手前 (0%)"
                      : order.cancel_stage === "in_progress"
                        ? "制作中 (50%)"
                        : "納品後 (100%)"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-red-700/70">クライアント返金</dt>
                  <dd className="font-mono tabular-nums text-red-900">
                    ¥{(order.cancel_refund_amount ?? 0).toLocaleString("ja-JP")}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-red-700/70">クリエイター補償</dt>
                  <dd className="font-mono tabular-nums text-red-900">
                    ¥{(order.cancel_creator_payout ?? 0).toLocaleString("ja-JP")}
                  </dd>
                </div>
                {order.cancel_reason && (
                  <div className="mt-2 border-t border-red-200 pt-2">
                    <dt className="text-xs text-red-700/70">理由</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-xs text-red-900">
                      {order.cancel_reason}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* レビュー投稿フォーム - 検収完了かつレビュー未投稿のクライアントのみ。
              退会済みクリエイター/クライアント (creator_id / client_id が NULL) の
              取引にはレビュー機能を出さない */}
          {isFullyCompleted &&
            !isCreator &&
            !hasReview &&
            creatorData &&
            clientData && (
              <ReviewForm
                orderId={order.id}
                creatorId={creatorData.id}
                clientId={clientData.id}
              />
            )}

          {isFullyCompleted && hasReview && (
            <div className="rounded-2xl bg-green-50 p-6 text-center">
              <p className="text-sm font-bold text-green-700">レビュー投稿済み</p>
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          {/* 旧 選択プラン カードは料金プラン撤去 (00050) で削除 */}

          {/* 00065: ロール別 金額表示
              - client: 明細を透明性高く (base + 15% = total)
              - creator: 受取予定額だけシンプルに */}
          {isCreator ? (
            <CreatorEarningsDisplay
              creatorPayout={order.creator_payout ?? 0}
              status={
                order.escrow_status === "released"
                  ? "settled"
                  : order.status === "delivered"
                    ? "delivered"
                    : order.escrow_status === "held"
                      ? "escrowed"
                      : "pending"
              }
            />
          ) : (
            <ClientBillingBreakdown
              basePrice={
                (order.base_price as number | null | undefined) ??
                order.creator_payout ??
                0
              }
              systemFeeOverride={order.platform_fee ?? undefined}
              totalAmountOverride={order.total_amount ?? undefined}
            />
          )}

          {/* Participants */}
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-sm font-bold text-[#828282]">取引相手</h2>
            <p className="mt-2 font-bold text-[#222]">{partnerName}</p>
            {partnerUserId ? (
              <Link
                href={`/dashboard/messages/${partnerUserId}`}
                className="btn-secondary mt-3 w-full text-sm"
              >
                フルスクリーンで開く
              </Link>
            ) : (
              <p className="mt-3 text-xs text-[#BDBDBD]">
                相手が退会済みのためメッセージはできません
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ==============================
          下部メッセージパネル (左メニュー「メッセージ」と同期)
          相手が退会済みの場合は表示しない
          ============================== */}
      {partnerUserId && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-3 flex items-center justify-between border-b border-[#F2F2F2] pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-purple/15 text-sm font-bold text-neon-purple-deep">
                {partnerName[0] ?? "?"}
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#222]">
                  {partnerName} とのメッセージ
                </h2>
                <p className="text-xs text-[#828282]">
                  左メニューの「メッセージ」と同期されています
                </p>
              </div>
            </div>
            <Link
              href={`/dashboard/messages/${partnerUserId}`}
              className="text-xs font-medium text-neon-purple-deep hover:underline"
            >
              別画面で開く →
            </Link>
          </div>
          <MessageThread
            initialMessages={(threadMessages ?? []) as never}
            currentUserId={user.id}
            partnerId={partnerUserId}
            senderRole={user.role}
            compact
            footerSlot={
              user.role === "client" || user.role === "creator" ? (
                <OrderTodoBanner
                  orderId={order.id}
                  orderTitle={order.title}
                  status={order.status}
                  viewerRole={user.role}
                />
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
}

/**
 * 運営裁定バッジ (00071)。dispute.admin_status のみ SELECT し UI に反映。
 * internal_note は RLS 上 SELECT 不可 (definer view でも隠蔽) なので
 * ここで取得しても返らない。
 */
async function DisputeAdminBadge({ disputeId }: { disputeId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("disputes")
    .select("admin_status")
    .eq("id", disputeId)
    .maybeSingle();
  const s = data?.admin_status as
    | "received"
    | "reviewing"
    | "resolved"
    | undefined;
  if (!s) return null;
  return <DisputeStatusBadge status={s} />;
}
