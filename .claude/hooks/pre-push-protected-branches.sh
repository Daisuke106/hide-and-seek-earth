#!/bin/bash
# 保護ブランチへの直接pushを防止するフック
# PreToolUse (Bash) で実行される

PROTECTED_BRANCHES=("main" "master" "develop" "staging")

# Bashツールの入力からgit pushコマンドを検出
COMMAND="${CLAUDE_TOOL_INPUT}"

if echo "${COMMAND}" | grep -qE "git push"; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

  for branch in "${PROTECTED_BRANCHES[@]}"; do
    if [ "${CURRENT_BRANCH}" = "${branch}" ]; then
      echo "エラー: 保護ブランチ '${branch}' への直接pushは禁止されています。" >&2
      echo "プルリクエストを作成してください。" >&2
      exit 1
    fi
  done

  # force pushの検出
  if echo "${COMMAND}" | grep -qE "\-\-force|\-f "; then
    echo "エラー: force pushは禁止されています。" >&2
    exit 1
  fi
fi

exit 0
