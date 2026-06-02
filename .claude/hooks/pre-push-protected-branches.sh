#!/bin/bash
# 保護ブランチへの直接commit・pushを防止するフック
# PreToolUse (Bash) で実行される

PROTECTED_BRANCHES=("main" "master")

# stdinからツール入力をJSONとして読み取る
INPUT=$(cat)
COMMAND=$(php -r "\$d=json_decode(file_get_contents('php://stdin'),true); echo \$d['tool_input']['command'] ?? '';" <<< "$INPUT" 2>/dev/null || echo "")

if [ -z "${COMMAND}" ]; then
  exit 0
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# git pushコマンドの検出
if echo "${COMMAND}" | grep -qE "git push"; then
  # force pushの検出
  if echo "${COMMAND}" | grep -qE "(--force|-f)(\s|$)"; then
    echo "エラー: force pushは禁止されています。" >&2
    exit 1
  fi

  for branch in "${PROTECTED_BRANCHES[@]}"; do
    # 現在のブランチが保護ブランチの場合
    if [ "${CURRENT_BRANCH}" = "${branch}" ]; then
      echo "エラー: 保護ブランチ '${branch}' への直接pushは禁止されています。" >&2
      echo "プルリクエストを作成してください。" >&2
      exit 1
    fi
    # ブランチ名を明示したpushの検出 (例: git push origin main, git push origin HEAD:main)
    if echo "${COMMAND}" | grep -qE "git push.+\b${branch}\b"; then
      echo "エラー: 保護ブランチ '${branch}' への直接pushは禁止されています。" >&2
      echo "プルリクエストを作成してください。" >&2
      exit 1
    fi
  done
fi

# git commitコマンドの検出（保護ブランチ上での直接コミット）
if echo "${COMMAND}" | grep -qE "git commit"; then
  for branch in "${PROTECTED_BRANCHES[@]}"; do
    if [ "${CURRENT_BRANCH}" = "${branch}" ]; then
      echo "エラー: 保護ブランチ '${branch}' への直接commitは禁止されています。" >&2
      echo "作業ブランチを作成してください: git checkout -b feature/your-feature" >&2
      exit 1
    fi
  done
fi

exit 0
