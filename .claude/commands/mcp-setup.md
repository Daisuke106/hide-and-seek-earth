# mcp-setup

MCP（Model Context Protocol）サーバーのセットアップを支援するコマンドです。

## 使い方

```
/mcp-setup
```

## 処理内容

1. 現在の MCP 設定を確認する
2. 必要な MCP サーバーが設定されているか検証する
3. 不足している設定を案内する

## 設定ファイルの場所

- プロジェクト設定: `.claude/settings.json`
- ローカル設定（Git管理外）: `settings.local.json`

## 主な MCP サーバー

| サーバー | 用途 |
|---|---|
| github | GitHubとの連携（Issue, PR操作） |
| Figma | デザインファイルの参照・生成 |
| Google Drive | ドキュメント参照 |

## 注意事項

- APIキーなどの機密情報は `settings.local.json` に記載し、Gitにコミットしない
- `.env.local` の内容を参照すること
