import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatDateJP, formatPrice } from "@/lib/utils";
import { UserActionsPanel } from "./user-actions-panel";

/**
 * 個別ユーザー詳細画面 (admin only)。
 * profiles / creator_profiles / client_profiles / orders / creator_penalties /
 * moderation_actions を横断で表示する。
 */

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) notFound();

  const [
    { data: creatorProfile },
    { data: clientProfile },
    { data: orders },
    { data: penalties },
    { data: modActions },
  ] = await Promise.all([
    admin
      .from("creator_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("client_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("orders")
      .select("id, title, status, total_amount, created_at, creator_id, client_id")
      .or(
        `client_id.in.(${await getCpIds(admin, "client_profiles", userId)}),creator_id.in.(${await getCpIds(admin, "creator_profiles", userId)})`
      )
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("creator_penalties")
      .select("*")
      .eq("creator_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("moderation_actions")
      .select("*")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const totalPenaltyScore =
    (penalties ?? []).reduce((s, p) => s + (p.weight ?? 0), 0) ?? 0;
  const isAtRisk = totalPenaltyScore >= 15;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/users"
            className="text-xs text-gray-500 hover:underline"
          >
            ← ユーザー管理に戻る
          </Link>
          <h2 className="mt-1 text-2xl font-bold text-[#222]">
            {profile.display_name}
          </h2>
          <p className="mt-1 text-sm text-[#828282]">{profile.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-bold text-gray-700">
              {profile.role}
            </span>
            {profile.is_verified && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-blue-700">
                認証済
              </span>
            )}
            {!profile.is_active && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-700">
                停止中
              </span>
            )}
            {isAtRisk && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-700">
                ⚠️ 要監視 (penalty ≥ 15)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 運営アクション (停止/認証) */}
      <UserActionsPanel
        userId={profile.id}
        isActive={profile.is_active !== false}
        isVerified={!!profile.is_verified}
      />

      {/* Profile 基本情報 */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-[#222]">基本情報</h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Row label="ID" value={profile.id} />
          <Row label="登録日" value={formatDateJP(profile.created_at)} />
          <Row label="電話番号" value={profile.phone ?? "-"} />
          <Row
            label="LINE 連携"
            value={profile.line_user_id ? "済 (Push 通知可)" : "未"}
          />
          <Row
            label="通知設定"
            value={`Email: ${profile.notify_email !== false ? "ON" : "OFF"} / LINE: ${profile.notify_line ? "ON" : "OFF"}`}
          />
        </dl>
      </section>

      {/* creator_profile / client_profile */}
      {creatorProfile && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-[#222]">クリエイター情報</h3>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Row
              label="早期メンバー"
              value={creatorProfile.is_early_member ? "はい (手数料 0%)" : "-"}
            />
            <Row
              label="最低受注金額"
              value={
                creatorProfile.minimum_order_amount
                  ? formatPrice(creatorProfile.minimum_order_amount)
                  : "-"
              }
            />
            <Row label="評価" value={String(creatorProfile.rating ?? 0)} />
            <Row
              label="レビュー数"
              value={String(creatorProfile.review_count ?? 0)}
            />
            <Row
              label="Stripe Connect"
              value={creatorProfile.stripe_account_id ? "接続済" : "未接続"}
            />
            <Row
              label="公開状態"
              value={creatorProfile.is_searchable ? "公開" : "非公開"}
            />
          </dl>
        </section>
      )}
      {clientProfile && (
        <section className="rounded-2xl bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold text-[#222]">企業情報</h3>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Row label="会社名" value={clientProfile.company_name ?? "-"} />
            <Row label="URL" value={clientProfile.company_url ?? "-"} />
            <Row label="業種" value={clientProfile.industry ?? "-"} />
            <Row
              label="適格請求書番号"
              value={clientProfile.invoice_registration_number ?? "-"}
            />
          </dl>
        </section>
      )}

      {/* Penalty 履歴 */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-[#222]">
          ペナルティ履歴 ({penalties?.length ?? 0}, 累計 {totalPenaltyScore})
        </h3>
        {(penalties?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-gray-500">ペナルティ履歴なし</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {(penalties ?? []).map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-gray-200 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{p.reason}</span>
                  <span className="text-gray-500">
                    weight: {p.weight} / {formatDateJP(p.created_at)}
                  </span>
                </div>
                {p.note && (
                  <p className="mt-1 text-gray-600">{p.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* モデレーションアクション履歴 */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-[#222]">
          対 このユーザーへの運営アクション ({modActions?.length ?? 0})
        </h3>
        {(modActions?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-gray-500">アクションなし</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {(modActions ?? []).map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-gray-200 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{m.action_type}</span>
                  <span className="text-gray-500">
                    {formatDateJP(m.created_at)}
                  </span>
                </div>
                {m.reason && (
                  <p className="mt-1 text-gray-600">{m.reason}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 取引履歴 (直近 50 件) */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-[#222]">
          取引履歴 (直近 {orders?.length ?? 0} 件)
        </h3>
        {(orders?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-gray-500">取引履歴なし</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="py-2">日付</th>
                  <th className="py-2">タイトル</th>
                  <th className="py-2">ロール</th>
                  <th className="py-2">status</th>
                  <th className="py-2 text-right">金額</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(orders ?? []).map((o) => (
                  <tr key={o.id} className="border-t border-gray-100">
                    <td className="py-2 text-xs text-gray-500">
                      {formatDateJP(o.created_at)}
                    </td>
                    <td className="max-w-[220px] truncate py-2">{o.title}</td>
                    <td className="py-2 text-xs">
                      {clientProfile && o.client_id === clientProfile.id
                        ? "発注者"
                        : "受注者"}
                    </td>
                    <td className="py-2">
                      <span className="rounded-pill bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2 text-right font-bold">
                      {formatPrice(o.total_amount)}
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="text-xs text-neon-purple-deep hover:underline"
                      >
                        詳細 →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}

async function getCpIds(
  admin: ReturnType<typeof getSupabaseAdmin>,
  table: "client_profiles" | "creator_profiles",
  userId: string
): Promise<string> {
  const { data } = await admin.from(table).select("id").eq("user_id", userId);
  const ids = (data ?? []).map((r) => r.id as string);
  // .or 中の in() 用に文字列連結。空なら不到達 UUID を返す (0 件マッチにする)
  return ids.length > 0 ? ids.join(",") : "00000000-0000-0000-0000-000000000000";
}
