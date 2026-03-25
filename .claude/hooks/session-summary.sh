#!/usr/bin/env bash
# Stop hook: 세션 종료 시 요약 출력

cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "─────────────────────────────────────"
echo "세션 종료 요약"
echo "─────────────────────────────────────"

# 변경된 파일
CHANGED=$(git diff --name-only HEAD 2>/dev/null)
STAGED=$(git diff --name-only --cached 2>/dev/null)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null)

if [ -n "$CHANGED" ] || [ -n "$STAGED" ] || [ -n "$UNTRACKED" ]; then
  echo "변경 파일:"
  [ -n "$STAGED" ]    && echo "$STAGED"    | sed 's/^/  [staged] /'
  [ -n "$CHANGED" ]   && echo "$CHANGED"   | sed 's/^/  [unstaged] /'
  [ -n "$UNTRACKED" ] && echo "$UNTRACKED" | sed 's/^/  [new] /'
else
  echo "변경 파일: 없음"
fi

echo "─────────────────────────────────────"
