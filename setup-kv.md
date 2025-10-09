# Cloudflare KVセットアップ手順

## 1. Cloudflare KVネームスペースの作成

### Cloudflare Dashboardから
1. Cloudflare Dashboardにログイン
2. 左メニューから「Workers & Pages」→「KV」を選択
3. 「Create a namespace」をクリック
4. Namespace name: `attendance-kv`
5. 作成後、Namespace IDをコピー

### Wrangler CLIから（推奨）
```bash
# Wranglerをインストール（未インストールの場合）
npm install -g wrangler

# Cloudflareにログイン
wrangler login

# KVネームスペースを作成
wrangler kv:namespace create "ATTENDANCE_KV"
```

作成されたNamespace IDを`wrangler.toml`に設定してください。

## 2. テスト用ユーザーデータの登録

### Wrangler CLIで登録
```bash
# ユーザー1: test/test123
wrangler kv:key put --binding=ATTENDANCE_KV "user:test" '{"userId":"test","password":"test123","userName":"テストユーザー","role":"user"}' --preview false

# ユーザー2: admin/admin123
wrangler kv:key put --binding=ATTENDANCE_KV "user:admin" '{"userId":"admin","password":"admin123","userName":"管理者","role":"admin"}' --preview false
```

### または、Cloudflare Dashboardから
1. 作成したKVネームスペースを開く
2. 「Add entry」をクリック
3. Key: `user:test`
4. Value:
```json
{
  "userId": "test",
  "password": "test123",
  "userName": "テストユーザー",
  "role": "user"
}
```
5. 保存

同様に `user:admin` も追加します。

## 3. wrangler.tomlの更新

`wrangler.toml`の`YOUR_KV_NAMESPACE_ID`を、作成したNamespace IDに置き換えてください。

```toml
[[kv_namespaces]]
binding = "ATTENDANCE_KV"
id = "ここに実際のNamespace IDを貼り付け"
```

## 4. デプロイ

```bash
# プレビュー（ローカルテスト）
wrangler dev

# 本番デプロイ
wrangler deploy
```

## テストログイン情報

- **ユーザーID**: test
- **パスワード**: test123
- **氏名**: テストユーザー

または

- **ユーザーID**: admin
- **パスワード**: admin123
- **氏名**: 管理者

## QRコード生成

以下のJSON形式でQRコードを生成してください：

```json
{"userId":"test","password":"test123"}
```

または、コロン区切り形式：
```
test:test123
```

QRコード生成サイト: https://www.qr-code-generator.com/
