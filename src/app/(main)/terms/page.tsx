import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "AILIERの利用規約。",
};

export const revalidate = 3600;

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-0">
      <h1 className="text-3xl font-bold text-[#222]">利用規約</h1>
      <p className="mt-2 text-sm text-[#828282]">最終更新日: 2025年1月1日</p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed text-[#4F4F4F]">
        <section>
          <h2 className="text-lg font-bold text-[#222]">第1条（適用）</h2>
          <p className="mt-3">
            本利用規約（以下「本規約」といいます。）は、AILIER（以下「当社」といいます。）が提供する映像クリエイターマッチングサービス「AILIER」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
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

        {/* B-2: AI 生成コンテンツのガイドライン / NG 基準 (2026-07-15 追記) */}
        <section>
          <h2 className="text-lg font-bold text-[#222]">
            第4条の2（AI 生成コンテンツに関するガイドライン）
          </h2>
          <p className="mt-3">
            本サービスはAIを活用したクリエイティブ制作のためのマッチングを目的としています。
            公開されるポートフォリオおよび納品物は、以下の基準に従って掲載してください。
          </p>

          <h3 className="mt-5 text-sm font-bold text-[#222]">1. 公開可能な作品</h3>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>
              本人が生成・制作した作品であって、第三者の権利および公開許諾を侵害しないもの。
            </li>
            <li>
              クライアントワーク納品物は、クライアントから公開許諾を得た範囲でのみ掲載できます。
            </li>
          </ul>

          <h3 className="mt-5 text-sm font-bold text-[#222]">2. 非推奨（掲載可だが品質面での注意喚起の対象）</h3>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>明らかな未完成作品、または極端に低品質と判断される作品。</li>
            <li>
              AI が出力した素材を実質的な修正・編集を加えず、そのまま公開している作品
              （プロンプト提示や検証的な用途を除きます）。
            </li>
          </ul>

          <h3 className="mt-5 text-sm font-bold text-[#222]">3. 禁止（発見時は非公開化・アカウント停止の対象）</h3>
          <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
            <li>
              著作権・商標権・意匠権・肖像権・パブリシティ権・プライバシー権など、
              第三者の権利を侵害する内容。
            </li>
            <li>
              実在人物（著名人・一般人問わず）を、本人の同意なく生成した画像・動画。
              いわゆるディープフェイクを含みます。
            </li>
            <li>
              公序良俗に反する表現（差別的表現、暴力・性的搾取的表現、児童を対象とした性的表現、
              犯罪誘発・自傷助長など）。
            </li>
            <li>
              法令（著作権法、不正競争防止法、景品表示法、その他の各種業法）に違反する内容。
            </li>
          </ul>

          <p className="mt-4 text-xs text-[#828282]">
            ※ 当社は掲載物の適法性・許諾状況を都度確認する義務を負いませんが、
            通報を受けた場合または当社が独自に確認した場合、事前通知なく非公開化・削除
            またはアカウントの利用停止措置を行うことがあります。
          </p>
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

        {/* A-4: キャンセルポリシー (2026-07-15 追記) */}
        <section>
          <h2 className="text-lg font-bold text-[#222]">
            第5条の2（発注後のキャンセルおよび返金）
          </h2>
          <p className="mt-3">
            発注成立後のキャンセルについては、キャンセル申請時点の進行段階に応じて
            以下の基準により、クリエイターへの報酬と、クライアントへの返金額を確定します。
          </p>

          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-bold">進行段階</th>
                  <th className="px-3 py-2 font-bold">クリエイター報酬</th>
                  <th className="px-3 py-2 font-bold">クライアント返金</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr>
                  <td className="px-3 py-2">
                    <b>着手前</b>
                    <br />
                    <span className="text-[10px] text-gray-500">
                      相談 / 見積 / 契約 / データ共有前
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">0%</td>
                  <td className="px-3 py-2 font-mono tabular-nums">100%</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">
                    <b>制作中</b>
                    <br />
                    <span className="text-[10px] text-gray-500">
                      制作開始後 / 修正対応中
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">50%</td>
                  <td className="px-3 py-2 font-mono tabular-nums">50%</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">
                    <b>納品後</b>
                    <br />
                    <span className="text-[10px] text-gray-500">
                      納品完了 / 検収未確定
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">100%</td>
                  <td className="px-3 py-2 font-mono tabular-nums">0%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-[#828282]">
            ※ 上記は原則であり、権利侵害・重大な瑕疵・双方合意など個別事由がある場合は、
            当社が個別に調整することがあります。返金は原則として仮払いに使用した決済手段
            へ返却されます。
          </p>
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
          <h2 className="text-lg font-bold text-[#222]">
            第6条の2（データ保持期間および免責）
          </h2>
          <p className="mt-3">
            当社は、取引 (メッセージ、納品物、取引履歴等) の記録を、
            取引終了 (完了・キャンセル・途中終了のいずれか) の日から <b>2 年間</b> 保持します。
            保持期間経過後は、システムにより順次論理削除および物理削除を行います。
          </p>
          <p className="mt-3">
            当社は、当該データの喪失・毀損・第三者による閲覧等に起因する損害について、
            <b>一切の損害補償義務を負いません</b>。ユーザーは、必要に応じて自身の責任で
            納品物およびメッセージの控えを保存してください。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#222]">
            第6条の3（未納品時の取り扱い）
          </h2>
          <ol className="mt-3 list-inside list-decimal space-y-2">
            <li>納品期限を超過した場合、当社は自動的にクリエイターへリマインド通知を行います。</li>
            <li>クライアントからの催促通知後 <b>7 日以内</b> に納品が行われない場合、当社は当該取引をシステムにより自動キャンセルとし、仮払い金の全額をクライアントへ返金します。</li>
            <li>未納品の記録は、当該クリエイターのアカウントに<b>ペナルティ履歴</b>として保持し、検索順位・信頼度スコアに影響することがあります。</li>
          </ol>
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
