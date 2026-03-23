#!/bin/bash
# scope-guard — 보호 대상 파일 수정 차단 (PreToolUse)
PROTECTED_FILE=".claude/protected-files.txt"
[ ! -f "$PROTECTED_FILE" ] && exit 0

INPUT=$(cat)
TARGET=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
[ -z "$TARGET" ] && exit 0

while IFS= read -r line; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  if [[ "$TARGET" == *"$line"* ]]; then
    echo "BLOCKED: $TARGET — 보호 대상 파일입니다 (.claude/protected-files.txt)" >&2
    exit 2
  fi
done < "$PROTECTED_FILE"
exit 0
