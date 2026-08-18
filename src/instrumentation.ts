/**
 * Next.js instrumentation hook.
 * Vercel は @vercel/otel の registerOTel() を Node ランタイムで自動有効化。
 * Edge runtime ではスキップ (未サポート)。
 *
 * これで各 API route / Server Action の実行時間・エラーが自動で
 * Vercel Observability に集約される。追加設定は不要 (Vercel Dashboard で確認)。
 */
import { registerOTel } from "@vercel/otel";

export function register() {
  registerOTel({ serviceName: "ailier" });
}
