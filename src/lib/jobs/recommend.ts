/**
 * クリエイターのプロフィールに対する、案件 (jobs) の「おすすめ度」スコア。
 *
 * 採点:
 * - 得意ジャンルが job.genres に完全一致 ×3
 * - ジャンル名が job のテキストに部分一致 ×1
 * - 強み / 得意尺 のキーワード一致 ×1
 * - bio の単語 (2 文字以上、最大 20 語) のテキスト出現 ×0.5
 *
 * 0 点 = マッチ要素なし。スコアが大きいほど推奨度が高い。
 */

export type RecommendableJob = {
  title: string;
  description: string;
  genres: string[];
};

export type RecommenderProfile = {
  genres: string[];
  strengths: string[];
  video_lengths: string[];
  bio: string;
};

export function recommendedScore(
  job: RecommendableJob,
  profile: RecommenderProfile | null
): number {
  if (!profile) return 0;
  const text =
    `${job.title} ${job.description} ${(job.genres ?? []).join(" ")}`.toLowerCase();
  let score = 0;
  for (const g of profile.genres ?? []) {
    if ((job.genres ?? []).includes(g)) score += 3;
    else if (g && text.includes(g.toLowerCase())) score += 1;
  }
  for (const s of profile.strengths ?? []) {
    if (s && text.includes(s.toLowerCase())) score += 1;
  }
  for (const l of profile.video_lengths ?? []) {
    if (l && text.includes(l.toLowerCase())) score += 1;
  }
  const bioWords = (profile.bio ?? "")
    .replace(/[、。,.!?！？\n]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 20);
  for (const w of bioWords) {
    if (text.includes(w.toLowerCase())) score += 0.5;
  }
  return score;
}
