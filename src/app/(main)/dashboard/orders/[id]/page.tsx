import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { OrderActions } from "./order-actions";
import { ReviewForm } from "./review-form";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  inquiry: { label: "相談中", color: "bg-blue-100 text-blue-700" },
  quoted: { label: "見積済", color: "bg-purple-100 text-purple-700" },
  accepted: { label: "受注済", color: "bg-indigo-100 text-indigo-700" },
  paid: { label: "仮払済", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "制作中", color: "bg-orange-100 text-orange-700" },
  delivered: { label: "納品済", color: "bg-teal-100 text-teal-700" },
  revision: { label: "修正依頼", color: "bg-pink-100 text-pink-700" },
  completed: { label: "完了", color: "bg-green-100 text-green-700" },
  cancelled: { label: "キャンセル", color: "bg-gray-100 text-gray-500" },
};

const STATUS_FLOW = [
  "inquiry",
  "quoted",
  "accepted",
  "paid",
  "in_progress",
  "delivered",
  "completed",
];

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

  // Check if review exists
  let hasReview = false;
  if (order.status === "completed") {
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

  const status = STATUS_LABELS[order.status] ?? {
    label: order.status,
    color: "bg-gray-100 text-gray-500",
  };

  const currentStepIndex = STATUS_FLOW.indexOf(order.status);
  const partnerUserId = isCreator ? clientData.user_id : creatorData.user_id;

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
              {status.label}
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
            const stepInfo = STATUS_LABELS[step];
            const isCompleted = i <= currentStepIndex;
            const isCurrent = step === order.status;

            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
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
                    {stepInfo.label}
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

          {/* Actions */}
          {order.status !== "completed" && order.status !== "cancelled" && (
            <OrderActions
              orderId={order.id}
              currentStatus={order.status}
              isCreator={isCreator}
              hasStripeKey={!!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
            />
          )}

          {/* Review form - show for client on completed orders without review */}
          {order.status === "completed" && !isCreator && !hasReview && (
            <ReviewForm
              orderId={order.id}
              creatorId={creatorData.id}
              clientId={clientData.id}
            />
          )}

          {order.status === "completed" && hasReview && (
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
            <p className="mt-2 font-bold text-[#222]">
              {isCreator
                ? clientData.profiles.display_name
                : creatorData.profiles.display_name}
            </p>
            <Link
              href={`/dashboard/messages/${partnerUserId}`}
              className="btn-secondary mt-3 w-full text-sm"
            >
              メッセージを送る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
