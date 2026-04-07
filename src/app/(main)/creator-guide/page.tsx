import Link from "next/link";

export default function CreatorGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:px-0">
      <h1 className="text-3xl font-bold text-[#222]">
        クリエイターガイドライン
      </h1>
      <p className="mt-2 text-sm text-[#828282]">
        CreatorsHubで活動するクリエイターの皆さまへ
      </p>

      <div className="mt-10 space-y-10">
        {/* Getting Started */}
        <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-[#222]">はじめに</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4F4F4F]">
            CreatorsHubは、映像クリエイターと企業を直接つなぐプラットフォームです。
            本ガイドラインは、すべてのクリエイターが安心して活動できる環境を維持するために定めたものです。
          </p>
        </section>

        {/* Profile */}
        <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-[#222]">プロフィールについて</h2>
          <ul className="mt-4 space-y-3">
            {[
              "正確な情報を記載してください（経験年数、スキル、所在地など）",
              "プロフィール写真は本人の顔写真またはロゴを推奨します",
              "自己紹介文は具体的に。得意ジャンル・制作実績・使用ツールを明記してください",
              "虚偽の情報や誇大な表現は禁止です",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-[#4F4F4F]">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Portfolio */}
        <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-[#222]">ポートフォリオについて</h2>
          <ul className="mt-4 space-y-3">
            {[
              "自身が制作に携わった作品のみ掲載してください",
              "クライアントの許可を得た作品を掲載してください",
              "著作権・肖像権を侵害する作品は掲載できません",
              "動画はYouTubeまたはVimeoにアップロードし、URLを登録してください",
              "サムネイル画像は作品の内容がわかるものを設定してください",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-[#4F4F4F]">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-[#222]">料金設定について</h2>
          <ul className="mt-4 space-y-3">
            {[
              "料金プランには含まれる内容を明確に記載してください",
              "追加料金が発生する場合は事前にクライアントへ説明してください",
              "不当に高額または低額な価格設定はお控えください",
              "取引成立時にシステム手数料（15%）が差し引かれます",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-[#4F4F4F]">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Communication */}
        <section className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold text-[#222]">取引・コミュニケーション</h2>
          <ul className="mt-4 space-y-3">
            {[
              "メッセージには迅速に返信してください（24時間以内推奨）",
              "プラットフォーム外での直接取引は禁止です",
              "納期を厳守してください。遅れる場合は早めにクライアントへ連絡してください",
              "修正依頼には料金プランの範囲内で誠実に対応してください",
              "クライアントの個人情報や機密情報は適切に管理してください",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-[#4F4F4F]">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Prohibited */}
        <section className="rounded-2xl border-2 border-red-100 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-red-600">禁止事項</h2>
          <ul className="mt-4 space-y-3">
            {[
              "プラットフォーム外での直接取引の誘導",
              "虚偽のプロフィール・ポートフォリオの掲載",
              "他者の作品を自分のものとして掲載する行為",
              "クライアントへの嫌がらせ・不適切なメッセージ",
              "反社会的勢力との関わり",
              "その他、利用規約に違反する行為",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-red-600">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#828282]">
            違反が確認された場合、アカウントの停止・削除などの措置を取ることがあります。
          </p>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-[#828282]">
            ガイドラインに関するご質問は
            <Link href="/help" className="font-medium text-primary-500 hover:underline">
              ヘルプセンター
            </Link>
            からお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
