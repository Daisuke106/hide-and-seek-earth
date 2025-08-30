#!/bin/bash

# GitHub CLI を使用したブランチ保護設定スクリプト
# 実行前に 'gh auth login' でGitHubにログインしてください

# リポジトリ情報を取得
REPO=$(gh repo view --json name,owner --jq '.owner.login + "/" + .name')

echo "Setting up branch protection for repository: $REPO"

# メインブランチ保護ルールを設定
gh api \
  --method PUT \
  --header "Accept: application/vnd.github.v3+json" \
  "/repos/$REPO/branches/main/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Backend Tests",
      "Frontend Tests", 
      "Code Quality",
      "Basic Security Checks"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
EOF

echo "Branch protection rules applied successfully!"

# 現在の保護設定を確認
echo "Current branch protection settings:"
gh api "/repos/$REPO/branches/main/protection" --jq '.'