# AILIER 全ページ + 全機能 インベントリ

最終更新: 2026-08-10
生成方法: 6 並列 Explore agent によるコードベース クローリング

---

## 📄 A. 公開ページ (17)

| URL | 目的 | 主な機能 | 状態 |
|---|---|---|---|
| `/` | ランディング | 100svh Hero 動画 (10 秒切替) / CTA 2 本 / Works ダイジェスト / AI ニュース 8 件 / FAQ 6 件 | ✅ |
| `/creators` | クリエイター検索一覧 | ジャンル / 料金 / ツール絞込 / いいね反映 / 詳細遷移 | ✅ |
| `/creators/[id]` | クリエイター詳細 | 代表作 / ポートフォリオ / 最低金額 / AI 見積もりチャット / QR / 相談ボタン / SNS / 類似 creator | ✅ (星評価だけ準備中) |
| `/portfolios` | 作品ギャラリー | 縦横混在サムネ / いいね / 詳細遷移 | ✅ |
| `/jobs` | 案件一覧 | ステータス絞込 / creator おすすめ順 | ✅ |
| `/jobs/[id]` | 案件詳細 | 予算 / 業種 / 編集要件 / 応募ボタン (要ログイン) | ✅ |
| `/pricing` | 料金体系 | クリエイター 0% / 企業 15% / 他社比較 | ✅ |
| `/for-business` | 企業向け LP | 3 ベネフィット + CTA | ✅ |
| `/how-it-works` | 使い方 3 ステップ | 企業側 / クリエイター側 | ✅ |
| `/creator-guide` | クリエイターガイド | 著作権 / 透明性 / 創設メンバー残数 | ✅ |
| `/case-studies` | 導入事例 | 3 件 (課題 → 解決 → 効果) | ⚠️ サンプル静的データ |
| `/company` | 運営会社 | 会社情報 / ミッション | ✅ |
| `/help` | ヘルプ / FAQ | 手数料 / 支払 / 著作権 等 | ✅ |
| `/terms` | 利用規約 | 全条項 | ✅ |
| `/privacy` | プライバシー | 収集 / 利用 / 開示 | ✅ |
| `/ai-mock/*` | 社内検討モック 3 ページ | LP / creators / 詳細 | ⚠️ 本番公開状態 (要 noindex or 削除) |
| `/select-role` | 初回ロール選択 (OAuth 直後) | client / creator + 個人 / 法人 | ✅ |

---

## 🔐 B. 認証系ページ (6)

| URL | 目的 | 主な機能 | 状態 |
|---|---|---|---|
| `/login` | ログイン | メール / パスワード + Google + LINE OAuth + 「パスワード忘れ」リンク | ✅ |
| `/register` | 新規登録 | 表示名 (スパム名検証) / メール / パスワード + role + 事業形態 | ✅ |
| `/forgot-password` | パスワードリセット申請 | メール入力 → Supabase resetPasswordForEmail | ✅ |
| `/reset-password` | パスワード再設定 | 新 PW + 確認再入力 | ✅ |
| `/auth/callback` (route) | OAuth コールバック | code → session, blocklist check, open-redirect 対策 | ✅ |
| `/onboarding` | 新規 creator ウィザード | 表示名 / 事業形態 / 自己紹介 / 作品追加 2 ステップ | ✅ |

---

## 👤 C. Creator ダッシュボード (8)

| URL | 主な機能 |
|---|---|
| `/dashboard` | 基本情報エディタ / アバター / 早期メンバーバッジ / 手数料 0% カード / 総いいね / Stripe Connect ボタン / スカウトバナー / プロフィール非公開アラート / 最新アクティビティ 8 件 |
| `/dashboard/profile` | プロフィール編集 + 履歴書 PDF ダウンロード |
| `/dashboard/portfolio` | 作品 CRUD (mp4 / 画像 / URL 埋込) |
| `/dashboard/invitations` | スカウト受信箱 3 タブ (未回答 / 回答済 / 期限切れ) |
| `/dashboard/applications` | 応募済み案件一覧 + 未読バッジ |
| `/dashboard/payouts` | 出金申請 (最低 ¥5,000 / 手数料 ¥250 / Stripe Connect 実 API) + 入金明細 |
| `/dashboard/orders` | 取引一覧 (未読 → 更新順) |
| `/dashboard/likes` | いいねした作品一覧 |

---

## 🏢 D. Client ダッシュボード (7)

