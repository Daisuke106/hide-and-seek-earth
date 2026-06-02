# Git 運用ルール

## コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/) に準拠する。

```
<type>(<scope>): <subject>

<body>（任意）
```

### type一覧

| type | 用途 |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（フォーマットなど） |
| `refactor` | バグ修正でも機能追加でもないリファクタリング |
| `test` | テストの追加・修正 |
| `chore` | ビルドプロセスや補助ツールの変更 |
| `ci` | CI設定の変更 |
| `perf` | パフォーマンス改善 |

### 例

```
feat(auth): ソーシャルログイン機能を追加

GoogleアカウントによるOAuth2認証を実装した。
既存のメール認証は引き続き利用可能。
```

## ブランチ命名規則

```
<type>/<issue-number>-<short-description>

例:
feature/123-add-social-login
fix/456-fix-email-validation
```

## 禁止事項

- `main` / `master` への直接コミット・push
- `--force` オプションの使用（緊急時は責任者の承認が必要）
- 機密情報のコミット（APIキー、パスワードなど）
- `.gitignore` に含まれるファイルのコミット

## .gitignore の管理

- プロジェクト固有の除外設定はリポジトリの `.gitignore` に追加する
- 個人環境固有の除外設定はグローバル `.gitignore` に追加する
