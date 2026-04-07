import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "導入事例",
  description:
    "CreatorsHubを活用した企業の映像制作成功事例をご紹介します。",
};

const CASES = [
  {
    title: "新商品のプロモーション動画で売上130%達成",
    company: "株式会社サンプルテック",
    industry: "IT・通信",
    genre: "商品・製品紹介",
    budget: "¥300,000",
    period: "2週間",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop",
    challenge: "新製品のローンチに合わせてSNS向けのプロモーション動画が必要でしたが、制作会社に依頼すると予算オーバーに。",
    solution: "CreatorsHubでモーショングラフィックスが得意なクリエイターを見つけ、直接依頼。制作会社の半額以下で高品質な動画が完成。",
    result: "SNS広告のCTRが2.5倍に向上。プロモーション期間の売上が前年比130%を達成しました。",
  },
  {
    title: "採用動画で応募者数が2倍に増加",
    company: "株式会社グローバルHR",
    industry: "人材",
    genre: "会社・学校紹介",
    budget: "¥500,000",
    period: "3週間",
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop",
    challenge: "採用サイトに掲載する企業紹介動画を制作したいが、撮影から編集まで対応できるクリエイターが見つからない。",
    solution: "ポートフォリオで企業VP実績が豊富なクリエイターを発見。撮影ディレクションから編集まで一貫して依頼。",
    result: "採用サイトの滞在時間が1.8倍に。動画掲載後3ヶ月で応募者数が前期比200%に増加しました。",
  },
  {
    title: "YouTube企業チャンネルを月8本体制で運用開始",
    company: "合同会社フードクリエイト",
    industry: "飲食・サービス",
    genre: "Youtubeショート【縦型】",
    budget: "¥100,000/月",
    period: "継続中",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop",
    challenge: "YouTubeチャンネルを開設したが、動画編集のリソースがなく更新頻度を維持できない。",
    solution: "月額パッケージで継続的に動画編集を依頼。テロップ・BGM・サムネイル制作まで一括で対応。",
    result: "月8本の安定更新を実現。チャンネル登録者が半年で5,000人を突破。店舗への来客数も増加しました。",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-[6.25rem]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#222] sm:text-[2.75rem]">
          導入事例
        </h1>
        <p className="mt-4 text-base text-[#828282]">
          CreatorsHubを活用した企業の成功事例をご紹介します
        </p>
      </div>

      <div className="mt-16 space-y-16">
        {CASES.map((item, i) => (
          <div
            key={item.title}
            className={`overflow-hidden rounded-[20px] bg-white shadow-card md:flex ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
          >
            {/* Image */}
            <div className="relative aspect-video md:aspect-auto md:w-2/5">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-6 sm:p-8 md:p-10">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-pill bg-primary-50 px-3 py-1 text-xs font-bold text-primary-500">
                  {item.genre}
                </span>
                <span className="rounded bg-[#F2F2F2] px-2 py-1 text-xs text-[#828282]">
                  {item.industry}
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#222]">
                {item.title}
              </h2>
              <p className="mt-1 text-sm text-[#828282]">
                {item.company}
              </p>

              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <p className="text-xs text-[#BDBDBD]">予算</p>
                  <p className="font-bold text-[#222]">{item.budget}</p>
                </div>
                <div>
                  <p className="text-xs text-[#BDBDBD]">制作期間</p>
                  <p className="font-bold text-[#222]">{item.period}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#828282]">課題</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#4F4F4F]">
                    {item.challenge}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary-500">解決策</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#4F4F4F]">
                    {item.solution}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-green-600">成果</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#4F4F4F]">
                    {item.result}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-20 text-center">
        <h2 className="text-xl font-bold text-[#222]">
          あなたの企業でも、映像の力を活用しませんか？
        </h2>
        <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/register" className="btn-primary text-sm">
            無料で企業登録
          </Link>
          <Link href="/creators" className="btn-secondary text-sm">
            クリエイターを探す
          </Link>
        </div>
      </div>
    </div>
  );
}
