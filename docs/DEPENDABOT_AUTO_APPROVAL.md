# Dependabotのセキュリティ修正を自動承認

`Dependabot Security Auto Approval` は、依存関係の脆弱性修正についてCI結果を確認し、
GitHub Actionsのレビューとして承認します。自動マージ・ブランチ保護の迂回は行いません。

## 承認条件

すべて満たした場合だけ、判定したhead SHAを指定して承認します。

1. main宛て・同一リポジトリ・Dependabot作成の非draft PRで、競合がない。
2. 最新mainを取り込み、全コミットがDependabot作成・GitHub署名検証済みである。
3. 変更がルート／hns-frontendのpackage.json・package-lock.json、ルートのcomposer.json・composer.lockだけである。
4. manifest内の変更も依存定義だけである。scripts・設定・PHPスクリプト・ワークフロー等の変更を含めない。
5. 既存の3ワークフローの**現在のheadに対する最新実行**が成功し、必須ジョブに未実行・スキップがない。
6. 追加のチェック・コミットステータスも成功する。CodeQLの`neutral`だけは既存運用に合わせて許容する。
7. 更新前のパッケージバージョンにGitHub-reviewedアドバイザリが存在し、更新後の対象バージョンには存在しない。
8. 人の変更要求が残っておらず、承認直前にもhead・base・CI結果が変わっていない。

タイトル・日本語表示・ラベルからセキュリティPRだと推定しません。
GitHub公式の公開アドバイザリAPIの`ecosystem`・`affects=package@version`で、
脆弱性修正の実態を確認します。通常のバージョン更新は承認対象外です。
通常更新PRでも実際に脆弱性を解消する場合は対象になります。
PAT・追加のシークレット・Dependabot Alertsの読み取り権限は不要です。

npmとComposerが対象です。GitHub Actionsのバージョン更新や、判断できない形式は手動レビューへ残します。
APIエラー・署名不明・バージョン形式不明も、承認しない方向へ倒します。
GitHub Advisory Databaseに未登録の問題や、コードの意味的な安全性を保証するものではありません。

## CIの補強

- Composer監査は`--locked`で開発用依存も含めます。監査ジョブのインストールではplugins/scriptsを実行しません。
- ルートnpmにも`npm ci`・監査・本番ビルドのジョブを追加します。
- フロントエンドの型検査失敗を`echo`で成功扱いにしません。
- 既存のコード整形・PHP静的解析にある非ブロッキング設定は変更していません。その成功表示だけで解析エラーなしとは判断できません。

必須ジョブ名は`REQUIRED`で明示し、PHPバージョンやワークフロー名を変更した場合は一緒に更新してください。
新しい必須ジョブがmainへ入る前の古いCI結果では、自動承認されません。

## 実行・承認取消

- 3つのCIワークフローの完了、Dependabot PRの作成・更新時に実行します。
- 再試行・別チェックの完了・base更新を取りこぼさないよう、20分間隔でも確認します（GitHubのスケジュール実行は遅延する場合があります）。
- 自動承認済みPRのheadが更新されたり、条件が未達になった場合は、この仕組み自身の承認だけを取り消します。人のレビューは変更しません。
- mainをcheckoutする特権ジョブと、PRをテストする読み取り専用ジョブを分けます。PRのhead/merge ref・成果物・キャッシュを特権ジョブへ読み込みません。
- 判定結果はワークフローログに日本語で出力します。承認レビューには修正したGHSA-IDとコミットSHAを記載します。

GitHub側で「新しいコミットで古い承認を失効」を有効にすると、push直後からの失効も保証できます。
本実装はブランチ保護を変更しません。現状mainにはレビュー必須の保護設定がないため、
この承認はマージを強制的に防ぐ仕組みではなく、CIによる自動レビュー結果として扱ってください。

## 有効化

1. 本PRをmainへマージします。特権ワークフローはmainのコードだけを実行します。
2. Settings → Actions → General → Workflow permissionsで、
   **Allow GitHub Actions to create and approve pull requests**を有効にします。
   既定のトークン権限はReadのままで構いません。
3. Actions → Dependabot Security Auto Approval → Run workflowで、最初は`dry_run=true`を選び、ログを確認できます。

手動実行の`dry_run`既定値はtrueです。自動イベントでは承認と必要な承認取消を実行します。

## ローカル検証

```sh
node --test scripts/tests/dependabot-security-review.test.cjs
# 認証済みghでの読み取り専用実API検証。PR番号を省略すると全対象。
node scripts/dependabot-security-review-dry-run.cjs 194
```

dry-runアダプターはGitHub APIのGETだけを使用し、承認・取消メソッドは常に拒否します。

## 公式資料

- [公開アドバイザリAPI](https://docs.github.com/en/rest/security-advisories/global-advisories)
- [GitHub Actionsの承認権限](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
- [pull_request_targetの安全な使用](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)
