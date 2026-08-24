import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { ApplicationsList } from "./applications-list";

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.creator_profile) redirect("/dashboard");

  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      `
      *,
      job:jobs!job_applications_job_id_fkey (
        id, title, genres, budget_min, budget_max, status,
        client:client_profiles!jobs_client_id_fkey (
          id, user_id,
          company_name,
          profiles!client_profiles_user_id_fkey ( display_name )
        )
      )
    `
    )
    .eq("creator_id", user.creator_profile.id)
    .is("archived_by_creator_at", null)
    .order("created_at", { ascending: false });

  // ===== 未読メッセージ送信者の集合 =====
  // 「応募中の DM (order_id IS NULL)」で自分宛 / 未読 のものから sender_id を抜き出す。
  // 各応募カードは「相手企業の user_id がこの集合に入っているか」で未読バッジを判定する。
  const { data: unreadRows } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", user.id)
    .eq("is_read", false)
    .is("order_id", null);
  const unreadSenders = new Set<string>(
    (unreadRows ?? []).map((r) => (r as { sender_id: string }).sender_id)
  );

  // ===== 既存 order の有無 (accepted カードの「取引管理へ」用) =====
  // migration 00083 で job_applications.order_id を専用カラムとして持たせた。
  // 新規採用分はこの値を直接使う。旧レコード (order_id NULL) だけは
  // 従来通り client_id ベースの 近似 fallback を残す (下方互換)。
  const orderByApplicationId = new Map<string, string>();
  const orderByClientId = new Map<string, string>();
  if (applications && applications.length > 0) {
    for (const a of applications) {
      const oid = (a as unknown as { order_id?: string | null }).order_id;
      if (oid) orderByApplicationId.set(a.id as string, oid);
    }
    const acceptedClientIds = Array.from(
      new Set(
        applications
          .filter(
            (a) =>
              a.status === "accepted" &&
              !(a as unknown as { order_id?: string | null }).order_id
          )
          .map((a) =>
            (a.job as unknown as { client: { id: string } } | null)?.client?.id
          )
          .filter((v): v is string => !!v)
      )
    );
    if (acceptedClientIds.length > 0) {
      const { data: relatedOrders } = await supabase
        .from("orders")
        .select("id, client_id, created_at")
        .eq("creator_id", user.creator_profile.id)
        .in("client_id", acceptedClientIds)
        .order("created_at", { ascending: false });
      for (const o of relatedOrders ?? []) {
        const r = o as { id: string; client_id: string };
        if (!orderByClientId.has(r.client_id)) {
          orderByClientId.set(r.client_id, r.id);
        }
      }
    }
  }

  // クライアントコンポーネントへ流す簡易シェイプ
  const rows = (applications ?? []).map((app) => {
    const job = app.job as unknown as {
      id: string;
      title: string;
      genres: string[];
      budget_min: number | null;
      budget_max: number | null;
      status: string;
      client: {
        id: string;
        user_id: string;
        company_name: string | null;
        profiles: { display_name: string };
      };
    };
    const clientUserId = job?.client?.user_id ?? null;
    const clientId = job?.client?.id ?? null;
    return {
      id: app.id as string,
      status: app.status as string,
      proposed_price: app.proposed_price as number | null,
      created_at: app.created_at as string,
      job: {
        id: job?.id ?? "",
        title: job?.title ?? "",
        genres: job?.genres ?? [],
        clientName:
          job?.client?.company_name ??
          job?.client?.profiles?.display_name ??
          "企業",
        clientUserId,
      },
      hasUnread: clientUserId ? unreadSenders.has(clientUserId) : false,
      orderId:
        orderByApplicationId.get(app.id as string) ??
        (clientId ? (orderByClientId.get(clientId) ?? null) : null),
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#222]">応募済み案件</h1>
      <p className="mt-2 text-sm text-[#828282]">
        応募した案件のステータスを確認できます
      </p>
      <div className="mt-6">
        <ApplicationsList rows={rows} />
      </div>
    </div>
  );
}
