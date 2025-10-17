# プロジェクトクリーンアップサマリー

## 実施日: 2025-10-17

## クリーンアップの目的

tumiki-recorderプロジェクトのFirestore移行とモバイル最適化が完了したため、不要なファイルの整理とプロジェクト構造の最適化を実施しました。

## 実施内容

### 1. ✅ 未使用ファイルの削除

#### 削除したファイル
- `src/utils/api-client.js` - 未使用のAPIクライアントユーティリティ
  - **理由**: 実装したが使用していない
  - **影響**: なし（どのファイルからもimportされていない）

### 2. ✅ 旧ファイルのアーカイブ化

#### `archive/` ディレクトリに移動
```
archive/
├── worker.js           # 旧勤怠システムWorker
├── attendance.html     # 旧勤怠打刻画面
├── attendance.js       # 旧勤怠打刻スクリプト
└── dashboard.html      # 旧ダッシュボード
```

**理由**:
- これらは勤怠打刻システムの古い実装
- 現在のtumiki-recorderでは使用していない
- 将来的に参照する可能性があるため、削除ではなくアーカイブ

**影響**:
- なし（現在のアプリケーションから参照されていない）

### 3. ✅ ドキュメントの整理

#### `docs/` ディレクトリに統合
全てのMarkdownドキュメントを `docs/` ディレクトリに移動:

```
docs/
├── CLAUDE.md                        # Claude Code設定
├── README.md                        # プロジェクト概要
├── FIRESTORE_MIGRATION_COMPLETE.md # Firestore移行ガイド
├── FIRESTORE_MIGRATION_PLAN.md     # Firestore移行計画
├── MOBILE_OPTIMIZATION.md          # モバイル最適化
├── OPTIMIZATION_IMPROVEMENTS.md    # パフォーマンス最適化
├── MAIN_HTML_MODIFICATIONS.md      # main.html変更履歴
├── setup-kv.md                     # Cloudflare KV設定
├── PROJECT_STRUCTURE.md            # プロジェクト構造ガイド（新規）
└── CLEANUP_SUMMARY.md              # このファイル（新規）
```

**理由**:
- ドキュメントがルートディレクトリに散在していた
- `docs/` に集約することで管理しやすくなる

**新規作成**:
- `PROJECT_STRUCTURE.md` - プロジェクト全体の構造と各ファイルの役割を説明
- `CLEANUP_SUMMARY.md` - このクリーンアップの記録

### 4. ✅ プロジェクト構造の最適化

#### Before（クリーンアップ前）
```
tumiki-recorder/
├── CLAUDE.md
├── README.md
├── FIRESTORE_MIGRATION_COMPLETE.md
├── (その他6個のMDファイル)
├── worker.js                  # 未使用
├── attendance.html/js         # 未使用
├── dashboard.html             # 未使用
├── src/utils/api-client.js    # 未使用
└── (実際に使用するファイル)
```

#### After（クリーンアップ後）
```
tumiki-recorder/
├── docs/                      # 全ドキュメント統合
│   ├── CLAUDE.md
│   ├── README.md
│   ├── PROJECT_STRUCTURE.md   # 新規
│   └── (その他7個のMDファイル)
├── archive/                   # 旧ファイル保管
│   ├── worker.js
│   ├── attendance.html/js
│   └── dashboard.html
├── src/                       # バックエンドコード
│   ├── worker.js
│   └── utils/                 # api-client.js削除済み
└── (実際に使用するファイル)
```

## 削減効果

### ファイル数削減
- **ルートディレクトリのMDファイル**: 8個 → 0個（docs/に移動）
- **未使用ファイル**: 5個削除/アーカイブ

### ディレクトリ構造の明確化
- `docs/` - 全ドキュメント
- `archive/` - 旧実装（参照用）
- `src/` - アクティブなバックエンドコード
- ルート - アクティブなフロントエンドファイルと設定

### メンテナンス性向上
- ドキュメントの場所が明確
- 不要ファイルと実際に使用するファイルが分離
- プロジェクト構造が理解しやすい

## 今後のメンテナンス指針

### ファイル追加時の原則

#### ドキュメント
→ `docs/` に追加

#### バックエンドコード
→ `src/` またはサブディレクトリに追加

#### フロントエンドコード
→ ルートディレクトリ（HTML/JS）

#### 一時ファイル/テスト
→ `.gitignore` に追加するか、`archive/` に移動

### 定期的なクリーンアップ

#### 3ヶ月ごと
- 未使用ファイルのチェック
- ドキュメントの更新確認
- archive/ の整理

#### 機能追加時
- 不要になった旧実装を archive/ に移動
- 関連ドキュメントを更新

## 参照ファイル（削除していない）

### Google Apps Scriptコード
- `code.gs`
- `processBillingCodes.gs`

**理由**:
- Google Sheetsとの連携のため参照用として保持
- tumiki-recorderでは使用していないが、連携先のGASコードとして重要

## 影響範囲確認

### ビルド・デプロイ
- ✅ 影響なし（package.jsonやwrangler.tomlは変更していない）

### 機能
- ✅ 影響なし（実際に使用しているファイルは変更していない）

### ドキュメント
- ✅ 改善（docs/に統合され、見つけやすくなった）

### 開発者体験
- ✅ 改善（プロジェクト構造が明確になった）

## まとめ

今回のクリーンアップにより：

1. ✅ **未使用ファイル削除** - api-client.js削除
2. ✅ **旧実装のアーカイブ化** - 4ファイルをarchive/に移動
3. ✅ **ドキュメント統合** - 全MDファイルをdocs/に集約
4. ✅ **プロジェクト構造明確化** - PROJECT_STRUCTURE.md作成

プロジェクトの保守性が大幅に向上し、新しい開発者がプロジェクトを理解しやすくなりました。
