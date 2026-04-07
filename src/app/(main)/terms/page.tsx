export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-0">
      <h1 className="text-3xl font-bold text-[#222]">利用規約</h1>
      <p className="mt-2 text-sm text-[#828282]">最終更新日: 2025年1月1日</p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-[#4F4F4F]">
        <section>
          <h2 className="text-lg font-bold text-[#222]">第1条（適用）</h2>
          <p className="mt-3">
            本利用規約（以下「本規約」といいます。）は、CreatorsHub（以下「当社」といいます。）が提供する映像クリエイターマッチングサービス「CreatorsHub」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">第2条（利用登録）</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2">
            <li>登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
            <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
              <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                <li>本規約に違反したことがある者からの申請である場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">第3条（ユーザーIDおよびパスワードの管理）</h2>
          <p className="mt-3">
            ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。ユーザーIDおよびパスワードの管理不十分、使用上の過誤、第三者の使用等によって生じた損害に関する責任はユーザーが負うものとし、当社は一切の責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">第4条（禁止事項）</h2>
          <p className="mt-3">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当社、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>当社のサービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>不正アクセスをし、またはこれを試みる行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>本サービスを通じた直接取引（当社を介さない取引）</li>
            <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">第5条（決済および手数料）</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2">
            <li>本サービスにおける取引は、エスクロー（仮払い）方式で行われます。</li>
            <li>クライアントは、取引成立時に当社が指定する方法で仮払いを行うものとします。</li>
            <li>クリエイターへの報酬支払いは、クライアントの検収完了後に行われます。</li>
            <li>当社は、取引金額の15%をシステム手数料として収受します。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">第6条（本サービスの提供の停止等）</h2>
          <p className="mt-3">
            当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
          </p>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
            <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
            <li>コンピュータまたは通信回線等が事故により停止した場合</li>
            <li>その他、当社が本サービスの提供が困難と判断した場合</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">第7条（免責事項）</h2>
          <p className="mt-3">
            当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。当社は、ユーザーに対して、かかる瑕疵を除去して本サービスを提供する義務を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">第8条（準拠法・裁判管轄）</h2>
          <p className="mt-3">
            本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
          </p>
        </section>
      </div>
    </div>
  );
}
