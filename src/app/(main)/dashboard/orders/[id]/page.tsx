import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";
import { STATUS_FLOW, STATUS_META, getStatusMeta } from "@/lib/order-status";
import Link from "next/link";
import { OrderActions } from "./order-actions";
import { ReviewForm } from "./review-form";
import { MessageThread } from "../../messages/[partnerId]/message-thread";
import { markAsRead } from "../../messages/actions";
import {
  EditingRequirements,
  type EditingRequirementsData,
} from "@/components/shared/editing-requirements";

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
      ),
      package:service_packages ( name, description, price, delivery_days, revisions, features )
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
  const creatorData = order.creator as unknown as {
    id: string;
    user_id: string;
    profiles: { display_name: string };
  };
  const clientData = order.client as unknown as {
    id: string;
    user_id: string;
    profiles: { display_name: string };
  };
  const pkg = order.package as unknown as {
    name: string;
    description: string;
    price: number;
    delivery_days: number;
    revisions: number;
    features: string[];
  } | null;

  const status = getStatusMeta(order.status);
  const currentStepIndex = STATUS_FLOW.indexOf(
    order.status as (typeof STATUS_FLOW)[number]
  );
  const partnerUserId = isCreator ? clientData.user_id : creatorData.user_id;
  const partnerName = isCreator
    ? clientData.profiles.display_name
    : creatorData.profiles.display_name;

  // 二者間の全メッセージを取得 (左メニュー「メッセージ」と完全同期)
  const { data: threadMessages } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerUserId}),and(sender_id.eq.${partnerUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  // 既読化
  await markAsRead(partnerUserId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/orders"
            className="text-sm text-[#828282] hover:text-primary-500"
          >
            &larr; 取引一覧に戻る
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[#222]">
            {order.title}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-[#828282]">
            <span
              className={`rounded-pill px-3 py-1 text-xs font-bold ${status.color}`}
            >
              {status.shortLabel}
            </span>
            <span>{order.order_number}</span>
            <span>
              {new Date(order.created_at).toLocaleDateString("ja-JP")}
            </span>
          </div>
        </div>
      </div>

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
                        ? "bg-primary-500 text-white"
                        : isCompleted
                          ? "bg-primary-100 text-primary-600"
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
                      i < currentStepIndex ? "bg-primary-300" : "bg-[#F2F2F2]"
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
            />
          )}

          {/* レビュー投稿フォーム - 検収完了かつレビュー未投稿のクライアントのみ */}
          {isFullyCompleted && !isCreator && !hasReview && (
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
          {/* Package info */}
          {pkg && (
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <h2 className="text-sm font-bold text-[#828282]">選択プラン</h2>
              <p className="mt-1 font-bold text-[#222]">{pkg.name}</p>
              <p className="mt-1 text-sm text-[#828282]">{pkg.description}</p>
              <div className="mt-3 flex gap-3 text-xs text-[#828282]">
                <span>納期 {pkg.delivery_days}日</span>
                <span>修正 {pkg.revisions}回</span>
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-sm font-bold text-[#828282]">料金内訳</h2>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#4F4F4F]">合計金額</span>
                <span className="font-bold text-[#222]">
                  {formatPrice(order.total_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#4F4F4F]">手数料(15%)</span>
                <span className="text-[#828282]">
                  {formatPrice(order.platform_fee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#F2F2F2] pt-2 text-sm">
                <span className="text-[#4F4F4F]">クリエイター受取額</span>
                <span className="font-bold text-primary-500">
                  {formatPrice(order.creator_payout)}
                </span>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-sm font-bold text-[#828282]">取引相手</h2>
            <p className="mt-2 font-bold text-[#222]">{partnerName}</p>
            <Link
              href={`/dashboard/messages/${partnerUserId}`}
              className="btn-secondary mt-3 w-full text-sm"
            >
              フルスクリーンで開く
            </Link>
          </div>
        </div>
      </div>

      {/* ==============================
          下部メッセージパネル (左メニュー「メッセージ」と同期)
          ============================== */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between border-b border-[#F2F2F2] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
              {partnerName[0]}
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
            className="text-xs font-medium text-primary-500 hover:underline"
          >
            別画面で開く →
          </Link>
        </div>
        <MessageThread
          initialMessages={threadMessages ?? []}
          currentUserId={user.id}
          partnerId={partnerUserId}
          senderRole={user.role}
          compact
        />
      </div>
    </div>
  );
}
