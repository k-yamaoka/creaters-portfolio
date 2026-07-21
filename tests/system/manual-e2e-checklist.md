# AILIER システムテスト (E2E) 手動チェックリスト

**対象バージョン**: `main` (2026-07-21 時点)
**環境**: ローカル `npm run dev` または Vercel Preview / Production

自動 E2E (Playwright) は未セットアップのため、下記手順を **クリエイター アカウント / 企業アカウント / 管理者アカウント** の 3 者を使い分けて手動実行する。

---

## S1. 登録・オンボーディング

| # | 手順 | 期待 |
|---|---|---|
| S1-1 | `/register` にアクセス | 「創設メンバー枠 残り X / 50 名」のバッジが表示される |
| S1-2 | 表示名 `ああああ` で登録試行 | 「同じ文字の繰り返しは使用できません」エラー |
| S1-3 | 表示名 `admin` で登録試行 | 「使用できません」エラー |
| S1-4 | 表示名 `テストクリエイター` + creator + individual で登録 | メール確認画面 |
| S1-5 | メール確認クリック → `/onboarding` にリダイレクト | STEP 1 / STEP 2 の 2 ステップ ウィザードが開く |
| S1-6 | STEP 1: 個人 / 法人 選択 → 次へ | STEP 2 に進む |
| S1-7 | STEP 2: ドラッグ&ドロップ で mp4 ファイル + YouTube URL を混在で 追加 | 各アイテムのサムネイル プレビューが表示 |
| S1-8 | 「投稿して公開する」 | `/dashboard?welcome=1` に遷移、ポートフォリオが登録されている |
| S1-9 | `/creators` を開く | 自分のプロフィールが 一覧に **表示される** (is_searchable=true) |

## S2. 案件発注 → 仮払い → 制作 → 納品 → 検収

以下は **企業アカウント (client) と クリエイター アカウント (creator) の 2 者** で並行実行:

| # | 手順 | 期待 |
|---|---|---|
| S2-1 | client: `/creators/<id>` からクリエイターに 「依頼を相談」 → order 作成 | 取引詳細画面が開く。**上部に「⚠️ 仮払いが完了するまで作業を開始しないでください」警告** |
| S2-2 | creator: 同 order を開く | 同じ警告が表示。**「納品」ボタンが disabled** |
| S2-3 | client: 「発注に進む (契約へ)」 → 「仮払いする (Stripe)」 | escrow_status=held に変わり、警告バナー消える |
| S2-4 | creator: **納品ボタンが有効化** | ← 確認 |
| S2-5 | client/creator: 「データ共有 → 制作へ」 | status=production |
| S2-6 | creator: 納品 | status=delivered、client 側に **auto_approve_at (+7 日) が表示** |
| S2-7 | client: 「検収完了」 | escrow_status=released、payout_scheduled_date が計算されて表示 |
| S2-8 | creator: `/dashboard/payouts` | 該当 order が「入金予定」に集計されている |

## S3. 仮払い前の納品ブロック (最重要ガード)

| # | 手順 | 期待 |
|---|---|---|
| S3-1 | 新規 order を consultation 状態のまま creator が API を直叩き: `curl -X POST /api/orders/<id>/deliver -H "Cookie: ..."` | **403 `PRECONDITION_NOT_IN_PROGRESS`** |
| S3-2 | contract 状態 (escrow pending) で同じ | **403 `ESCROW_NOT_FUNDED`** |
| S3-3 | production 状態で escrow held のとき | 200 `{ ok: true, status: "delivered" }` |

## S4. 修正依頼と上限ガード

| # | 手順 | 期待 |
|---|---|---|
| S4-1 | order を max_revisions=1 で作成 → delivered まで進める | delivered 状態に到達 |
| S4-2 | client: 取引詳細 で 「修正を依頼」 | 「これが最後の無償修正です」警告が表示 (`LAST_FREE_REVISION`) |
| S4-3 | creator: 再納品 (production→delivered) | ステータス delivered |
| S4-4 | client: 再度 「修正を依頼」 | **402 `REVISION_LIMIT_EXCEEDED`** エラー ダイアログ。「追加発注の対象」文言 |
| S4-5 | 取引詳細ページに 「上限に達しました」バナー が常時表示 | ← 確認 |

## S5. 途中終了 (自爆防止 モーダル)

| # | 手順 | 期待 |
|---|---|---|
| S5-1 | production 状態 の order で creator が 「途中終了を申請する」ボタン | **全画面 モーダル** が開く。「⚠️ 警告：同意すると仮払い金は全額発注者に返金され、あなたの報酬は『ゼロ』になります。」の文言、『ゼロ』が赤バッジ |
| S5-2 | チェックボックス OFF の状態 | 「途中終了を確定する」ボタン が **disabled** |
| S5-3 | 理由 未入力 のまま チェックボックス ON | ボタン依然 disabled |
| S5-4 | 「同意する前に」セクションの「運営に相談する」を押下 | モーダルが閉じ、トラブル ウィザードが開く |
| S5-5 | 戻って 理由入力 + チェック ON → 「途中終了を確定する」 | 200、order が cancelled 状態 + escrow refunded + 「キャンセル済み」snapshot 表示 (返金 100%, 補償 0) |

