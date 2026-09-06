/**
 * AbortController ヘルパ (UPL-005: アップロード キャンセル用)。
 *
 * withAbort:
 *   任意の Promise に abort signal を後付けするラッパ。
 *   fetch のように signal 引数を受け付けない SDK (Supabase の
 *   uploadToSignedUrl 等) と組み合わせて、ユーザーが「キャンセル」を
 *   押した瞬間に UI 側の await を打ち切るために使う。
 *   ※ 元の非同期処理自体は cancel されず背後で走り続ける場合があるが、
 *      UI 側の「アップロード中」表示は即座に閉じられる。
 */
export function withAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(makeAbortError());
      return;
    }
    const onAbort = () => reject(makeAbortError());
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      }
    );
  });
}

export function makeAbortError(): Error {
  // DOMException が使える環境 (ブラウザ) はそれで、無ければ Error で代替
  if (typeof DOMException !== "undefined") {
    return new DOMException("Aborted", "AbortError");
  }
  const e = new Error("Aborted");
  e.name = "AbortError";
  return e;
}

/** e が AbortController.abort() 由来か判定 */
export function isAbortError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const n = (e as { name?: unknown }).name;
  return n === "AbortError";
}
