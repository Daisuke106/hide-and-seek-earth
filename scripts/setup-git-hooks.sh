#!/bin/bash
# Gitフックのセットアップスクリプト
# リポジトリをクローン後に一度実行してください

set -e

git config core.hooksPath .githooks
echo "Gitフックをセットアップしました。"
echo "  保護ブランチ (main, master) への直接commit・pushが禁止されます。"
echo "  force pushも禁止されます。"
