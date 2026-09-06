/**
 * SEO-010: JSON-LD 構造化データ 出力コンポーネント。
 *
 * Google / Bing / SNS が読み取る schema.org 準拠の JSON を、
 * <script type="application/ld+json"> として ページに埋め込む。
 * Server Component なので SSR で 確実に クローラーへ届く。
 *
 * dangerouslySetInnerHTML は 静的な JSON.stringify 結果のみに使う。
 * ユーザー入力 (creator の display_name / bio 等) は JSON.stringify が
 * 自動 escape するため XSS リスクなし (`<` / `>` は Unicode escape される)。
 */

type Props = {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
};

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}