## S6. トラブル報告ウィザード (STEP1 順序ガード)

| # | 手順 | 期待 |
|---|---|---|
| S6-1 | creator: 取引詳細 で 「運営に相談する」 | ウィザード モーダルが開く |
| S6-2 | 「連絡が来ない」を選択 | STEP1「催促」ブロックに **緑チェック なし**、STEP3 の裁定申請 ボタンは表示されない |
| S6-3 | 「メッセージを送る」→ 相手にメッセージ 1 通送信 → 戻る | STEP1 に緑チェック ✓、STEP3 の入力フォームが開く |
| S6-4 | 「不当な修正を求められた」を選択 (再度 wizard) | STEP1 ✓ (前で送信済), STEP2 は revision_count_used=0 なら未達 |
| S6-5 | client 側から 「修正を依頼」実行 → 戻る | STEP2 ✓, STEP3 が活性化 |
| S6-6 | 理由入力 → 「運営に裁定を申請する」 | 200 `dispute_id` 返却、取引詳細 上部に「運営: 受付しました」バッジ |

## S7. 未納品自動キャンセル (Cron)

| # | 手順 | 期待 |
|---|---|---|
| S7-1 | production 状態 の order で client が催促 (`/api/orders/<id>/remind`) | 200、`orders.nondelivery_deadline_at` が +7 日 でセット (DB 直接確認) |
| S7-2 | DB で `nondelivery_deadline_at` を 過去 に手動更新 | 準備完了 |
| S7-3 | `curl -H "Authorization: Bearer <CRON_SECRET>" /api/cron/orders-nondelivery-cancel` | 200 `{ cancelled: 1 }` |
| S7-4 | order を確認 | status=cancelled, escrow_status=refunded, cancel_stage=pre_start (100% 返金), `creator_penalties` に nondelivery 行 追加 |

## S8. みなし検収 (Cron)

| # | 手順 | 期待 |
|---|---|---|
| S8-1 | delivered 状態 の order で `auto_approve_at` を 過去 に手動更新 | 準備 |
| S8-2 | `curl -H "Authorization: Bearer <CRON_SECRET>" /api/cron/orders-auto-approve` | 200 `{ approved: 1 }` |
| S8-3 | order を確認 | escrow_status=released, `auto_approved_at` セット, payout_status=scheduled |

## S9. 通報 → 自動非公開

| # | 手順 | 期待 |
|---|---|---|
| S9-1 | account A で 別 creator の portfolio_item を通報 (`/api/reports`) | 200 (auto_unpublished=false)、運営に Email 通知 |
| S9-2 | account B (別 IP) で 同 item を通報 | 200 (2 件目) |
| S9-3 | account C (別 IP) で 同 item を通報 | 200、**auto_unpublished=true**、`/creators/<id>` から当該 item が **非表示** に |
| S9-4 | admin: `/admin/moderation` を開く | 該当 item が「非公開/削除済み」一覧に表示、監査ログに `auto_unpublish` 行 |

## S10. 管理者 モデレーション

| # | 手順 | 期待 |
|---|---|---|
| S10-1 | admin: `/admin/moderation` で 非公開 item を「復元」→ 理由 空 で 実行 | 「理由の記入は必須です」エラー |
| S10-2 | 理由入力 → 実行 | 200、状態 published に戻る、監査ログに `restore` 行、クリエイターに Email 通知 (異議申立て導線含む) |
| S10-3 | admin: item を「削除」 → 理由入力 → 実行 | moderation_status=deleted、公開一覧から完全消滅、管理画面には残る |

## S11. データ保持 (2 年)

| # | 手順 | 期待 |
|---|---|---|
| S11-1 | 完了済み order で `data_retention_until` が **completed_at + 2 年** にセットされている (DB 直接確認) | ← 確認 |
| S11-2 | 関連 messages 全件の `retention_until` も同じ値 | ← 確認 |
| S11-3 | DB で `data_retention_until` を 過去 に手動更新 | 準備 |
| S11-4 | `curl -H "Authorization: Bearer <CRON_SECRET>" /api/cron/data-retention` | 200、messages 物理削除 + orders soft_deleted_at セット |
| S11-5 | 一般 UI から 該当 order にアクセス | 404 / 見えない (soft_deleted のため) |

---

## 実施記録テンプレート

各セクション実施後、下記を記録:

```
S{N}-{番号}: PASS/FAIL/BLOCKED [備考]
```

FAIL 時は Playwright での自動化 or DB 状態確認スクリプトの追加を検討。
