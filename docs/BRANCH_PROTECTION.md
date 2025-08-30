# ブランチ保護設定ガイド

## 概要

メインブランチの保護設定により、コードの品質とセキュリティを確保します。

## 設定方法

### 1. GitHubウェブインターフェース（推奨）

1. **リポジトリ設定へアクセス**
   - GitHub リポジトリページの `Settings` タブ
   - 左メニューの `Branches` を選択

2. **ブランチ保護ルールを追加**
   - `Add rule` ボタンをクリック
   - `Branch name pattern`: `main`

3. **推奨設定**

#### プルリクエスト要件
```
✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale PR approvals when new commits are pushed
  ✅ Require review from code owners
```

#### ステータスチェック要件
```
✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Status checks to require:
    - Backend Tests (PHP 8.2)
    - Backend Tests (PHP 8.3) 
    - Frontend Tests
    - Code Quality
    - Dependency Security Check (PRのみ)
```

#### その他の保護設定
```
✅ Require conversation resolution before merging
✅ Require signed commits (オプション)
✅ Include administrators
✅ Restrict pushes that create files larger than 100MB
✅ Allow force pushes: ❌
✅ Allow deletions: ❌
```

### 2. GitHub CLI使用

```bash
# 認証
gh auth login

# スクリプト実行
chmod +x scripts/setup-branch-protection.sh
./scripts/setup-branch-protection.sh
```

## CI/CDジョブ名の対応

| 設定するステータスチェック名 | CI/CDワークフローのジョブ名 |
|------------------------------|-------------------------|
| `Backend Tests (PHP 8.2)`   | `backend-tests` (matrix: php: '8.2') |
| `Backend Tests (PHP 8.3)`   | `backend-tests` (matrix: php: '8.3') |
| `Frontend Tests`             | `frontend-tests` |
| `Code Quality`               | `code-quality` |
| `Dependency Security Check`  | `dependency-check` |

## 開発ワークフロー

### 1. 新機能開発
```bash
# フィーチャーブランチ作成
git checkout -b feature/new-feature

# 開発・コミット
git add .
git commit -m "Add new feature"

# プッシュ
git push origin feature/new-feature
```

### 2. プルリクエスト作成
- GitHub上でPR作成
- 自動でCI/CDが実行される
- 全てのステータスチェックが通過するまで待機

### 3. レビュー・マージ
- 必要な承認を取得
- 会話の解決
- `Squash and merge` または `Merge pull request`

## 緊急時の対応

### 管理者による緊急マージ
1. Settings > Branches で一時的にルールを無効化
2. 緊急修正をマージ
3. **必ずルールを再有効化**

### ホットフィックス
```bash
# ホットフィックスブランチ
git checkout -b hotfix/critical-fix main

# 修正・テスト
# 通常のPRプロセスを経てマージ
```

## トラブルシューティング

### ステータスチェックが見つからない場合
1. CI/CDが少なくとも1回実行されていることを確認
2. ジョブ名がドキュメントと一致していることを確認
3. ブランチ保護設定でステータスチェック名を再設定

### PR作成者が自分でマージできない場合
- `Require review from code owners` が有効な場合
- `CODEOWNERS` ファイルを作成するか、他の承認者を指定

## セキュリティ上の利点

- ✅ **コード品質保証**: 全てのテストとチェックが通過
- ✅ **レビュープロセス**: 最低1名の承認が必要
- ✅ **脆弱性検出**: 依存関係の脆弱性を自動検出
- ✅ **履歴保護**: force pushや削除から保護
- ✅ **自動化**: CI/CDとの連携

---

**注意**: ブランチ保護設定後は、管理者でも直接mainブランチにpushできなくなります。これは意図的な設計です。