#!/bin/bash
# MCP設定ファイルとドキュメントの同期を確認するフック
# PostToolUse (Edit/Write) で実行される

SETTINGS_FILE=".claude/settings.json"
MCP_DOC=".claude/rules/mcp.md"

# settings.json が変更された場合、mcp.md との同期を促す
if echo "${CLAUDE_TOOL_INPUT}" | grep -q "${SETTINGS_FILE}"; then
  if [ -f "${MCP_DOC}" ]; then
    echo "警告: ${SETTINGS_FILE} が変更されました。${MCP_DOC} の内容も合わせて更新してください。" >&2
  fi
fi

exit 0
