export type AiCreator = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  headline: string;
  specialty: string;
  tools: string[];
  genres: string[];
  priceFrom: number;
  deliveryDays: number;
  works: number;
  rating: number;
  location: string;
  bio: string;
  highlights: string[];
  packages: {
    name: string;
    price: number;
    deliverables: string;
    revisions: string;
    duration: string;
  }[];
  samples: {
    title: string;
    thumbnail: string;
    client: string;
    metrics: string;
  }[];
};

export const AI_CREATORS: AiCreator[] = [
  {
    id: "aoi-tanaka",
    name: "田中 葵",
    handle: "@aoi_ai",
    avatar: "linear-gradient(135deg, #ff4d9d 0%, #9d5cff 100%)",
    headline: "Meta広告のAIクリエイティブ量産が得意",
    specialty: "SNS広告動画",
    tools: ["Sora 2", "Runway Gen-4", "Topaz", "Premiere"],
    genres: ["Meta広告", "Instagram Reels", "縦型動画"],
    priceFrom: 30000,
    deliveryDays: 3,
    works: 142,
    rating: 4.9,
    location: "東京",
    bio: "元・広告代理店プランナー。Meta/Instagram広告のAB案を1週間で50案出すスタイル。CTR改善実績多数。",
    highlights: [
      "1案件で平均30案のクリエイティブを納品",
      "Meta広告CTR平均1.8倍改善実績",
      "化粧品/D2C/SaaS業界での実績多数",
    ],
    packages: [
      {
        name: "ライト",
        price: 30000,
        deliverables: "縦型15秒動画 3本",
        revisions: "2回まで",
        duration: "3営業日",
      },
      {
        name: "スタンダード",
        price: 100000,
        deliverables: "縦型15-30秒動画 10本",
        revisions: "5回まで",
        duration: "1週間",
      },
      {
        name: "プロ",
        price: 300000,
        deliverables: "30本+ABテスト設計",
        revisions: "無制限",
        duration: "2週間+月次MTG",
      },
    ],
    samples: [
      {
        title: "コスメD2C ローンチキャンペーン",
        thumbnail: "linear-gradient(135deg, #ff8ec0, #ff4d9d)",
        client: "化粧品スタートアップ",
        metrics: "CTR 2.3% / CPA 38%改善",
      },
      {
        title: "SaaS無料トライアル誘導広告",
        thumbnail: "linear-gradient(135deg, #4dd5f7, #9d5cff)",
        client: "HRTech企業",
        metrics: "CV数 1.7倍",
      },
      {
        title: "サブスクサービス認知広告",
        thumbnail: "linear-gradient(135deg, #ffae3b, #ff4d9d)",
        client: "動画配信サービス",
        metrics: "リーチ 250万",
      },
    ],
  },
  {
    id: "ryo-suzuki",
    name: "鈴木 涼",
    handle: "@ryo_motion",
    avatar: "linear-gradient(135deg, #4dd5f7 0%, #2e6ca0 100%)",
    headline: "EC商品PRアニメーションのスペシャリスト",
    specialty: "EC商品PR",
    tools: ["Midjourney", "Kling 2.x", "After Effects"],
    genres: ["EC商品PR", "Shopify向け", "アニメーション"],
    priceFrom: 80000,
    deliveryDays: 5,
    works: 89,
    rating: 4.8,
    location: "大阪",
    bio: "Shopify/BASE出店者向けに、撮影不要の商品PR動画を制作。商品写真からアニメーションを生成する独自パイプライン。",
    highlights: [
      "商品写真1枚から30秒動画を生成",
      "EC事業者100社以上の取引実績",
      "コンバージョン重視のシナリオ設計",
    ],
    packages: [
      {
        name: "ライト",
        price: 80000,
        deliverables: "15秒商品PR 1本",
        revisions: "2回まで",
        duration: "5営業日",
      },
      {
        name: "スタンダード",
        price: 180000,
        deliverables: "30秒PR + バリエーション3本",
        revisions: "3回まで",
        duration: "10営業日",
      },
      {
        name: "プロ",
        price: 350000,
        deliverables: "ブランドムービー1本 + バリエーション5本",
        revisions: "無制限",
        duration: "3週間",
      },
    ],
    samples: [
      {
        title: "アパレルD2C 春コレクション",
        thumbnail: "linear-gradient(135deg, #f7d9c4, #ff8ec0)",
        client: "Shopifyブランド",
        metrics: "コンバージョン率 1.4倍",
      },
      {
        title: "食品ECブランドストーリー",
        thumbnail: "linear-gradient(135deg, #cfe3ce, #4dd5f7)",
        client: "オーガニック食品",
        metrics: "サイト滞在時間 +85%",
      },
    ],
  },
  {
    id: "yuna-kobayashi",
    name: "小林 由奈",
    handle: "@yuna_cinema",
    avatar: "linear-gradient(135deg, #9d5cff 0%, #5b2dd1 100%)",
    headline: "Veoでブランドコンセプトムービー",
    specialty: "ブランドコンセプト",
    tools: ["Veo 3", "ElevenLabs", "DaVinci Resolve"],
    genres: ["ブランドムービー", "コンセプト映像", "B2B"],
    priceFrom: 250000,
    deliveryDays: 14,
    works: 47,
    rating: 5.0,
    location: "京都",
    bio: "シネマティック寄りのブランド表現を、Veo + 音響デザインで作る。中堅企業のコーポレートサイトトップ動画を中心に。",
    highlights: [
      "シネマグレードのカラーグレーディング",
      "音響設計込みでブランド体験を構築",
      "1分尺で本格コーポレート映像",
    ],
    packages: [
      {
        name: "コンセプト60秒",
        price: 250000,
        deliverables: "60秒ブランドムービー1本",
        revisions: "3回まで",
        duration: "2週間",
      },
      {
        name: "コンセプト90秒+派生",
        price: 480000,
        deliverables: "90秒本編 + 30秒派生3本",
        revisions: "5回まで",
        duration: "3週間",
      },
    ],
    samples: [
      {
        title: "BtoB SaaS コーポレートトップ",
        thumbnail: "linear-gradient(135deg, #1a1340, #9d5cff)",
        client: "HRTechユニコーン",
        metrics: "離脱率 32%改善",
      },
    ],
  },
  {
    id: "mei-sato",
    name: "佐藤 芽依",
    handle: "@mei_tiktok",
    avatar: "linear-gradient(135deg, #ffae3b 0%, #ff4d9d 100%)",
    headline: "TikTok縦型広告で爆発的に伸ばす",
    specialty: "TikTok広告",
    tools: ["Sora 2", "CapCut Pro", "Suno"],
    genres: ["TikTok", "縦型動画", "Z世代向け"],
    priceFrom: 25000,
    deliveryDays: 2,
    works: 203,
    rating: 4.7,
    location: "東京",
    bio: "TikTok広告に特化。トレンド音源とAI生成映像の組み合わせで、若年層のエンゲージメントを最大化。",
    highlights: [
      "TikTok広告のCTR平均2.5%超",
      "1日10本の高速量産が可能",
      "Z世代の感性に振り切った構成",
    ],
    packages: [
      {
        name: "ライト",
        price: 25000,
        deliverables: "15秒動画 3本",
        revisions: "1回まで",
        duration: "2営業日",
      },
      {
        name: "スタンダード",
        price: 90000,
        deliverables: "10本セット",
        revisions: "3回まで",
        duration: "1週間",
      },
    ],
    samples: [],
  },
  {
    id: "kenji-watanabe",
    name: "渡辺 健司",
    handle: "@kenji_mv",
    avatar: "linear-gradient(135deg, #e83fae 0%, #5b2dd1 100%)",
    headline: "Runway × アーティストMV制作",
    specialty: "ミュージックビデオ",
    tools: ["Runway Gen-4", "Stable Diffusion", "Premiere"],
    genres: ["MV", "アーティスト", "実験映像"],
    priceFrom: 150000,
    deliveryDays: 10,
    works: 38,
    rating: 4.9,
    location: "横浜",
    bio: "インディーズアーティスト向けMVを得意とする。AIならではの非現実表現で、楽曲の世界観を拡張する。",
    highlights: [
      "AIアートディレクションに強み",
      "アーティスト本人写真からの拡張表現",
      "短期納品でリリースに間に合わせる",
    ],
    packages: [
      {
        name: "ショートMV",
        price: 150000,
        deliverables: "60秒MV1本",
        revisions: "2回まで",
        duration: "10営業日",
      },
      {
        name: "フルMV",
        price: 380000,
        deliverables: "3〜4分尺MV1本",
        revisions: "5回まで",
        duration: "3週間",
      },
    ],
    samples: [],
  },
  {
    id: "hiroshi-yamada",
    name: "山田 宏",
    handle: "@hiroshi_saas",
    avatar: "linear-gradient(135deg, #4dd5f7 0%, #9d5cff 100%)",
    headline: "SaaS製品の機能紹介動画",
    specialty: "SaaS製品紹介",
    tools: ["Midjourney", "After Effects", "Veo 3"],
    genres: ["プロダクトデモ", "オンボーディング", "B2B"],
    priceFrom: 120000,
    deliveryDays: 7,
    works: 64,
    rating: 4.8,
    location: "福岡",
    bio: "B2B SaaSのプロダクトデモ動画を専門。UI解説とビジュアル説明を組み合わせ、複雑な機能を1分で理解させる構成が得意。",
    highlights: [
      "プロダクト管理経験あり、UX観点を持つ",
      "UI解説の図解構成が得意",
      "英語版同時納品にも対応",
    ],
    packages: [
      {
        name: "機能紹介60秒",
        price: 120000,
        deliverables: "60秒紹介動画1本",
        revisions: "3回まで",
        duration: "1週間",
      },
    ],
    samples: [],
  },
  {
    id: "akane-mori",
    name: "森 茜",
    handle: "@akane_anim",
    avatar: "linear-gradient(135deg, #ff8ec0 0%, #ffae3b 100%)",
    headline: "アニメ調キャラ広告でブランド化",
    specialty: "キャラクター広告",
    tools: ["Kling 2.x", "Photoshop", "Live2D"],
    genres: ["キャラ広告", "ゲーム", "アプリ"],
    priceFrom: 80000,
    deliveryDays: 7,
    works: 51,
    rating: 4.8,
    location: "京都",
    bio: "ゲーム会社出身。アニメ調のキャラクター表現でブランドのマスコット化を提案。Klingでの一貫性維持に独自のプロンプト手法。",
    highlights: [
      "キャラクターブランディングの提案も可能",
      "アニメ業界の作画経験10年",
      "リップシンク・モーション制御が得意",
    ],
    packages: [
      {
        name: "キャラ広告15秒",
        price: 80000,
        deliverables: "15秒動画 1本",
        revisions: "2回まで",
        duration: "1週間",
      },
    ],
    samples: [],
  },
  {
    id: "sho-nakamura",
    name: "中村 翔",
    handle: "@sho_recruit",
    avatar: "linear-gradient(135deg, #ffae3b 0%, #4dd5f7 100%)",
    headline: "AI採用動画のパイオニア",
    specialty: "採用動画",
    tools: ["Veo 3", "Sora 2", "Premiere"],
    genres: ["採用動画", "企業文化", "中堅企業向け"],
    priceFrom: 200000,
    deliveryDays: 14,
    works: 29,
    rating: 4.9,
    location: "名古屋",
    bio: "AI生成映像で「人を映さない採用動画」を確立。社員プライバシー配慮+撮影コストゼロで、中堅企業から好評。",
    highlights: [
      "人物撮影不要の採用ブランディング",
      "中堅企業(50〜500名)の採用支援実績多数",
      "応募者数の前年比150%実績",
    ],
    packages: [
      {
        name: "採用動画60秒",
        price: 200000,
        deliverables: "60秒採用動画1本",
        revisions: "3回まで",
        duration: "2週間",
      },
      {
        name: "採用パッケージ",
        price: 450000,
        deliverables: "60秒本編+派生3本+静止画10点",
        revisions: "無制限",
        duration: "3週間",
      },
    ],
    samples: [],
  },
];

export function getCreator(id: string): AiCreator | undefined {
  return AI_CREATORS.find((c) => c.id === id);
}
