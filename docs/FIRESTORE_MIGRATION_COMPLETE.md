# Firestore移行完了ガイド

## 移行概要

tumiki-recorderアプリケーションをGoogle Apps Script (GAS) + Sheetsバックエンドから、Cloudflare Workers + Firestoreバックエンドに完全移行しました。

## 変更されたファイル

### バックエンド

1. **src/worker.js** (新規作成)
   - Cloudflare Workerのメインハンドラ
   - 認証API (`/api/auth/login`)
   - データ取得API (`/api/data`)
   - 記録保存/取得API (`/api/records`, `/api/records/:userId/:date`)
   - 管理者API (`/api/admin/users`, `/api/admin/users/delete`)

2. **src/database-adapter.js** (renaissance-systemからコピー)
   - Firestore REST APIアダプタ

3. **src/firestore-rest-client.js** (renaissance-systemからコピー)
   - Firestore REST APIクライアント

4. **src/utils/** (renaissance-systemからコピー)
   - error-handler.js
   - logger.js
   - response.js
   - database.js

### フロントエンド

1. **login.js** (完全書き換え)
   - `/api/auth/login`エンドポイント使用
   - JWT トークンとuserRoleをsessionStorageに保存

2. **main.html** (部分修正)
   - `loadDataFromGAS()` 関数: `/api/data`エンドポイント使用に変更
   - `submitFormData()` 関数: `/api/records`エンドポイント使用に変更
   - `calculateDuration()` ヘルパー追加

3. **admin.js** (完全書き換え)
   - `/api/admin/users` エンドポイント使用
   - JWT認証トークンヘッダー追加

### 設定ファイル

1. **package.json**
   - `"type": "module"` 追加
   - dependencies: `bcryptjs` 追加
   - devDependencies: `wrangler` 追加

2. **wrangler.toml** (新規作成)
   - Cloudflare Workers設定
   - 環境変数: `DATABASE_TYPE = "firestore"`

## デプロイ手順

### 1. Cloudflare Workers シークレット設定

以下のコマンドでシークレットを設定してください：

```bash
wrangler secret put FIREBASE_CLIENT_EMAIL
# Firestoreサービスアカウントのメールアドレスを入力

wrangler secret put FIREBASE_PRIVATE_KEY
# Firestoreサービスアカウントの秘密鍵を入力（改行を含む完全な鍵）

wrangler secret put FIREBASE_PROJECT_ID
# FirebaseプロジェクトIDを入力

wrangler secret put JWT_SECRET
# JWT署名用のランダム文字列を入力（例: openssl rand -base64 32）
```

### 2. ローカルテスト

```bash
# 開発サーバー起動
npm run dev

# 別のターミナルでCSSビルド（必要に応じて）
npm run watch:css
```

ブラウザで `http://localhost:8787` にアクセスしてテスト。

### 3. 本番デプロイ

```bash
npm run deploy
```

デプロイ完了後、Cloudflare Workersのダッシュボードで公開URLを確認。

## Firestoreコレクション構造

### employees
- `id`: ユーザーID（文字列）
- `name`: 名前
- `password`: bcryptハッシュ化パスワード
- `role`: `'admin'` | `'user'`
- `affiliation`: 所属会社名
- その他のフィールド（furigana, workplace, permission等）

### users
- `id`: 利用者ID（数値）
- `name`: 利用者名
- `behaviorSupport`: { availableTime, usedTime, remainingTime }
- `mobilitySupport`: { availableTime, usedTime, remainingTime }
- `hospitalSupport`: { availableTime, usedTime, remainingTime }

### csv-schedules
- `id`: UUID
- `userId`: 利用者ID（数値）
- `userName`: 利用者名
- `date`: YYYY-MM-DD形式
- `startTime`: HH:MM形式
- `endTime`: HH:MM形式
- `duration`: HH:MM形式
- `staff1`: 支援員1
- `staff2`: 支援員2（任意）
- `destination`: 行先
- `serviceType`: サービス種別
- `checkStatus`: 確認状態
- `notes`: 備考

### monthly_hours
- ドキュメントID: `user_{userId}_{YYYY}-{MM}`
- `userId`: 利用者ID（数値）
- `year`: 年（数値）
- `month`: 月（数値）
- `behaviorSupport`: { used, remaining }
- `mobilitySupport`: { used, remaining }
- `hospitalSupport`: { used, remaining }

## テスト項目

### 認証テスト
- [ ] ログイン成功（正しいID/パスワード）
- [ ] ログイン失敗（間違ったID/パスワード）
- [ ] JWT トークンがsessionStorageに保存されるか
- [ ] 管理者権限の確認（admin.html アクセス）

### データ取得テスト
- [ ] 利用者リストが正しく取得される（時間フィールド有りのみ）
- [ ] 支援員リストが正しく取得される（株式会社ネクストステージのみ）
- [ ] 残時間データが正しく取得される

### 記録保存テスト
- [ ] フォーム送信で記録がcsv-schedulesに保存される
- [ ] 必須項目のバリデーション
- [ ] 時間計算が正しく行われる

### 管理者機能テスト（admin.html）
- [ ] ユーザー一覧が表示される
- [ ] ユーザー追加が成功する
- [ ] ユーザー削除が成功する（adminユーザーは削除不可）
- [ ] 非管理者はadmin.htmlにアクセスできない

## トラブルシューティング

### エラー: "JWT検証エラー"
- JWT_SECRETが正しく設定されているか確認
- トークンの有効期限（24時間）が切れていないか確認

### エラー: "Firestore接続エラー"
- FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_IDが正しく設定されているか確認
- Firestoreサービスアカウントの権限を確認（Firestore管理者権限が必要）

### データが取得できない
- Firestoreコレクション名が正しいか確認
- フィルタリング条件（affiliation, 時間フィールド）を確認

### CORSエラー
- worker.jsのcorsHeadersが正しく設定されているか確認
- OPTIONSリクエストが正しくハンドリングされているか確認

## 注意事項

1. **既存のFirestoreデータは変更しない**
   - employeesコレクション、usersコレクションなど、renaissance-systemと共有しているコレクションは読み取り専用として扱う
   - 新規作成されるのはcsv-schedulesコレクションのみ

2. **パスワードハッシュ**
   - 既存ユーザーのパスワードはFirestore上で既にbcryptハッシュ化されている前提
   - 新規ユーザー追加時は自動的にbcryptハッシュ化される

3. **認証トークン**
   - JWT トークンの有効期限は24時間
   - 有効期限切れの場合は再ログインが必要

4. **管理者権限**
   - roleフィールドが`'admin'`のユーザーのみ管理者機能にアクセス可能
   - adminユーザーは削除不可

## 移行完了日

2025-10-17

## 参考資料

- FIRESTORE_MIGRATION_PLAN.md: 詳細な移行計画
- renaissance-system: 参考実装
