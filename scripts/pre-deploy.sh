#!/bin/bash
# 部署前验证脚本 - 确保代码能编译再 push
set -e

cd "$(dirname "$0")/.."

echo "=== 1. 检查 Git 状态 ==="
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  有未提交的更改，请先 commit"
  git status --short
  exit 1
fi
echo "✅ Git 干净"

echo ""
echo "=== 2. 本地构建测试 ==="
npm run docs:build 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -ne 0 ]; then
  echo "❌ 构建失败！不要 push"
  exit 1
fi
echo "✅ 构建成功"

echo ""
echo "=== 3. 检查调试代码残留 ==="
DEBUG_FOUND=$(grep -rn "console.log\|debug:" docs/.vitepress/theme/ functions/ --include="*.vue" --include="*.js" | grep -v "node_modules" | grep -v ".min." || true)
if [ -n "$DEBUG_FOUND" ]; then
  echo "⚠️  发现调试代码:"
  echo "$DEBUG_FOUND"
fi

echo ""
echo "=== 4. 检查未推送的 commit ==="
git fetch origin main 2>/dev/null || true
AHEAD=$(git rev-list --count origin/main..main 2>/dev/null || echo "?")
echo "本地领先 origin/main: $AHEAD 个 commit"

echo ""
echo "✅ 验证通过，可以 push"
