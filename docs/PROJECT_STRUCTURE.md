# プロジェクト構造ガイド

## ディレクトリ構造

```
tumiki-recorder/
├── src/                          # バックエンドコード（Cloudflare Workers）
│   ├── worker.js                 # メインWorkerハンドラ
│   ├── database-adapter.js       # データベースアダプタ
│   ├── firestore-rest-client.js  # Firestore REST APIクライアント
│   └── utils/                    # ユーティリティ
│       ├── cache.js              # メモリキャッシュ
│       ├── database.js           # データベースヘルパー
│       ├── error-handler.js      # エラーハンドリング
│       ├── logger.js             # ロギング
│       └── response.js           # レスポンスヘルパー
│
├── docs/                         # プロジェクトドキュメント
│   ├── CLAUDE.md                 # Claude Code設定
│   ├── README.md                 # プロジェクト概要
│   ├── FIRESTORE_MIGRATION_COMPLETE.md  # Firestore移行完了ガイド
│   ├── FIRESTORE_MIGRATION_PLAN.md      # Firestore移行計画
│   ├── MOBILE_OPTIMIZATION.md           # モバイル最適化ガイド
│   ├── OPTIMIZATION_IMPROVEMENTS.md     # パフォーマンス最適化
│   ├── MAIN_HTML_MODIFICATIONS.md       # main.html変更履歴
│   ├── setup-kv.md                      # Cloudflare KV設定
│   └── PROJECT_STRUCTURE.md             # このファイル
│
├── archive/                      # 旧ファイル（使用していない）
│   ├── worker.js                 # 旧勤怠システムWorker
│   ├── attendance.html           # 旧勤怠打刻画面
│   ├── attendance.js             # 旧勤怠打刻スクリプト
│   └── dashboard.html            # 旧ダッシュボード
│
├── index.html                    # ログイン画面
├── login.js                      # ログインスクリプト
├── main.html                     # メイン記録画面
├── service-worker.js             # Service Worker（PWA/オフライン対応）
├── manifest.json                 # PWAマニフェスト
├── style.css                     # コンパイル済みCSS
├── input.css                     # Tailwind CSS入力
├── tailwind.config.js            # Tailwind CSS設定
├── wrangler.toml                 # Cloudflare Workers設定
└── package.json                  # npm設定

# Google Apps Script参照ファイル（連携先）
code.gs                           # Google Sheets Apps Script（参照用）
processBillingCodes.gs            # 請求コード処理（参照用）
```

## ファイル分類

### アクティブファイル（使用中）

#### フロントエンド
- `index.html` - ログイン画面
- `login.js` - ログインロジック
- `main.html` - 移動支援記録入力画面（メイン機能）
- `service-worker.js` - PWAオフライン対応

#### バックエンド（Cloudflare Workers）
- `src/worker.js` - APIハンドラ
- `src/database-adapter.js` - Firestoreアダプタ
- `src/firestore-rest-client.js` - Firestore REST API
- `src/utils/*` - 各種ユーティリティ

#### 設定ファイル
- `wrangler.toml` - Cloudflare Workers設定
- `package.json` - npm依存関係
- `tailwind.config.js` - Tailwind CSS設定
- `manifest.json` - PWA設定

#### ドキュメント
- `docs/` - 全てのプロジェクトドキュメント

### アーカイブファイル（使用していない）

`archive/` ディレクトリに移動済み:
- `worker.js` - 旧勤怠システムWorker（現在未使用）
- `attendance.html/js` - 旧勤怠打刻機能（現在未使用）
- `dashboard.html` - 旧ダッシュボード（現在未使用）

### 参照ファイル（Google Apps Script）

連携先のGoogle SheetsのApps Scriptコード（コピー）:
- `code.gs` - メインGASコード
- `processBillingCodes.gs` - 請求コード処理

これらは**参照用**であり、tumiki-recorderでは使用していません。

## 主要な機能とファイルの対応

### 1. 認証・ログイン
- フロントエンド: `index.html`, `login.js`
- バックエンド: `src/worker.js` の `handleLogin()`
- データソース: Firestore `employees` コレクション

