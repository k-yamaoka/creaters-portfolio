import Link from "next/link";

const CATEGORIES = [
  {
    title: "はじめての方へ",
    items: [
      { q: "CreatorsHubとは何ですか？", a: "映像クリエイターと企業をマッチングするプラットフォームです。ポートフォリオを見て直接依頼したり、案件を掲載してクリエイターを募集できます。" },
      { q: "登録に費用はかかりますか？", a: "企業・クリエイターともに登録は無料です。取引成立時にのみシステム手数料（取引金額の15%、クリエイター負担）が発生します。" },
      { q: "どんなジャンルの映像制作に対応していますか？", a: "CGアニメーション、テレビCM、MV、商品紹介、サービス紹介、会社紹介、教育・研修、YouTube、Instagram、SNS動画など幅広く対応しています。" },
    ],
  },
  {
    title: "企業・クライアント向け",
    items: [
      { q: "クリエイターへの依頼方法は？", a: "クリエイターの詳細ページから料金プランを選んで依頼を作成するか、メッセージで直接相談できます。" },
      { q: "案件を掲載して募集するには？", a: "ダッシュボードの「案件管理」から新規案件を作成し、要件・予算・納期を入力して掲載します。クリエイターからの応募を待ちます。" },
      { q: "支払いはどうなりますか？", a: "エスクロー（仮払い）方式です。制作開始前に仮払いを行い、納品確認後にクリエイターへ報酬が支払われます。納品まで資金は安全に保護されます。" },
      { q: "キャンセルはできますか？", a: "仮払い前であればいつでもキャンセル可能です。仮払い後は双方の合意が必要です。" },
    ],
  },
  {
    title: "クリエイター向け",
    items: [
      { q: "ポートフォリオの登録方法は？", a: "ダッシュボードの「ポートフォリオ管理」から、YouTubeやVimeoの動画URLとサムネイル画像を登録できます。" },
      { q: "料金はどうやって設定しますか？", a: "ダッシュボードの「料金プラン管理」から、パッケージ名・内容・価格・納期を自由に設定できます。複数のプランを作成可能です。" },
      { q: "報酬の受け取り方は？", a: "Stripeアカウントを接続することで、取引完了後に自動的に報酬が振り込まれます。ダッシュボードからStripe接続を行ってください。" },
      { q: "案件に応募するには？", a: "「案件を探す」ページから興味のある案件を見つけ、提案メッセージと希望金額を添えて応募できます。" },
    ],
  },
  {
    title: "取引・決済について",
    items: [
      { q: "エスクロー決済とは何ですか？", a: "仮払い方式の決済です。クライアントが先に支払い、プラットフォームが一時的に預かります。納品確認後にクリエイターへ報酬が支払われるため、双方にとって安全です。" },
      { q: "手数料はいくらですか？", a: "取引金額の15%がシステム手数料としてクリエイターの報酬から差し引かれます。企業側の負担はありません。" },
      { q: "納品に満足できなかった場合は？", a: "「修正依頼」機能で修正をリクエストできます。料金プランに含まれる修正回数内であれば追加費用なしで対応されます。" },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          ヘルプセンター
        </h1>
        <p className="mt-4 text-base text-[#828282]">
          よくある質問と使い方ガイド
        </p>
      </div>

      {/* Quick links */}
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/how-it-works" className="btn-white text-sm">
          使い方ガイド
        </Link>
        <Link href="/terms" className="btn-white text-sm">
          利用規約
        </Link>
        <Link href="/privacy" className="btn-white text-sm">
          プライバシーポリシー
        </Link>
      </div>

      {/* FAQ sections */}
      <div className="mt-16 space-y-16">
        {CATEGORIES.map((category) => (
          <div key={category.title}>
            <h2 className="text-xl font-bold text-[#222]">
              {category.title}
            </h2>
            <div className="mt-6 space-y-4">
              {category.items.map((item) => (
                <div
                  key={item.q}
                  className="rounded-2xl bg-white p-6 shadow-card"
                >
                  <h3 className="font-bold text-[#222]">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#828282]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-20 rounded-2xl bg-[#F8F8F8] p-8 text-center sm:p-12">
        <h2 className="text-xl font-bold text-[#222]">
          お探しの答えが見つかりませんか？
        </h2>
        <p className="mt-2 text-sm text-[#828282]">
          お気軽にお問い合わせください。サポートチームが対応いたします。
        </p>
        <a
          href="mailto:support@creatorshub.jp"
          className="btn-primary mt-6 inline-block text-sm"
        >
          お問い合わせ
        </a>
      </div>
    </div>
  );
}
