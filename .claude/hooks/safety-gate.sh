#!/bin/bash
# MHJ Safety Gate — 위험 명령 차단
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 위험 명령 패턴
if echo "$CMD" | grep -qiE '(rm -rf|DROP TABLE|DROP DATABASE|ALTER TABLE.*DROP|git push.*--force|git push.*-f )'; then
  echo "위험 명령 차단: $CMD" >&2
  exit 2
fi

exit 0
