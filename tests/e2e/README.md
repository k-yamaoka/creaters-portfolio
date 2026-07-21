# Playwright E2E テスト

## セットアップ (初回のみ)

```
npm install                       # @playwright/test を含めて依存 install
npx playwright install chromium   # ブラウザ (100MB) を DL
```

## 実行

```
npm run e2e            # 全 project (smoke + safety-* + auth-setup)
npm run e2e:smoke      # 認証不要のスモークのみ (最速、依存ゼロ)
npm run e2e:safety     # 認証必須の安全性 (creator + client)
npm run e2e:headed     # ヘッドフル (ブラウザ表示)
npm run e2e:ui         # Playwright UI Runner
npm run e2e:report     # 直近の HTML レポート表示
```

サーバーは Playwright が自動で `npm run dev` を起動する (`playwright.config.ts`
の `webServer` 設定)。3000 番ポートが使用中なら既存を再利用する
(`reuseExistingServer: true`)。

## project 構成

| project | 対象 | 依存 | 認証 |
|---|---|---|---|
| `auth-setup` | test-creator / test-client を作成 + login | なし | service_role |
| `smoke` | 無認証で public route を叩く | なし | なし |
| `safety-creator` | 認証済み creator の安全性 UI | `auth-setup` | `.auth/creator.json` |
| `safety-client` | 認証済み client の安全性 UI | `auth-setup` | `.auth/client.json` |

## 認証 setup の仕組み

- `tests/e2e/setup/auth.setup.ts` が service_role で `test-creator@ailier.app` /
  `test-client@ailier.app` を upsert
- パスワード: `AilierE2ETest2026!` (定数)
- 作成後、UI 経由の login を実行し `storageState` を `.auth/*.json` に保存
- 以降の safety-* project は `use.storageState` でこの state を読み込み、
  認証済み状態でテストを開始

## 「取引が無いため skip」への対応 (次段)

safety テストの多くは「進行中 order が 1 件以上ある」ことを前提とし、無ければ
`test.skip` する設計。安定した CI 化するには:

1. `tests/e2e/setup/seed-orders.ts` を追加し、E2E 用に test-client → test-creator
   への order を 1 件 「production + escrow held」 状態で作成
2. `auth-setup` の後段で 1 回だけ実行
3. テスト完了後の tear-down で削除 (fixture 化)

現状は「本番 DB に触るリスク」を回避するため 手動セットアップ想定。テスト
用の別 Supabase project を用意して `E2E_BASE_URL` + 別 env で切り替える
運用が理想。

## トラブルシューティング

**Q. `webServer timeout`**
A. `npm run dev` の起動が 120 秒を超えている。`.env.local` の必須変数が
   欠けている可能性。`npm run dev` を手動で試して立ち上がるか確認。

**Q. `auth-setup` が admin_lookup_auth_user_by_email エラー**
A. Migration 00061 (SECURITY DEFINER RPC) が適用済みか確認。

**Q. `.auth/creator.json` が期限切れ**
A. `npx playwright test --project=auth-setup` で再生成。

**Q. E2E で本番 DB を汚したくない**
A. Supabase の Test / Preview branch を用意し、`.env.local.test` に別 URL /
   key を設定 → `NODE_ENV=test npm run e2e` で読み替える。