| URL | 主な機能 |
|---|---|
| `/dashboard` | 企業情報未登録アラート / 進行中取引 / 最新アクティビティ |
| `/dashboard/profile` | 企業情報編集 (会社名 / URL / 業種 / ロゴ / 適格請求書番号) |
| `/dashboard/jobs` | 自社案件管理一覧 (draft / open / closed) |
| `/dashboard/jobs/new` | 新規案件作成 |
| `/dashboard/jobs/[id]` | 案件詳細 + 応募者一覧 |
| `/dashboard/jobs/[id]/edit` | 案件編集 |
| `/dashboard/billing` | 支払い管理 (今月 / 累計 / 取引履歴) ⚠️ Customer Portal + 適格請求書 DL 準備中 |

---

## 🔄 E. 共通 (両ロール) ダッシュボード (3)

| URL | 主な機能 |
|---|---|
| `/dashboard/orders/[id]` | 取引詳細 (7 段階プログレスバー / 仮払前アラート / 状態別ボタン群 / 「運営に相談」ウィザード / 途中終了モーダル / メッセージスレッド / TODO バナー / レビュー投稿) |
| `/dashboard/messages/[partnerId]` | 二者間チャット (テンプレ / 添付 / 応募採否) |
| `/settings` | Email / パスワード / 退会 |

---

## 🛠 F. 管理画面 (6)

| URL | 主な機能 |
|---|---|
| `/admin` | KPI 7 枚 (会員数 / GMV / 手数料 / 進行中 等) ⚠️ 期間フィルタ・グラフなし |
| `/admin/users` | ユーザー一覧 (認証切替 / 停止・復帰) ⚠️ 検索・ページネーション・詳細画面なし |
| `/admin/jobs` | オープン案件一覧 → `/admin/jobs/[id]` で **手動スカウト** (タグ AND / 一括招待 500 字) |
| `/admin/orders` | 全 orders + 売上サマリー ⚠️ フィルタ / CSV / ページネーションなし |
| `/admin/disputes` | 対応必要 / 完了 2 セクション → `/admin/disputes/[id]` で **5 種裁定** (partial / full / reproduction / no_action / as_is) |
| `/admin/moderation` | 通報 / 非公開 / 常習者 / 監査ログ 30 件 + reason_category プルダウン unpublish / delete / restore |

**管理画面 全体で不足**: マスター管理 UI (tags / ai_tools / genres CRUD) / お知らせ配信 / 手数料率設定 / ユーザー詳細画面 / CSV 出力 / ページネーション

---

## ⚙️ G. API ルート (35+)

### 認証・オンボーディング (4)

| Method + Path | 目的 |
|---|---|
| `GET /api/auth/line` | LINE OAuth 開始 |
| `GET /api/auth/line/callback` | LINE OAuth 完了 + line_user_id 保存 |
| `POST /api/auth/set-role` | 初回 role 確定 |
| `POST /api/onboarding/complete` | オンボーディング終了マーク |

### 公開 / メディア (7)

| Method + Path | 目的 |
|---|---|
| `GET /api/ai-news` | 生成 AI ニュース (24h キャッシュ) |
| `GET /api/founding-creators/count` | 創設メンバー残枠 |
| `GET /api/image-proxy` | 画像 hotlink 中継 |
| `POST /api/likes` | いいねトグル |
| `POST /api/reviews` | レビュー投稿 |
| `POST /api/creators/[id]/estimate` | AI 見積もり (Claude Haiku 4.5) |
| `POST /api/portfolio/batch` | 作品一括登録 |

### アップロード (4)

| Method + Path | 目的 |
|---|---|
| `POST /api/upload/thumbnail` | 画像 (5MB, マジック検査, 30 日キャッシュ) |
| `POST /api/upload/video` | 動画直 (100MB) |
| `POST /api/upload/video/sign` | Storage 署名 URL |
| `POST /api/upload/message-attachment` | チャット添付 (10MB) |

### Jobs / Invitations (4)

| Method + Path | 目的 |
|---|---|
| `POST /api/jobs/apply` | 応募 |
| `POST /api/jobs/applications/update` | 採用時 order 自動生成 (consultation) |
| `POST /api/jobs/status` | 案件 close 時に order 一括生成 |
| `POST /api/invitations/[id]/respond` | accept / decline |

### Orders ライフサイクル (8)

| Method + Path | 目的 |
|---|---|
| `POST /api/orders/[id]/cancel` | キャンセル + **Stripe 実返金** |
| `POST /api/orders/[id]/deliver` | 納品 → client 通知 |
| `POST /api/orders/[id]/request-revision` | 修正依頼 → creator 通知 |
| `POST /api/orders/[id]/dispute` | 裁定申請 |
| `POST /api/orders/[id]/terminate` | 途中終了 + 100% 返金 + 相手通知 |
| `POST /api/orders/[id]/remind` | 催促 |
| `GET /api/orders/[id]/download-delivery` | 納品物 DL 記録 |
| `POST /api/orders/[id]/receipt` | 受領イベント記録 |

### Disputes / Payouts (2)

