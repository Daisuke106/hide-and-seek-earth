# Dependabot PRの日本語表示

Dependabot標準設定には、PR本文の出力言語を指定するオプションはありません。
`commit-message.prefix` では接頭辞だけを指定できます。

このリポジトリでは接頭辞を日本語にし、`dependabot-japanese.yml` で
Dependabot PRのタイトルと冒頭の更新概要を日本語にします。
リリースノート・比較リンク・Dependabot操作コマンドは原文を保持します。
翻訳APIや追加のシークレットは不要です。

## 適用範囲

- mainにこのワークフローをマージした後、作成・再オープン・更新・編集されたPRで動作します。
- 作成者が `dependabot[bot]` で、headが同一リポジトリのPRだけを処理します。
- 人が作成したPR、fork、ほかのbotのPRは変更しません。
- タイトルと本文の変更だけで、コミット・CI結果・マージ状態を変更しません。
- 上流の長いリリースノートが本文上限に近いときは、原文を削らずタイトルだけを変更します。
- GitHub Actions自身の編集では再実行せず、同じ概要の重複追記も避けます。

## 安全性と検証

書き込みが必要なため `pull_request_target` を使用しますが、checkoutも
PRコードの実行も行いません。PRのタイトル・本文はデータとしてAPIへ渡し、
シェルやJavaScriptソースへ展開しません。
権限はジョブ内の `pull-requests: write` だけで、外部ActionはコミットSHAで固定します。

```sh
node --test scripts/tests/dependabot-japanese.test.cjs
```

単体更新・グループ更新・再実行・長文・対象外PR・コード風のタイトルを検証します。
このテストは通常の読み取り専用PR CIで実行します。
実際の書き込みワークフローはmainへのマージ後に有効になります。

## 2026-10-24のレビュー

- #174・#176・#177: #145による更新がmainに入り、DependabotがClose済み。
- #178: 最新main向けに#184へ再作成済み。
- #175・#179・#182・#183・#184: 変更差分と監査・テストの成功を確認。
- #180: ESLint 10とeslint-config-react-app 7（ESLint 8必須）が互換性エラー。
- #181: Babel 8等の一括メジャー更新で既存のJest用ESLint設定が失敗。

後者2件は、監査失敗の無視やpeer dependencyの強制無視を行って取り込まず、
対応するLint・型検査・テスト基盤の移行を含む変更として再検討します。
日本語表示の導入によって更新の許可・除外ポリシーは変更しません。

## 公式資料

- [Dependabot設定リファレンス](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)
- [pull_request_targetの安全な使用](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)
