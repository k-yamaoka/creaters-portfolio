import type { Metadata } from "next";
import { getCreators } from "@/lib/supabase/queries";
import { CreatorsPageClient } from "./creators-client";

export const metadata: Metadata = {
  title: "クリエイターを探す",
  description:
    "ジャンル・予算・実績で映像クリエイターを検索。ポートフォリオを見て最適なクリエイターを見つけましょう。",
};

export default async function CreatorsPage() {
  const creators = await getCreators();

  return <CreatorsPageClient creators={creators} />;
}