### 2. 移動支援記録入力
- フロントエンド: `main.html`
- バックエンド: `src/worker.js` の `handleGetData()`, `handleRecordCreate()`
- データソース: Firestore `users`, `employees`, `csv-schedules`, `monthly_hours`

### 3. オフライン対応（PWA）
- Service Worker: `service-worker.js`
- キャッシュ戦略: Cache First（静的）, Network First（API）
- PWA設定: `manifest.json`

### 4. パフォーマンス最適化
- サーバーサイドキャッシュ: `src/utils/cache.js`
- クライアントサイドキャッシュ: `service-worker.js`
- Firestore呼び出し削減: 10分間のメモリキャッシュ

## APIエンドポイント

### 認証
- `POST /api/auth/login` - ログイン認証

### データ取得
- `GET /api/data` - 利用者・支援員・残時間データ取得

### 記録操作
- `POST /api/records` - 記録保存
- `GET /api/records/:userId/:date` - 記録取得

## データベース構造

### Firestoreコレクション

#### employees
- ユーザー（支援員）情報
- フィールド: id, name, password, role, affiliation, etc.

#### users
- 利用者情報
- フィールド: id, name, behaviorSupport, mobilitySupport, hospitalSupport

#### csv-schedules
- 移動支援記録
- フィールド: id, userId, userName, date, startTime, endTime, duration, staff1, staff2, destination, serviceType, checkStatus, notes

#### monthly_hours
- 月次残時間データ
- ドキュメントID: `user_{userId}_{YYYY}-{MM}`
- フィールド: userId, year, month, behaviorSupport, mobilitySupport, hospitalSupport

## 開発ワークフロー

### ローカル開発
```bash
# CSS変更時
npm run watch:css

# ローカルサーバー起動
npm run dev
```

### デプロイ
```bash
# 本番デプロイ
npm run deploy
```

### シークレット設定
```bash
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
wrangler secret put FIREBASE_PROJECT_ID
wrangler secret put JWT_SECRET
```

## ドキュメント参照ガイド

| 目的 | ドキュメント |
|------|-------------|
| プロジェクト概要 | `docs/README.md` |
| Firestore移行 | `docs/FIRESTORE_MIGRATION_COMPLETE.md` |
| モバイル最適化 | `docs/MOBILE_OPTIMIZATION.md` |
| パフォーマンス改善 | `docs/OPTIMIZATION_IMPROVEMENTS.md` |
| main.html変更履歴 | `docs/MAIN_HTML_MODIFICATIONS.md` |
| Claude Code設定 | `docs/CLAUDE.md` |

## メンテナンスガイド

### 新機能追加時
1. `src/worker.js` にAPIハンドラを追加
2. フロントエンド（HTML/JS）にUI追加
3. 必要に応じて `service-worker.js` のキャッシュ戦略を更新
4. ドキュメントを更新

### データ構造変更時
1. Firestoreコレクション構造を確認（他アプリとの共有に注意）
2. `src/worker.js` のデータ取得/保存ロジックを更新
3. フロントエンドのデータ処理を更新
4. キャッシュキーを更新（必要な場合）

### パフォーマンス改善時
1. `src/utils/cache.js` のTTL設定を調整
2. `service-worker.js` のキャッシュ戦略を見直し
3. ログで効果を測定

## トラブルシューティング

### よくある問題

#### キャッシュが更新されない
- Service Workerを再登録: ブラウザ開発者ツール → Application → Service Workers → Unregister
- Cloudflare Workersのキャッシュはメモリキャッシュなので自動的に期限切れ

#### 認証エラー
- JWT_SECRETが正しく設定されているか確認
- トークン有効期限（24時間）を確認

#### Firestore接続エラー
- FIREBASE_*シークレットが正しく設定されているか確認
- Firestoreサービスアカウントの権限を確認

## 関連リソース

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Firestore REST API: https://firebase.google.com/docs/firestore/use-rest-api
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
