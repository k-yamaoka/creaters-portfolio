import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "CreatorsHubのプライバシーポリシー。個人情報の取扱いについて。",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-0">
      <h1 className="text-3xl font-bold text-[#222]">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-[#828282]">最終更新日: 2025年1月1日</p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-[#4F4F4F]">
        <section>
          <h2 className="text-lg font-bold text-[#222]">1. はじめに</h2>
          <p className="mt-3">
            CreatorsHub（以下「当社」といいます。）は、本サービスにおけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
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
            <li>決済に関する情報（クレジットカード情報はStripe社が管理し、当社は保持しません）</li>
            <li>アクセスログ、Cookie情報、IPアドレス</li>
            <li>本人確認に必要な身分証明書の画像</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">3. 利用目的</h2>
          <p className="mt-3">当社は、収集した情報を以下の目的で利用します。</p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>本サービスの提供・運営のため</li>
            <li>ユーザーからのお問い合わせに回答するため</li>
            <li>ユーザー間のマッチング・取引の円滑化のため</li>
            <li>決済処理および報酬支払いのため</li>
            <li>本人確認のため</li>
            <li>利用規約に違反したユーザーの特定と対応のため</li>
            <li>サービスの改善およびマーケティングのため</li>
            <li>新機能やキャンペーンのご案内のため</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">4. 第三者提供</h2>
          <p className="mt-3">
            当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。
          </p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            <li>国の機関等が法令の定める事務を遂行するために協力する必要がある場合</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">5. 決済情報の取扱い</h2>
          <p className="mt-3">
            本サービスの決済処理はStripe, Inc.のサービスを利用しています。クレジットカード情報等の決済情報は、Stripe社のシステムにて安全に管理されており、当社のサーバーに保存されることはありません。Stripe社のプライバシーポリシーについては、Stripe社のウェブサイトをご確認ください。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">6. Cookieの使用</h2>
          <p className="mt-3">
            当社は、サービスの利便性向上、利用状況の分析のためにCookieを使用しています。ブラウザの設定によりCookieの受け入れを拒否することができますが、一部のサービスが正常に機能しなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">7. 個人情報の管理</h2>
          <p className="mt-3">
            当社は、個人情報の正確性を保ち、不正アクセス、紛失、破壊、改ざん等を防止するため、合理的な安全対策を講じます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">8. 個人情報の開示・訂正・削除</h2>
          <p className="mt-3">
            ユーザーは、当社に対して自己の個人情報の開示、訂正、削除を請求することができます。請求があった場合、本人確認を行った上で速やかに対応いたします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">9. お問い合わせ</h2>
          <p className="mt-3">
            本ポリシーに関するお問い合わせは、本サービスのヘルプセンターよりご連絡ください。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">10. 改定</h2>
          <p className="mt-3">
            当社は、必要に応じて本ポリシーを改定することがあります。改定した場合には、本サービス上での掲示により通知いたします。
          </p>
        </section>
      </div>
    </div>
  );
}
