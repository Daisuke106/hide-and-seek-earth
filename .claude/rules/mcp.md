# MCP (Model Context Protocol) 利用方針

## 概要

MCPサーバーを活用してClaudeが外部サービスと連携できるようにする。
設定は `.claude/settings.json`（プロジェクト共通）と `.claude/settings.local.json`（個人ローカル）で管理する。

## 利用中のMCPサーバー

| サーバー | 用途 | 設定場所 |
|---|---|---|
| github | Issue・PR操作、コード検索 | `.claude/settings.json` |
| Figma | デザインファイル参照・生成 | `.claude/settings.local.json` |
| Google Drive | ドキュメント参照 | `.claude/settings.local.json` |

## 設定ファイルの使い分け

### `.claude/settings.json`（Git管理あり・チーム共通）

- チーム全員が使用するMCPサーバー設定
- APIキー等の機密情報は含めない
- フック設定

### `.claude/settings.local.json`（Git管理なし・個人設定）

- 個人のAPIキーや認証トークン
- 個人用のMCPサーバー設定
- ローカル環境固有の設定

## セキュリティルール

- APIキーやトークンを `.claude/settings.json` に直接記載しない
- 機密情報は必ず `.claude/settings.local.json` または環境変数で管理する
- `.claude/.env.local.example` を参照して必要な環境変数を設定する

## MCP設定を変更する際の注意

1. `.claude/settings.json` を変更したら `.claude/rules/mcp.md`（このファイル）も更新する
2. チームメンバーへの周知を行う
3. `.claude/.env.local.example` も合わせて更新する
