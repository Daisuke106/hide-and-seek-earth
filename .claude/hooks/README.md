# hooks

Claude Code のフック設定ディレクトリです。

フックは `.claude/settings.json` の `hooks` セクションで設定し、特定のイベントに応じてシェルスクリプトを自動実行します。

## フック一覧

| ファイル | タイミング | 説明 |
|---|---|---|
| `check-mcp-doc-sync.sh` | PostToolUse | MCP設定とドキュメントの同期を確認する |
| `pre-push-protected-branches.sh` | PreToolUse | 保護ブランチへのpushを防止する |

## settings.json への登録例

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/pre-push-protected-branches.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/check-mcp-doc-sync.sh"
          }
        ]
      }
    ]
  }
}
```

## 注意事項

- スクリプトには実行権限を付与すること: `chmod +x .claude/hooks/*.sh`
- フックが失敗（exit code 非0）するとツール実行がブロックされる
