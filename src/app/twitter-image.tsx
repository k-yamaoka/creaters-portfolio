/**
 * Twitter Card (summary_large_image) 用 画像。
 * opengraph-image と 同一の 動的画像を Twitter 経路にも 注入する。
 * Next.js 15 は runtime/size/contentType/alt を静的解析するため
 * default export のみ 再利用して 他は 直接定義する。
 */
import OpengraphImage from "./opengraph-image";

export const runtime = "edge";
export const alt = "アイムビ — AIクリエイター特化型の企業マッチングプラットフォーム";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
