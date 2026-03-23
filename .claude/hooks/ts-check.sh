#!/bin/bash
# 파일 수정 후 TypeScript 타입 체크
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

if echo "$FILE" | grep -qE '\.(tsx?|jsx?)$'; then
  cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 0
  npx tsc --noEmit --pretty 2>&1 | head -20
fi
exit 0
