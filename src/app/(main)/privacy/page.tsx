import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "アイムビ (Comhuman-Quality株式会社) におけるユーザー個人情報の取扱いを定めます。",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
      <h1 className="text-3xl font-bold text-[#222]">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-[#828282]">
        最終更新日: 2026年9月6日
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-[#4F4F4F]">
        <section>
          <h2 className="text-lg font-bold text-[#222]">
            1. 事業者情報 (個人情報保護法 第32条1項)
          </h2>
          <p className="mt-3">
            本サービス「アイムビ」を提供する事業者は以下のとおりです。
          </p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>
              <b>事業者名</b>: Comhuman-Quality 株式会社
            </li>
            <li>
              <b>所在地</b>: 東京都渋谷区恵比寿 1-15-9-403
            </li>
            <li>
              <b>代表者</b>: 山岡 浩志
            </li>
            <li>
              <b>個人情報保護管理者</b>: 山岡 浩志 (info@comhuman-quality.com)
            </li>
            <li>
              <b>会社情報</b>:{" "}
              <a
                href="https://comhuman-quality.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-aimovie-ember-500 underline"
              >
                https://comhuman-quality.com/
              </a>
            </li>
          </ul>
          <p className="mt-3">
            本ポリシーで「当社」とは、上記の Comhuman-Quality 株式会社を指し、
            「本サービス」とは、当社が運営する「アイムビ (Aimovie)」を指します。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">2. 収集する情報</h2>
          <p className="mt-3">当社は、以下の情報を収集することがあります。</p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>氏名、メールアドレス等の登録情報</li>
            <li>企業名、所在地等の法人情報</li>
            <li>ポートフォリオ、スキル等のプロフィール情報</li>
            <li>取引履歴、メッセージ履歴</li>
            <li>
              決済に関する情報 (クレジットカード情報は Stripe, Inc. が管理し、
              当社は保持しません)
            </li>
            <li>アクセスログ、Cookie 情報、IP アドレス</li>
            <li>本人確認に必要な身分証明書の画像</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">3. 利用目的</h2>
          <p className="mt-3">当社は、収集した情報を以下の目的で利用します。</p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>本サービスの提供・運営</li>
            <li>お問い合わせへの回答</li>
            <li>ユーザー間のマッチング・取引の円滑化</li>
            <li>決済処理および報酬支払い</li>
            <li>本人確認</li>
            <li>利用規約に違反したユーザーの特定と対応</li>
            <li>サービスの改善およびマーケティング</li>
            <li>新機能やキャンペーンのご案内</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">4. 第三者提供</h2>
          <p className="mt-3">
            当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に
            提供しません。
          </p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>
              公衆衛生の向上または児童の健全な育成の推進のために特に必要が
              ある場合
            </li>
            <li>
              国の機関等が法令の定める事務を遂行するために協力する必要が
              ある場合
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">5. 決済情報の取扱い</h2>
          <p className="mt-3">
            本サービスの決済処理は Stripe, Inc. のサービスを利用しています。
            クレジットカード情報等の決済情報は、Stripe 社のシステムにて安全に
            管理されており、当社のサーバーに保存されることはありません。詳細は{" "}
            <a
              href="https://stripe.com/jp/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aimovie-ember-500 underline"
            >
              Stripe プライバシーポリシー
            </a>{" "}
            をご確認ください。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">6. Cookie の使用</h2>
          <p className="mt-3">
            当社は、サービスの利便性向上、利用状況の分析のために Cookie を
            使用しています。ブラウザの設定により Cookie の受け入れを拒否する
            ことができますが、一部のサービスが正常に機能しなくなる場合が
            あります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">7. 個人情報の管理</h2>
          <p className="mt-3">
            当社は、個人情報の正確性を保ち、不正アクセス、紛失、破壊、改ざん
            等を防止するため、合理的な安全対策を講じます。個人情報を取り扱う
            従業者に対して、必要かつ適切な監督を行います。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">
            8. 保有期間・削除ポリシー
          </h2>
          <p className="mt-3">
            当社は、利用目的の達成に必要な範囲で個人情報を保有します。
            主な項目の保有期間は以下のとおりです。
          </p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>
              <b>取引履歴 / メッセージ履歴</b>: 取引完了から 2 年間
              (紛争対応・電子帳簿保存法の要件に基づく)
            </li>
            <li>
              <b>本人確認書類 (身分証画像)</b>: 収集から 1 年間 (犯罪収益移転
              防止法・利用規約に基づく)。以後は速やかに削除
            </li>
            <li>
              <b>アクセスログ・IP アドレス</b>: 収集から 90 日間 (不正利用調査
              目的)
            </li>
            <li>
              <b>退会済みアカウントのメールアドレス</b>: 退会日から 30 日間
              (再登録時の識別および同一人物の判別目的)。以後は削除
            </li>
            <li>
              <b>Cookie</b>: ブラウザ側で保持される期間 (最長 1 年)。ユーザー
              自身で削除可能
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">
            9. 個人情報の開示・訂正・削除の請求
          </h2>
          <p className="mt-3">
            ユーザーは、当社に対して自己の個人情報の開示、訂正、追加、削除、
            利用の停止または第三者提供の停止を請求することができます。請求が
            あった場合、本人確認を行った上で法令に基づき遅滞なく対応いたし
            ます。
          </p>
          <p className="mt-3">
            <b>請求窓口</b>: info@comhuman-quality.com (Comhuman-Quality
            株式会社 個人情報保護 担当)
          </p>
          <p className="mt-3">
            <b>手数料</b>: 開示・利用停止・第三者提供停止の各請求について、
            当社所定の手数料は無料とします。ただし郵送等による物理的な書類
            のやり取りが必要な場合は、実費相当額をご負担いただくことが
            あります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">10. 苦情の申出先</h2>
          <p className="mt-3">
            本ポリシーおよび当社の個人情報の取扱いに関するご意見・苦情は、
            以下の窓口にてお受けします。
          </p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>
              <b>一次窓口</b>: info@comhuman-quality.com
            </li>
            <li>
              <b>認定個人情報保護団体</b>: 加入していないため、上記窓口で
              お受けし、必要に応じて個人情報保護委員会
              (https://www.ppc.go.jp/) へお申し出いただけます。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">11. お問い合わせ</h2>
          <p className="mt-3">
            本ポリシーに関するお問い合わせは、当社{" "}
            <Link
              href="/help"
              className="text-aimovie-ember-500 underline"
            >
              ヘルプセンター
            </Link>{" "}
            もしくは info@comhuman-quality.com までご連絡ください。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">12. 改定</h2>
          <p className="mt-3">
            当社は、法令の改正または本サービスの内容変更に応じて、本ポリシー
            を改定することがあります。改定した場合には、本サービス上での掲示
            により通知いたします。重要な変更については、事前にユーザーへの
            個別通知または明示的な同意取得を行います。
          </p>
        </section>
      </div>
    </div>
  );
}
