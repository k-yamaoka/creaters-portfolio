import fs from "node:fs";
import path from "node:path";

/**
 * seed-orders (orders.setup.ts) が書き出した .auth/e2e-orders.json を
 * 型付きで読み込む helper。テストからは import して order id を取り出す。
 */

export type E2EOrderIds = {
  terminationOrderId: string;
  prePaymentOrderId: string;
  clientProfileId: string;
  creatorProfileId: string;
};

export function loadE2EOrderIds(): E2EOrderIds {
  const p = path.resolve(process.cwd(), ".auth/e2e-orders.json");
  if (!fs.existsSync(p)) {
    throw new Error(
      ".auth/e2e-orders.json が無い。先に `npx playwright test --project=orders-setup` を実行してください。"
    );
  }
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw) as E2EOrderIds;
}
