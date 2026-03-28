import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white">
          <div className="mx-auto flex max-w-container flex-col items-center px-6 py-20 lg:flex-row lg:px-[6.25rem] lg:py-28">
            {/* Left Text */}
            <div className="max-w-xl lg:max-w-[50%]">
              <h1 className="text-4xl font-bold leading-[110%] text-[#222] sm:text-[3.625rem]">
                最適な映像クリエイターと
                <span className="text-primary-500">出会える</span>
                場所
              </h1>
              <p className="mt-6 text-base leading-[170%] text-[#828282] sm:text-lg">
                企業VP、YouTube動画、ウェディング映像まで。
                ポートフォリオを見て、あなたのプロジェクトにぴったりのクリエイターを見つけましょう。
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/creators" className="btn-primary px-10 py-4 text-lg">
                  クリエイターを探す
                </Link>
                <Link href="/register/creator" className="btn-secondary px-10 py-4 text-lg">
                  クリエイターとして登録
                </Link>
              </div>
            </div>
            {/* Right Visual */}
            <div className="mt-12 flex flex-1 justify-center lg:mt-0 lg:justify-end">
              <div className="relative grid w-full max-w-md grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-[20px] bg-[#F2F2F2] shadow-card">
                    <Image
                      src="https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=200&fit=crop"
                      alt="企業VP"
                      width={300}
                      height={200}
                      className="h-32 w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="text-xs font-bold text-[#222]">企業VP</p>
                      <p className="text-[11px] text-[#828282]">¥300,000〜</p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-[20px] bg-[#F2F2F2] shadow-card">
                    <Image
                      src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=200&fit=crop"
                      alt="広告・CM"
                      width={300}
                      height={200}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="text-xs font-bold text-[#222]">広告・CM</p>
                      <p className="text-[11px] text-[#828282]">¥150,000〜</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="overflow-hidden rounded-[20px] bg-[#F2F2F2] shadow-card">
                    <Image
                      src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=200&fit=crop"
                      alt="YouTube動画"
                      width={300}
                      height={200}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="text-xs font-bold text-[#222]">YouTube動画</p>
                      <p className="text-[11px] text-[#828282]">¥30,000〜</p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-[20px] bg-[#F2F2F2] shadow-card">
                    <Image
                      src="https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=200&fit=crop"
                      alt="ウェディング"
                      width={300}
                      height={200}
                      className="h-32 w-full object-cover"
                    />
                    <div className="p-3">
                      <p className="text-xs font-bold text-[#222]">ウェディング</p>
                      <p className="text-[11px] text-[#828282]">¥200,000〜</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-[#F8F8F8] py-24">
          <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
                CreatorsHubの特徴
              </h2>
              <p className="mt-4 text-base text-[#828282]">
                安心・安全に映像制作を依頼できる仕組みを提供します
              </p>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "ポートフォリオで\n実力を確認",
                  description:
                    "クリエイターの過去の作品を動画で確認。スキルや得意ジャンルを比較して、最適な人材を選べます。",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  ),
                },
                {
                  title: "エスクロー決済で\n安心取引",
                  description:
                    "仮払いシステムにより、納品確認後に報酬が支払われます。クリエイター・クライアント双方にとって安全です。",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                    />
                  ),
                },
                {
                  title: "明確な料金体系で\nスムーズに依頼",
                  description:
                    "パッケージ・メニュー表で料金が明確。見積もり前に大まかな費用感を把握でき、スムーズに依頼できます。",
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                    />
                  ),
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[15px] bg-white p-10 text-center shadow-card transition-shadow duration-300 hover:shadow-card-hover"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
                    <svg
                      className="h-7 w-7 text-primary-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      {feature.icon}
                    </svg>
                  </div>
                  <h3 className="mt-6 whitespace-pre-line text-xl font-bold text-[#222]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[170%] text-[#828282]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-container px-6 lg:px-[6.25rem]">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
                ご利用の流れ
              </h2>
            </div>
            <div className="mt-16 grid gap-0 md:grid-cols-4">
              {[
                { step: "01", title: "クリエイターを検索", desc: "ジャンル・予算・実績から最適なクリエイターを見つけます" },
                { step: "02", title: "相談・見積もり", desc: "メッセージで要件を伝え、見積もりを受け取ります" },
                { step: "03", title: "仮払い・制作開始", desc: "エスクロー決済で安心して制作をスタート" },
                { step: "04", title: "納品・検収", desc: "納品物を確認し、検収完了で報酬が支払われます" },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center">
                  {i < 3 && (
                    <div className="absolute right-0 top-8 hidden h-[2px] w-full translate-x-1/2 bg-[#E0E0E0] md:block" />
                  )}
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-xl font-black text-white">
                    {item.step}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#222]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-[170%] text-[#828282]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#242424] py-20">
          <div className="mx-auto max-w-container px-6 text-center lg:px-[6.25rem]">
            <h2 className="text-3xl font-bold text-white sm:text-[2.75rem]">
              あなたのプロジェクトを始めましょう
            </h2>
            <p className="mt-4 text-base text-[#828282]">
              無料で会員登録して、今すぐクリエイターを探すか、
              クリエイターとしてポートフォリオを公開しましょう。
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/register" className="btn-primary px-10 py-4 text-lg">
                無料で会員登録
              </Link>
              <Link
                href="/creators"
                className="inline-flex items-center justify-center rounded-pill border-2 border-white/30 px-10 py-4 text-lg font-bold text-white transition-all duration-200 hover:bg-white/10"
              >
                クリエイターを見る
              </Link>
            </div>
          </div>
        </section>
    </>
  );
}
