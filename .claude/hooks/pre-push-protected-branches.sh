#!/bin/bash
# 保護ブランチへの直接commit・pushを防止するフック
# PreToolUse (Bash) で実行される

PROTECTED_BRANCHES=("main" "master")

# stdinからツール入力をJSONとして読み取る
INPUT=$(cat)
COMMAND=$(php -r '$d=json_decode(file_get_contents("php://stdin"),true); echo $d["tool_input"]["command"] ?? "";' <<< "$INPUT" 2>/dev/null || echo "")

if [ -z "${COMMAND}" ]; then
  exit 0
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# git pushコマンドの検出
if echo "${COMMAND}" | grep -qE "(^|\s)git push(\s|$)"; then
  # force pushの検出 (--force, --force-with-lease, -f を単独フラグとして検出)
  if echo "${COMMAND}" | grep -qE "(^|\s)(--force|--force-with-lease|-f)(\s|$)"; then
    echo "エラー: force pushは禁止されています。" >&2
    exit 2
  fi

  for branch in "${PROTECTED_BRANCHES[@]}"; do
    # 現在のブランチが保護ブランチの場合
    if [ "${CURRENT_BRANCH}" = "${branch}" ]; then
      echo "エラー: 保護ブランチ '${branch}' への直接pushは禁止されています。" >&2
      echo "プルリクエストを作成してください。" >&2
      exit 2
    fi
    # ブランチ名を明示したpushの検出 (例: git push origin main, git push origin HEAD:main)
    # スペースまたは ":" の直後、かつ末尾または空白の前にブランチ名が続くパターンのみ検出し誤検知を防ぐ
    if echo "${COMMAND}" | grep -qE "(^|\s|:)${branch}(\s|$)"; then
      echo "エラー: 保護ブランチ '${branch}' への直接pushは禁止されています。" >&2
      echo "プルリクエストを作成してください。" >&2
      exit 2
    fi
  done
fi

# git commitコマンドの検出（保護ブランチ上での直接コミット）
if echo "${COMMAND}" | grep -qE "(^|\s)git commit(\s|$)"; then
  for branch in "${PROTECTED_BRANCHES[@]}"; do
    if [ "${CURRENT_BRANCH}" = "${branch}" ]; then
      echo "エラー: 保護ブランチ '${branch}' への直接commitは禁止されています。" >&2
      echo "作業ブランチを作成してください: git checkout -b feature/your-feature" >&2
      exit 2
    fi
  done
fi

exit 0