| Method + Path | 目的 |
|---|---|
| `POST /api/disputes/create` | 裁定 open (メッセージ or 催促必須) |
| `POST /api/payouts/request` | Stripe Connect 出金 (最低 5000 / 手数料 250) |

### Stripe (5)

| Method + Path | 目的 |
|---|---|
| `POST /api/stripe/connect` | Connect Express 口座作成 + onboarding |
| `POST /api/stripe/payment` | 仮払い Intent (manual capture) |
| `POST /api/stripe/payment/confirm` | held 遷移 |
| `POST /api/stripe/capture` | 検収 capture + payout schedule + creator 通知 |
| `POST /api/stripe/webhook` | 署名検証 + 5 events (succeeded / failed / canceled / refunded / dispute.created) |

### Admin (5)

| Method + Path | 目的 |
|---|---|
| `GET /api/admin/creators/search` | タグ AND 検索 |
| `POST /api/admin/jobs/[id]/invite` | 一括招待 (50 件 upper) |
| `POST /api/admin/disputes/[id]/ruling` | 5 種裁定 + **Stripe 実返金** |
| `POST /api/admin/portfolio/[id]/moderation` | unpublish / delete / restore |
| `POST /api/reports` | 通報 (24h/5 件 IP RL + 3 IP 自動非公開) |

---

## ⏰ H. Cron ジョブ (6, 全て日次 or 週次 / UTC 実行 / Bearer 認証)

| Path | Schedule (UTC) | JST | 内容 |
|---|---|---|---|
| `/api/cron/refresh-ai-news` | 22:00 | 07:00 | RSS 12 ソース再取得 + サムネ空欄補完 |
| `/api/cron/orders-auto-approve` | 05:00 | 14:00 | みなし検収 (delivered +7 日) → released + payout scheduled |
| `/api/cron/orders-deadline-reminder` | 00:00 | 09:00 | 納期 24h 前/超過 リマインダ |
| `/api/cron/orders-nondelivery-cancel` | 06:00 | 15:00 | 未納品自動キャンセル + 100% 返金 + penalty (weight=3) |
| `/api/cron/data-retention` | 04:00 日曜 | 13:00 | 2 年経過 messages 物理削除 + orders soft_delete |
| `/api/cron/suspend-repeat-offenders` | 03:00 | 12:00 | penalty score ≥ 15 で自動停止 + Email + Slack |

---

## 🎨 I. 主要 UI コンポーネント (再利用)

- **Hero 100svh 動画** (`hero-fullscreen.tsx`) — 10 秒 or 動画終了で切替
- **PrePaymentAlert** — 仮払い前ガード
- **TerminationConfirmDialog** — 自爆防止 全画面警告
- **TroubleReportWizard** — 運営相談 3 STEP ガード
- **CancelDialog** — 段階別内訳 preview + 同意 + 実行
- **DisputeAdminBadge** — 受付 / 確認 / 完了
- **PayoutWithdrawalPanel** — 実 API 接続済
- **PortfolioManager** — 5 点一括登録 / D&D / URL 埋込
- **InviteSection** — タグ検索 + 一括招待
- **RulingForm** — 5 種 + rate スライダー
- **MessageThread** — テンプレ / 添付 / 未読
- **OrderTodoBanner** — 状態別 次アクション導線

---

## 📊 サマリー

| 分類 | 件数 | 完成度 |
|---|---|---|
| 公開ページ | 17 | ⭐⭐⭐⭐ (case-studies サンプル、ai-mock 露出注意) |
| 認証 | 6 | ⭐⭐⭐⭐⭐ (パスワードリセット完備) |
| Creator Dashboard | 8 | ⭐⭐⭐⭐⭐ (出金 API 実接続済) |
| Client Dashboard | 7 | ⭐⭐⭐⭐ (Billing 一部準備中) |
| 共通 Dashboard | 3 | ⭐⭐⭐⭐⭐ |
| 管理画面 | 6 | ⭐⭐⭐ (マスター管理 / ページネーション / CSV 不足) |
| API ルート | 35+ | ⭐⭐⭐⭐⭐ |
| Cron ジョブ | 6 | ⭐⭐⭐⭐⭐ |

---

## 🔜 準備完了 → 上から順に着手可能な残タスク

1. **#8 Supabase Service Token ローテート** (ユーザー Dashboard 操作 5 分)
2. **#11 Supabase メールテンプレ 5 種を日本語化** (ユーザー Dashboard 操作 30 分)
3. **#12 Resend 独自ドメイン** (ドメイン確定待ち)
4. **管理画面 補完** (ユーザー詳細 / ページネーション / CSV / マスター管理)
5. **/ai-mock/\* を noindex or 削除**
6. **case-studies を本物 or 削除**
