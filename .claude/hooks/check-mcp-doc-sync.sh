#!/bin/bash
# MCP設定ファイルとドキュメントの同期を確認するフック
# PostToolUse (Edit) で実行される

SETTINGS_FILE=".claude/settings.json"
MCP_DOC=".claude/rules/mcp.md"

# stdinからツール入力をJSONとして読み取る（CLAUDE_TOOL_INPUTをフォールバックとして使用）
INPUT=$(cat 2>/dev/null)
if [ -z "${INPUT}" ]; then
  INPUT="${CLAUDE_TOOL_INPUT:-}"
fi

# settings.json が変更された場合、mcp.md との同期を促す
if echo "${INPUT}" | grep -qF "${SETTINGS_FILE}"; then
  if [ -f "${MCP_DOC}" ]; then
    echo "警告: ${SETTINGS_FILE} が変更されました。${MCP_DOC} の内容も合わせて更新してください。" >&2
  fi
fi

exit 0
